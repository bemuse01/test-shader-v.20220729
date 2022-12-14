import InstancedCircle from '../../objects/InstancedCircle.js'
import * as THREE from '../../../lib/three.module.js'
import Shader from '../shader/test.droplets.shader.js'
import PublicMethod from '../../../method/method.js'

export default class{
    constructor({group, size, comp, textures, gpu, images}){
        this.group = group
        this.size = size
        this.textures = textures
        this.gpu = gpu
        this.drops = comp['Drops']
        this.images = images

        this.dropsParam = this.drops.param

        // const w = 80
        // const h = 80
        // const w = ~~(this.size.obj.w / 2) > 100 ? 100 : ~~(this.size.obj.w / 2)
        // const h = ~~(this.size.obj.h / 2) > 100 ? 100 : ~~(this.size.obj.h / 2)
        const w = ~~(this.size.el.w / 11) > 100 ? 100 : ~~(this.size.el.w / 11)
        const h = ~~(this.size.el.h / 11) > 100 ? 100 : ~~(this.size.el.h / 11)

        console.log(w * h)
        console.log(w, h)

        this.param = {
            w,
            h,
            count: w * h,
            radius: 0.5,
            seg: 64,
            scaleY: 0.85,
            bgViewScale: 7
        }

        this.scale = {min: 0.5, max: 1.5}

        this.group.renderOrder = 1

        this.init()
    }


    // init
    init(){
        this.create()
        this.createGPGPU()
    }


    // create
    create(){
        const [_, waterMap] = this.textures

        const {w, h, count, radius, seg, scaleY} = this.param

        const bg = this.createTexture(this.images[0])
        const {tPosition, tParam} = this.createTextures()

        this.droplet = new InstancedCircle({
            count,
            radius,
            seg,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {
                    tPosition: {value: tPosition},
                    tParam: {value: tParam},
                    bg: {value: bg},
                    waterMap: {value: waterMap},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    rad: {value: radius},
                    size: {value: new THREE.Vector2(w, h)},
                    scaleY: {value: scaleY},
                    bgViewScale: {value: this.param.bgViewScale}
                }
            }
        })

        const {coord, scale} = this.createAttribute(w, h)

        this.droplet.setInstancedAttribute('coord', new Float32Array(coord), 2)
        this.droplet.setInstancedAttribute('scale', new Float32Array(scale), 1)

        this.droplet.get().renderOrder = 1

        this.group.add(this.droplet.get())
    }
    createAttribute(w, h){
        const coord = []
        const scale = []
        
        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                coord.push(j, i)
                scale.push(THREE.Math.randFloat(this.scale.min, this.scale.max))
            }
        }

        return{
            coord,
            scale
        }
    }


    // texture
    createTextures(){
        const {w, h} = this.param

        const position = []
        const param = []
        const width = this.size.obj.w
        const height = this.size.obj.h

        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                const px = Math.random() * width - width / 2
                const py = Math.random() * height - height / 2
                position.push([px, py, 0, 0])

                // const size = THREE.Math.randFloat(this.scale.min, this.scale.max)
                const alpha = 1
                param.push([0, alpha, 0, 0])
            }
        }

        const tPosition = new THREE.DataTexture(new Float32Array(position.flat()), w, h, THREE.RGBAFormat, THREE.FloatType)
        const tParam = new THREE.DataTexture(new Float32Array(param.flat()), w, h, THREE.RGBAFormat, THREE.FloatType)

        tPosition.needsUpdate = true
        tParam.needsUpdate = true

        return{
            tPosition,
            tParam,
        }
    }
    createTexture(img){
        const canvas = PublicMethod.createTextureFromCanvas({img, width: this.size.el.w, height: this.size.el.h})
        const bg = new THREE.CanvasTexture(canvas)
        return bg
    }


    // gpgpu
    createGPGPU(){
        this.createGpuKernels()
    }
    createGpuKernels(){
        this.detectCollision = this.gpu.createKernel(function(param1, param2, pos1, pos2){
            const i = this.thread.x
            const idx = i * 4
            const rad1 = this.constants.radius1
            const rad2 = this.constants.radius2
            const count2 = this.constants.count2

            const x1 = pos1[idx + 0]
            const y1 = pos1[idx + 1]

            let x = param1[idx + 0]
            let alpha = param1[idx + 1]
            let z = param1[idx + 2]
            let w = param1[idx + 3]

            if(Math.random() > 0.995 && alpha === 0){
                alpha = 1
            }

            if(alpha !== 0){
                // do not use continue...
                for(let i2 = 0; i2 < count2; i2++){
                    const idx2 = i2 * 4
                    const x2 = pos2[idx2 + 0]
                    const y2 = pos2[idx2 + 1]
                    const alpha2 = param2[idx2 + 1]

                    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                    const rad = (rad1 + rad2) * 0.7

                    if(dist < rad && alpha2 !== 0){
                        alpha = 0
                    }
                }

            }

            return [x, alpha, z, w]
        }).setDynamicOutput(true)
    }


     // resize
     resize(size){
        this.size = size

        const bg = this.createTexture(this.images[0])

        this.droplet.setUniform('bg', bg)
        this.droplet.setUniform('resolution', new THREE.Vector2(this.size.obj.w, this.size.obj.h))
    }


    // animate
    animate(){
        this.updateDroplet()
    }
    updateDroplet(){
        const {count, radius} = this.param
        const radius2 = this.dropsParam.radius
        const count2 = this.dropsParam.count

        const position1Arr = this.droplet.getUniform('tPosition').image.data
        const position2Arr = this.drops.drop.getAttribute('aPosition').array

        const param1 = this.droplet.getUniform('tParam')
        const param1Arr = this.droplet.getUniform('tParam').image.data
        const param2Arr = this.drops.drop.getAttribute('aParam').array
        
        this.detectCollision.setOutput([count])
        this.detectCollision.setConstants({
            radius1: radius,
            radius2,
            count2
        })

        const temp = []
        const res = this.detectCollision(param1Arr, param2Arr, position1Arr, position2Arr)

        for(let i = 0; i < res.length; i++) temp.push(...res[i])

        param1.image.data = new Float32Array(temp)
        param1.needsUpdate = true
    }
}