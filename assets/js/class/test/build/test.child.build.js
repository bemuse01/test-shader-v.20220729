import Particle from '../../objects/particle.js'
import InstancedCircle from '../../objects/InstancedCircle.js'
import * as THREE from '../../../lib/three.module.js'
import Shader from '../shader/test.child.shader.js'
import Method from '../../../method/method.js'
import TestParam from '../param/test.param.js'
import PublicMethod from '../../../method/method.js'

export default class{
    constructor({renderer, group, size, camera}){
        this.renderer = renderer
        this.group = group
        this.size = size
        this.camera = camera

        this.parameters = [
            {
                w: 70,
                h: 70,
                count: 70 * 70,
                radius: 0.5,
                seg: 64,
                scaleY: 1
            },
            {
                w: 6,
                h: 6,
                count: 6 * 6,
                radius: 2.5,
                seg: 64,
                vel: {
                    min: -0.05,
                    max: -0.05
                },
                scaleY: 0.7
            }
        ]

        this.dropVel = Array.from({length: this.parameters[1].count}, _ => 0)

        this.sources = [
            './assets/src/1.jpg',
            './assets/src/drop_fg2.png'
        ]

        this.init()
    }


    // init
    async init(){
        // this.initRenderObject()
        const textures = await this.getTextures()

        this.create(textures)
        this.createGPGPU()
    }
    initRenderObject(){
        this.renderTarget = new THREE.WebGLRenderTarget(this.size.el.w, this.size.el.h, {formaat: THREE.RGBAFormat})
        // this.renderTarget.samples = 256
        // console.log(this.renderTarget)

        this.rtScene = new THREE.Scene()
        this.rtCamera = new THREE.PerspectiveCamera(TestParam.fov, this.size.el.w / this.size.el.h, TestParam.near, TestParam.far)
        this.rtCamera.position.z = TestParam.pos
    }


    // create
    create(textures){
        this.createDroplet(textures)
        this.createDrop(textures)
    }
    // droplet
    createDroplet(textures){
        const [bg, waterMap] = textures

        const {w, h, count, radius, seg, scaleY} = this.parameters[0]

        const {tPosition, tParam} = this.createDropletTexture()

        this.droplet = new InstancedCircle({
            count,
            radius,
            seg,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.droplet.vertex,
                fragmentShader: Shader.droplet.fragment,
                transparent: true,
                uniforms: {
                    tPosition: {value: tPosition},
                    tParam: {value: tParam},
                    bg: {value: bg},
                    waterMap: {value: waterMap},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    rad: {value: radius},
                    size: {value: new THREE.Vector2(w, h)},
                    scaleY: {value: scaleY}
                }
            }
        })

        const {coord, scale} = this.createDropletAttribute(w, h)

        this.droplet.setInstancedAttribute('coord', new Float32Array(coord), 2)
        this.droplet.setInstancedAttribute('scale', new Float32Array(scale), 1)

