import InstancedCircle from '../../objects/InstancedCircle.js'
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
        this.circle = new InstancedCircle({
            count: this.count,
            radius: this.radius,
            seg: this.seg,
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
        this.circle.setInstancedAttribute('coord', new Float32Array(coord), 2)
        this.circle.setInstancedAttribute('iPosition', new Float32Array(position), 3)

        console.log(coord)

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

                position.push(x, y, 0)
                coord.push(j, i)
            }
        }

        return {position, coord}
    }


    // gpgpu
    createGPGPU(){
        this.gpuCompute = new GPUComputationRenderer(this.w, this.h, this.renderer)

        this.createpositionVariable()
        this.setpositionVariable()

        this.gpuCompute.init()
    }
    createpositionVariable(){
        const texture = this.gpuCompute.createTexture()

        this.fillpositionVariable(texture, {...this.size})

        console.log(texture.image.data)

        this.positionVariable = new GpgpuVariable({
            gpuCompute: this.gpuCompute,
            textureName: 'tPosition',
            texture,
            shader: Shader.position,
            uniforms: {
                
            }
        })
    }
    fillpositionVariable(texture, {obj}){
        const {data, width, height} = texture.image

        const {w, h} = obj

        for(let j = 0; j < height; j++){
            for(let i = 0; i < width; i++){
                const index = (j * width + i) * 4

                const x = Math.random() * w - w / 2
                const y = Math.random() * h - h / 2

                // position
                data[index] = x
                data[index + 1] = y
                data[index + 2] = 0
                data[index + 3] = 0
            }
        }
    }
    setpositionVariable(){
        this.positionVariable.setDependencies()
    }


    // animate
    animate(){
        this.gpuCompute.compute()

        this.circle.setUniform('tPosition', this.gpuCompute.getCurrentRenderTarget(this.positionVariable.get()).texture)
    }
}