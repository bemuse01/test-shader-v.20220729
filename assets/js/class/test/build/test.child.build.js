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
        this.circle.setAttribute('position', position.image.data, 4)
        this.position = position

        this.group.add(this.circle.get())
    }
    createAttribute(){
        const coord = []
        const position = []
        const {w, h} = this
        const width = this.size.obj.w
        const height = this.size.obj.h

        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                const x = Math.random() * width - width / 2
                const y = Math.random() * height - height / 2

                position.push(x, y, 0, 0)
                coord.push(j, i)
            }
        }

        return {
            position: new THREE.DataTexture(new Float32Array(position), w, h, THREE.RGBAFormat, THREE.FloatType), 
            coord
        }
    }


    // gpgpu
    createGPGPU(){
        this.gpu = new GPU()

        this.createGpuKernels()
    }
    createGpuKernels(){
        this.calcPosition = this.gpu.createKernel(function(){
            return Math.random()
        }).setOutput([this.w * this.h * 4])
    }
    updatePosition(texture, vel){
        // const {data, width, height} = texture.image

        const res = this.calcPosition()
        // console.log(res[0])
        // texture.image.data = res
        // texture.needsUpdate = true
    }


    // animate
    animate(){
        const time = window.performance.now()

        this.updatePosition(this.position, -0.1)

        // this.circle.setUniform('tPosition', this.position)
        // this.circle.setUniform('tPosition', this.gpuCompute.getCurrentRenderTarget(this.positionVariable.get()).texture)

        // this.positionVariable.setUniform('time', time)
    }
}