        this.group.add(this.droplet.get())
    }
    createDropletAttribute(w, h){
        const coord = []
        const scale = []
        
        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                coord.push(j, i)
                scale.push(Math.random() * 0.25 + 0.75)
            }
        }

        return{
            coord,
            scale
        }
    }
    // drop
    createDrop(textures){
        const [bg, waterMap] = textures
        const {w, h, count, radius, seg, scaleY} = this.parameters[1]

        this.drop = new InstancedCircle({
            count,
            radius,
            seg,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.drop.vertex,
                fragmentShader: Shader.drop.fragment,
                transparent: true,
                uniforms: {
                    bg: {value: bg},
                    waterMap: {value: waterMap},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    rad: {value: radius},
                    size: {value: new THREE.Vector2(w, h)},
                    scaleY: {value: scaleY}
                }
            }
        })

        const {coord, position, param, scale} = this.createDropAttribute(w, h)

        this.drop.setInstancedAttribute('coord', new Float32Array(coord), 2)
        this.drop.setInstancedAttribute('aPosition', new Float32Array(position), 4)
        this.drop.setInstancedAttribute('aParam', new Float32Array(param), 4)
        this.drop.setInstancedAttribute('scale', new Float32Array(scale), 1)

        this.group.add(this.drop.get()) 
    }
    createDropAttribute(w, h){
        const coord = []
        const position = []
        const param = []
        const scale = []

        const width = this.size.obj.w
        const height = this.size.obj.h
        
        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                coord.push(j, i)
                

                const px = Math.random() * width - width / 2
                const py = Math.random() * height - height / 2
                const velocity = 0
                const alivedTime = 0
                position.push(px, py, velocity, alivedTime)


                const alpha = 1
                param.push(0, alpha, 0, 0)


                scale.push(Math.random() * 0.25 + 0.75)
            }
        }

        return{
            coord,
            position,
            param,
            scale
        }
    }


    // texture
    createDropletTexture(){
        const {w, h} = this.parameters[0]

        const position = []
        const param = []
        const width = this.size.obj.w
        const height = this.size.obj.h

        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                const px = Math.random() * width - width / 2
                const py = Math.random() * height - height / 2
                position.push([px, py, 0, 0])

                const size = Math.random() * 0.25 + 0.75
                const alpha = 1
                param.push([size, alpha, 0, 0])
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


    // gpgpu
    createGPGPU(){
        this.gpu = new GPU()

        this.createGpuKernels()
    }
    createGpuKernels(){
        this.detectCollision = this.gpu.createKernel(function(param1, param2, pos1, pos2, height){
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
    updateDroplet(){
        const {count, radius} = this.parameters[0]
        const radius2 = this.parameters[1].radius
        const count2 = this.parameters[1].count

        // const position1 = this.droplet.getUniform('tPosition')
        const position1Arr = this.droplet.getUniform('tPosition').image.data
        const position2Arr = this.drop.getAttribute('aPosition').array

        const param1 = this.droplet.getUniform('tParam')
        const param1Arr = this.droplet.getUniform('tParam').image.data
        const param2Arr = this.drop.getAttribute('aParam').array
        
        this.detectCollision.setOutput([count])
        this.detectCollision.setConstants({
            radius1: radius,
            radius2,
            count2
        })

        const temp = []
        const res = this.detectCollision(param1Arr, param2Arr, position1Arr, position2Arr, this.size.obj.h)

        for(let i = 0; i < res.length; i++) temp.push(...res[i])

        param1.image.data = new Float32Array(temp)
        param1.needsUpdate = true
    }


    // get
    getTextures(){
        return new Promise((resolve, _) => {
            // resolve when loading complete
            const manager = new THREE.LoadingManager(() => resolve(textures))
            
            // bind manager to loader
            const loader = new THREE.TextureLoader(manager)
            
            // load textures
            const textures = this.sources.map(file => loader.load(file))
        })
    }


    // animate
    animate(){
        if(!this.detectCollision) return

        this.updateDropVelocity()
        this.updateDropAttribute()

        this.updateDroplet()

        // this.updateDroplet('detectCollision', tParam1, 0, param1, param2, parameter1, parameter2, position1, position2)
        // this.updateParam('detectCollision2', tParam2, 1, param2, param1, parameter2, parameter1, position2, position1)
        // this.updatePosition(tPosition2, 1)

        // this.renderer.setRenderTarget(this.renderTarget)
        // this.renderer.clear()
        // this.renderer.render(this.rtScene, this.rtCamera)
        // this.renderer.setRenderTarget(null)
    }
    updateDropVelocity(){
        const time = window.performance.now()

        for(let i = 0; i < this.dropVel.length; i++){
            const r = SIMPLEX.noise2D(i * 0.1, time * 0.002)
            const vel = PublicMethod.normalize(r, 0.0, 0.3, -1, 1)
            this.dropVel[i] = vel > 0.2 ? 0 : vel
        }
    }
    updateDropAttribute(){
        const position = this.drop.getAttribute('aPosition')
        const param = this.drop.getAttribute('aParam')

        const posArr = position.array
        const paramArr = param.array

        const {radius} = this.parameters[1]
        const width = this.size.obj.w
        const height = this.size.obj.h
        const halfWidth = width / 2
        const halfHeight = height / 2

        for(let i = 0; i < position.count; i++){
            const idx = i * 4

            const vel1 = this.dropVel[i]
            let vel2 = posArr[idx + 2]
            
            let px = posArr[idx + 0]
            let py = posArr[idx + 1]
            let alivedTime = posArr[idx + 3]

            alivedTime += (1 / 60) * 0.075

            if(Math.random() > 1 - alivedTime){
                vel2 += Math.random() * 0.2 + 0.3
            }

            py -= vel1
            py -= vel2

            if(py < -halfHeight - radius * 2){
                px = Math.random() * width - halfWidth
                py = Math.random() * height - halfHeight
                vel2 = 0
                alivedTime = 0
            }

            posArr[idx + 0] = px
            posArr[idx + 1] = py
            posArr[idx + 2] = vel2
            posArr[idx + 3] = alivedTime
        }

        position.needsUpdate = true
        param.needsUpdate = true
    }
}