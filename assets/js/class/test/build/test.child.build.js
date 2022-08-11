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
                w: 30,
                h: 30,
                count: 30 * 30,
                radius: 0.75,
                seg: 64,
                vel: {
                    min: 0,
                    max: 0
                }
            },
            {
                w: 4,
                h: 4,
                count: 4 * 4,
                radius: 2.25,
                seg: 64,
                vel: {
                    min: 0,
                    max: 0
                }
            }
        ]

        this.sources = [
            './assets/src/1.jpg',
            './assets/src/drop_fg2.png'
        ]

        this.objects = []
        this.positions = []
        this.params = []
        this.velocitys = []

        this.play = true

        this.init()
    }


    // init
    async init(){
        this.initRenderObject()
        const textures = await this.getTextures()

        this.initTexture()
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
        this.parameters.forEach((param, idx) => {
            this.createParticle(textures, param, idx)
        })
    }
    createParticle(textures, param, idx){
        const {w, h, count, radius, seg} = param
        const [texture, waterMap] = textures
        const positionArr = this.positions[idx].flat()
        const paramArr = this.params[idx].flat()

        const tPosition = new THREE.DataTexture(new Float32Array(positionArr), w, h, THREE.RGBAFormat, THREE.FloatType)
        const tParam = new THREE.DataTexture(new Float32Array(paramArr), w, h, THREE.RGBAFormat, THREE.FloatType)
        tPosition.needsUpdate = true
        tParam.needsUpdate = true

        const object = new InstancedCircle({
            count,
            radius,
            seg,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                // blending: THREE.AdditiveBlending,
                uniforms: {
                    color: {value: new THREE.Color(0xffffff)},
                    tPosition: {value: tPosition},
                    tParam: {value: tParam},
                    cameraConstant: {value: Method.getCameraConstant(this.size.el.h, this.camera)},
                    uTexture: {value: texture},
                    waterMap: {value: waterMap},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    rad: {value: radius},
                    size: {value: new THREE.Vector2(w, h)}
                }
            }
        })

        const {coord, seed} = this.createAttribute(w, h, seg)
        object.setInstancedAttribute('coord', new Float32Array(coord), 2)
        object.setInstancedAttribute('seed', new Float32Array(seed), 1)

        this.objects.push(object)

        this.group.add(object.get())        
    }
    createAttribute(w, h, seg){
        const coord = []
        const seed = []

        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                coord.push(j, i)
            }
        }

        for(let i = 0; i < seg + 2; i++){
            seed.push(Math.random())
        }

        return {
            coord,
            seed
        }
    }


    // texture
    initTexture(){
        this.parameters.forEach(parameter => {
            const {position, velocity, param} = this.createTexture(parameter)

            this.positions.push(position)
            this.velocitys.push(velocity)
            this.params.push(param)
        })

        // this.position = position
        // this.velocity = velocity
        // this.param = param

        // this.position.needsUpdate = true
        // this.param.needsUpdate = true
    }
    createTexture(parameter){
        const {w, h, vel} = parameter

        const position = []
        const velocity = []
        const param = []
        const width = this.size.obj.w
        const height = this.size.obj.h

        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                const px = Math.random() * width - width / 2
                const py = Math.random() * height - height / 2
                position.push([px, py, 0, 0])

                
                const vy = THREE.Math.randFloat(vel.min, vel.max)
                velocity.push(vy)


                param.push([1, 1, 1, 1])
            }
        }

        return{
            position, 
            velocity,
            param, 
        }
    }


    // gpgpu
    createGPGPU(){
        this.gpu = new GPU()

        this.createGpuKernels()
    }
    createGpuKernels(){
        this.calcPosition = this.gpu.createKernel(function(pos, vel, width, height, rad){
            const i = this.thread.x
            
            let x = pos[i][0]
            // let y = pos[i][1] + vel[i]
            let y = pos[i][1]
            let z = pos[i][2]
            let w = pos[i][3]

            if(y < -height / 2 - rad * 2) y = height / 2 + rad * 2

            return [x, y, z, w]
        })

        // this.detectCollision = this.gpu.createKernel(function(param, pos, count, height){
        //     const i = this.thread.x

        //     const x1 = pos[i][0]
        //     const y1 = pos[i][1]
        //     let rad1 = param[i][0]
        //     let r = param[i][1]
        //     let g = param[i][2]
        //     let b = param[i][3]

        //     // const y2 = -height / 2
        //     // const c = distance(y1, y2) / height

        //     // rad1 = 1 + (1 - c) * 2
        //     // g = c
        //     // b = c

        //     // if(rad1 > 0){
        //     //     // do not use continue...
        //     //     for(let i2 = 0; i2 < count; i2++){
        //     //         // if(i === i2) continue

        //     //         const x2 = pos[i2][0]
        //     //         const y2 = pos[i2][1]
        //     //         let rad2 = param[i2][0]

        //     //         // if(rad2 === 0) continue

        //     //         const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
        //     //         const rad = (rad1 + rad2) * 0.8

        //     //         // if(dist === 0) continue

        //     //         if(dist < rad && i !== i2 && rad2 !== 0){
        //     //             // r = 1
        //     //             // g = 0
        //     //             // b = 0
        //     //             if(rad1 > rad2){
        //     //                 rad1 += rad2 * 0.1 // * 0.75
        //     //             }
        //     //             else{
        //     //                 rad1 = 0
        //     //                 r = 0
        //     //                 g = 0
        //     //                 b = 0
        //     //                 break
        //     //             }
        //     //         }
        //     //     }

        //     // }

        //     return [rad1, r, g, b]
        // }).setOutput([this.count])
    }
    updatePosition(texture, parameter, idx){
        const {w, h, radius} = parameter
        const position = this.positions[idx]
        const velocity = this.velocitys[idx]

        this.calcPosition.setOutput([w, h])

        const res = this.calcPosition(position, velocity, this.size.obj.w, this.size.obj.h, radius)
        const toArray = res.map(e => [...e])
        const flatten = toArray.flat()
        
        this.positions[idx] = toArray

        texture.image.data = new Float32Array(flatten)
        texture.needsUpdate = true
    }
    updateParam(texture){
        const res = this.detectCollision(this.param, this.position, this.count, this.size.obj.h)
        const toArray = res.map(e => [...e])
        const flatten = toArray.flat()

        this.param = toArray
        
        texture.image.data = new Float32Array(flatten)
        texture.needsUpdate = true

        this.play = false
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

        this.objects.forEach((object, idx) => {
            const parameter = this.parameters[idx]
            const tPosition = object.getUniform('tPosition')

            this.updatePosition(tPosition, parameter, idx)
        })

        this.renderer.setRenderTarget(this.renderTarget)
        this.renderer.clear()
        this.renderer.render(this.rtScene, this.rtCamera)
        this.renderer.setRenderTarget(null)
    }
}