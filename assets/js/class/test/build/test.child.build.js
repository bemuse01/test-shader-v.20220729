import InstancedCircle from '../../objects/InstancedCircle.js'
import Particle from '../../objects/particle.js'
import * as THREE from '../../../lib/three.module.js'
import Shader from '../shader/test.child.shader.js'
import {GPUComputationRenderer} from '../../../lib/GPUComputationRenderer.js'
import GpgpuVariable from '../../objects/gpgpuVariable.js'

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
        this.circle = new Particle({
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {
                    color: {value: new THREE.Color(0xffffff)},
                    tPosition: {value: this.position},
                    tParam: {value: this.param}
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

        this.position.needsUpdate = true
        this.param.needsUpdate = true
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
                position.push(px, py, 0, 0)

                
                const vy = Math.random() * -0.4 - 0.1
                velocity.push(vy)


                const pointSize = 10
                param.push(pointSize, 0, 0, 0)
            }
        }

        return{
            position: new THREE.DataTexture(new Float32Array(position), this.w, this.h, THREE.RGBAFormat, THREE.FloatType), 
            velocity,
            param: new THREE.DataTexture(new Float32Array(param), this.w, this.h, THREE.RGBAFormat, THREE.FloatType), 
        }
    }


    // gpgpu
    createGPGPU(){
        this.gpu = new GPU()

        this.createGpuKernels()
    }
    createGpuKernels(){
        this.calcPosition = this.gpu.createKernel(function(pos, vel, w, h){
            const i = this.thread.x

            if(i % 4 === 1){
                let posY = pos[i] + vel[Math.floor(i / 4)]

                // if(posY < -h / 2) posY = Math.random() * h - h / 2
                if(posY < -h / 2) posY = h / 2

                return posY
            }else if(i % 4 === 0){
                const posY = pos[i + 1]

                if(posY < -h / 2) return Math.random() * w - w / 2
            }

            return pos[i]
        }).setOutput([this.w * this.h * 4])

        this.detectCollision = this.gpu.createKernel(function(param, pos, row, col, w, h){
            const id = this.thread.x
            const idx = Math.floor(id / 4)
      

            if(id % 4 === 0){
                const x1 = pos[id]
                const y1 = pos[id + 1]
                const rad1 = param[id]

                if(rad1 === 0) return 0

                for(let i = 0; i < row * col; i++){
                    const idx2 = i * 4
                    if(i === idx) continue
    
                    const x2 = pos[idx2]
                    const y2 = pos[idx2 + 1]
                    const rad2 = param[idx2]
    
                    if(rad2 === 0) continue
    
                    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                    
                    if(dist < rad1 + rad2){
                        if(rad1 > rad2) return (rad1 + rad2) // * 0.75
                        else return 0
                    }
                }
            }
       
            return param[id]
        }).setOutput([this.w * this.h * 4])
    }
    updatePosition(texture){
        const {data} = texture.image

        const res = this.calcPosition(data, this.velocity, this.size.obj.w, this.size.obj.h)
        texture.image.data = res

        texture.needsUpdate = true
    }
    updateParam(texture1, texture2){
        const data1 = texture1.image.data
        const data2 = texture2.image.data

        const res = this.detectCollision(data1, data2, this.w, this.h, this.size.el.w, this.size.el.h)
        texture1.image.data = res

        texture1.needsUpdate = true
    }


    // animate
    animate(){
        const time = window.performance.now()

        this.updatePosition(this.position)
        // this.updateParam(this.param, this.position)

        this.circle.setUniform('tPosition', this.position)
        // this.circle.setUniform('tParam', this.param)
    }
}