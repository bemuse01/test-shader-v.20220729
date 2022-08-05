import Particle from '../../objects/particle.js'
import * as THREE from '../../../lib/three.module.js'
import Shader from '../shader/test.child.shader.js'
import Method from '../../../method/method.js'

export default class{
    constructor({renderer, group, size, camera}){
        this.renderer = renderer
        this.group = group
        this.size = size
        this.camera = camera

        this.w = 30
        this.h = 30
        this.count = this.w * this.h
        this.radius = 2
        this.seg = 32

        this.init()
    }


    // init
    init(){
        this.initTexture()
        this.create()
        this.createGPGPU()
    }


    // create
    create(){
        this.tPosition = new THREE.DataTexture(new Float32Array(this.position.flat()), this.w, this.h, THREE.RGBAFormat, THREE.FloatType)
        this.tParam = new THREE.DataTexture(new Float32Array(this.param.flat()), this.w, this.h, THREE.RGBAFormat, THREE.FloatType)
        this.tPosition.needsUpdate = true
        this.tParam.needsUpdate = true

        this.circle = new Particle({
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {
                    color: {value: new THREE.Color(0xffffff)},
                    tPosition: {value: this.tPosition},
                    tParam: {value: this.tParam},
                    cameraConstant: {value: Method.getCameraConstant(this.size.el.h, this.camera)}
                }
            }
        })

        const {coord} = this.createAttribute()
        this.circle.setAttribute('coord', new Float32Array(coord), 2)
        this.circle.setAttribute('position', new Float32Array(this.w * this.h * 3), 3)

        this.group.add(this.circle.get())
    }
    createAttribute(){
        const coord = []
        const {w, h} = this

        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                coord.push(j, i)
            }
        }

        return {
            coord
        }
    }


    // texture
    initTexture(){
        const {position, velocity, param} = this.createTexture()

        this.position = position
        this.velocity = velocity
        this.param = param

        // this.position.needsUpdate = true
        // this.param.needsUpdate = true
    }
    createTexture(){
        const position = []
        const velocity = []
        const param = []
        const width = this.size.obj.w
        const height = this.size.obj.h

        for(let i = 0; i < this.h; i++){
            for(let j = 0; j < this.w; j++){
                const px = Math.random() * width - width / 2
                const py = Math.random() * height - height / 2
                position.push([px, py, 0, 0])

                
                const vy = Math.random() * -0.4 - 0.1
                velocity.push(vy)


                const pointSize = Math.random() * 1 + 1
                param.push([pointSize, 0, 0, 0])
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
        // this.calcPosition = this.gpu.createKernel(function(pos, vel, w, h){
        //     const i = this.thread.x

        //     if(i % 4 === 1){
        //         let posY = pos[i] + vel[Math.floor(i / 4)]

        //         // if(posY < -h / 2) posY = Math.random() * h - h / 2
        //         if(posY < -h / 2) posY = h / 2

        //         return posY
        //     }else if(i % 4 === 0){
        //         const posY = pos[i + 1]

        //         if(posY < -h / 2) return Math.random() * w - w / 2
        //     }

        //     return pos[i]
        // }).setOutput([this.w * this.h * 4])

        // this.detectCollision = this.gpu.createKernel(function(param, pos, row, col, w, h){
        //     const id = this.thread.x
        //     const idx = Math.floor(id / 4)
      
        //     if(id % 4 === 0){
        //         const x1 = pos[id]
        //         const y1 = pos[id + 1]
        //         const rad1 = param[id]

        //         if(rad1 === 0) return 0

        //         for(let i = 0; i < row * col; i++){
        //             const idx2 = i * 4
        //             if(i === idx) continue
    
        //             const x2 = pos[idx2]
        //             const y2 = pos[idx2 + 1]
        //             const rad2 = param[idx2]
    
        //             if(rad2 === 0) continue
    
        //             const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                    
        //             if(dist < rad1 + rad2){
        //                 if(rad1 > rad2) return rad1 + rad2 // * 0.75
        //                 else return 0
        //             }
        //         }
        //     }
       
        //     return param[id]
        // }).setOutput([this.w * this.h * 4])

        this.calcPosition = this.gpu.createKernel(function(pos, vel, width, height){
            const i = this.thread.x
            
            let x = pos[i][0]
            let y = pos[i][1] + vel[i]
            let z = pos[i][2]
            let w = pos[i][3]

            if(y < -height / 2 - 5) y = height / 2 + 5

            return [x, y, z, w]
        }).setOutput([this.w * this.h])

        this.detectCollision = this.gpu.createKernel(function(param, pos, row, col){
            const i = this.thread.x

            const x1 = pos[i][0]
            const y1 = pos[i][1]
            let rad1 = param[i][0]
            let y = param[i][1]
            let z = param[i][2]
            let w = param[i][3]

            if(rad1 > 0){

                for(let i2 = 0; i2 < row * col; i2++){
                    if(i === i2) continue
                    
                    const x2 = pos[i2][0]
                    const y2 = pos[i2][1]
                    const rad2 = param[i2][0]

                    if(rad2 === 0) continue

                    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

                    if(dist < rad1 + rad2){
                        if(i < i2) rad1 += rad2 // * 0.75
                        else{
                            rad1 = 0
                            break
                        }
                    }
                }

            }

            return [rad1, y, z, w]
        }).setOutput([this.w * this.h])
    }
    updatePosition(texture){
        // const {data} = texture.image

        // const res = this.calcPosition(data, this.velocity, this.size.obj.w, this.size.obj.h)
        // texture.image.data = res

        // texture.needsUpdate = true
        const res = this.calcPosition(this.position, this.velocity, this.size.obj.w, this.size.obj.h)
        const toArray = res.map(e => [...e])
        const flatten = toArray.flat()
        
        this.position = toArray

        texture.image.data = new Float32Array(flatten)
        texture.needsUpdate = true
    }
    updateParam(texture){
        const res = this.detectCollision(this.param, this.position, this.w, this.h)
        const toArray = res.map(e => [...e])
        const flatten = toArray.flat()

        this.param = toArray
        
        texture.image.data = new Float32Array(flatten)
        texture.needsUpdate = true
    }


    // animate
    animate(){
        const time = window.performance.now()

        this.updateParam(this.tParam)
        this.updatePosition(this.tPosition)

        // this.circle.setUniform('tPosition', this.position)
        // this.circle.setUniform('tParam', this.param)
    }
}