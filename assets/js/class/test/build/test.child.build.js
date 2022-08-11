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
                w: 64,
                h: 64,
                count: 64 * 64,
                radius: 0.5,
                seg: 64,
                vel: {
                    min: 0,
                    max: 0
                }
            },
            {
                w: 6,
                h: 6,
                count: 6 * 6,
                radius: 2.25,
                seg: 64,
                vel: {
                    min: -0.05,
                    max: -0.05
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

                velocity.push(0)

                const size = Math.random() * 0.25 + 0.75
                const v = THREE.Math.randFloat(vel.min, vel.max)
                param.push([size, 1, v, 1])
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
        this.calcPosition = this.gpu.createKernel(function(pos, param, vel, width, height, rad){
            const i = this.thread.x

            const v = vel[i]

            let px = pos[i][0]
            let py = pos[i][1] + v
            let z = pos[i][2]
            let w = pos[i][3]

            if(py < -height / 2 - rad * 3){
                px = Math.random() * width - width / 2
                py = Math.random() * height - height / 2
                // py = height / 2 + rad * 3
            }

            return [px, py, z, w]
        }).setDynamicOutput(true)

        this.detectCollision = this.gpu.createKernel(function(param1, param2, pos1, pos2, height){
            const i = this.thread.x
            const rad1 = this.constants.radius1
            const rad2 = this.constants.radius2
            const count2 = this.constants.count2

            const x1 = pos1[i][0]
            const y1 = pos1[i][1]
            let x = param1[i][0]
            let alpha = param1[i][1]
            let z = param1[i][2]
            let w = param1[i][3]

            if(Math.random() > 0.990 && alpha === 0){
                alpha = 1
            }

            if(alpha !== 0){
                // do not use continue...
                for(let i2 = 0; i2 < count2; i2++){
                    const x2 = pos2[i2][0]
                    const y2 = pos2[i2][1]
                    const alpha2 = param2[i2][1]

                    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                    const rad = (rad1 + rad2) * 0.75

                    if(dist < rad && alpha2 !== 0){
                        alpha = 0
                    }
                }

            }

            return [x, alpha, z, w]
        }).setDynamicOutput(true)

        this.detectCollision2 = this.gpu.createKernel(function(param1, param2, pos1, pos2, height){
            const i = this.thread.x
            const rad1 = this.constants.radius1
            const rad2 = this.constants.radius2
            const count2 = this.constants.count2

            const x1 = pos1[i][0]
            const y1 = pos1[i][1]
            let x = param1[i][0]
            let alpha = param1[i][1]
            let vel = param1[i][2]
            let w = param1[i][3]

            // vel -= 0.1

            if(y1 < -height / 2 - rad1 * 2.5){
                // vel = -
                // vel = Math.random() * -0.2 - 0.1
            }

            // if(Math.random() > 0.995 && alpha === 0){
            //     alpha = 1
            // }

            // if(alpha !== 0){
            //     // do not use continue...
            //     for(let i2 = 0; i2 < count2; i2++){
            //         const x2 = pos2[i2][0]
            //         const y2 = pos2[i2][1]
            //         const alpha2 = param2[i2][1]

            //         const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
            //         const rad = (rad1 + rad2) * 0.7

            //         if(dist < rad && alpha2 !== 0){
            //             // alpha = 0
            //             alive = 0
            //         }
            //     }
            // }

            return [x, alpha, vel, w]
        }).setDynamicOutput(true)
    }
    updatePosition(texture, idx){
        const {count, radius} = this.parameters[idx]
        const position = this.positions[idx]
        const param = this.params[idx]
        const velocity = this.velocitys[idx]

        this.calcPosition.setOutput([count])

        const res = this.calcPosition(position, param, velocity, this.size.obj.w, this.size.obj.h, radius)
        const toArray = res.map(e => [...e])
        const flatten = toArray.flat()
        
        this.positions[idx] = toArray

        texture.image.data = new Float32Array(flatten)
        texture.needsUpdate = true
    }
    updateParam(name, texture, idx, param1, param2, parameter1, parameter2, position1, position2){
        const {count, radius} = parameter1

        this[name].setOutput([count])
        this[name].setConstants({
            radius1: radius,
            radius2: parameter2.radius,
            count2: parameter2.count
        })

        const res = this[name](param1, param2, position1, position2, this.size.obj.h)
        const toArray = res.map(e => [...e])
        const flatten = toArray.flat()

        this.params[idx] = toArray
        
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

        const [object1, object2] = this.objects
        const [parameter1, parameter2] = this.parameters
        const [position1, position2] = this.positions
        const [param1, param2] = this.params

        const tPosition2 = object2.getUniform('tPosition')
        const tParam1 = object1.getUniform('tParam')
        const tParam2 = object2.getUniform('tParam')

        this.updateVelocity(parameter2.count)
        this.updateParam('detectCollision', tParam1, 0, param1, param2, parameter1, parameter2, position1, position2)
        this.updateParam('detectCollision2', tParam2, 1, param2, param1, parameter2, parameter1, position2, position1)
        this.updatePosition(tPosition2, 1)

        this.renderer.setRenderTarget(this.renderTarget)
        this.renderer.clear()
        this.renderer.render(this.rtScene, this.rtCamera)
        this.renderer.setRenderTarget(null)
    }
    updateVelocity(count){
        const time = window.performance.now()

        for(let i = 0; i < count; i++){
            const r = SIMPLEX.noise2D(i * 0.1, time * 0.002)
            const vel = PublicMethod.normalize(r, -0.3, 0.0, -1, 1)
            this.velocitys[1][i] = vel < -0.2 ? 0 : vel
        }
    }
}