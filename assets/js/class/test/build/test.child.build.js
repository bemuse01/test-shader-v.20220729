import InstancedCircle from '../../objects/InstancedCircle.js'
import Particle from '../../objects/particle.js'
import * as THREE from '../../../lib/three.module.js'
import Shader from '../shader/test.child.shader.js'
import {GPUComputationRenderer} from '../../../lib/GPUComputationRenderer.js'
import GpgpuVariable from '../../objects/gpgpuVariable.js'

export default class{
    constructor({renderer, group, size}){
        this.renderer = renderer
        this.group = group
        this.size = size

        this.w = 30
        this.h = 30
        this.count = this.w * this.h
        this.radius = 2
        this.seg = 32

        this.init()
    }


    // init
    init(){
        this.create()
        this.initTexture()
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
                    tPosition: {value: null}
                }
            }
        })

        const {coord, position} = this.createAttribute()
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
        const {position, velocity} = this.createTexture()

        this.position = position
        this.velocity = velocity
    }
    createTexture(){
        const position = []
        const velocity = []
        const width = this.size.obj.w
        const height = this.size.obj.h

        for(let i = 0; i < this.h; i++){
            for(let j = 0; j < this.w; j++){
                const px = Math.random() * width - width / 2
                const py = Math.random() * height - height / 2
                position.push(px, py, 0, 0)

                const vy = Math.random() * -0.1 - 0.1
                velocity.push(vy)
            }
        }

        return{
            position: new THREE.DataTexture(new Float32Array(position), this.w, this.h, THREE.RGBAFormat, THREE.FloatType), 
            velocity
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
            const idx = i % 4

            if(idx === 1){

                let posY = pos[i] + vel[i * 4]

                if(posY < -h / 2) posY = Math.random() * h - h / 2

                return posY

            }else if(idx === 0){

                const posY = pos[i + 1]

                if(posY < -h / 2) return Math.random() * w - w / 2

            }

            return pos[i]
        }).setOutput([this.w * this.h * 4])
    }
    updatePosition(texture){
        const {data} = texture.image

        const res = this.calcPosition(data, this.velocity, this.size.obj.w, this.size.obj.h)
        texture.image.data = res

        texture.needsUpdate = true
    }


    // animate
    animate(){
        const time = window.performance.now()

        this.updatePosition(this.position)

        this.circle.setUniform('tPosition', this.position)
    }
}