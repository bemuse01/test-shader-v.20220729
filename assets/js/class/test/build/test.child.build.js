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

        this.createPositionTexture()
        this.setpositionVariable()

        this.gpuCompute.init()
    }
    createPositionTexture(){
        const texture = this.gpuCompute.createTexture()

        this.fillPositionTexture(texture, {...this.size})

        this.positionVariable = new GpgpuVariable({
            gpuCompute: this.gpuCompute,
            textureName: 'tPosition',
            texture,
            shader: Shader.position,
            uniforms: {
                time: {value: 0},
                fres: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                rad: {value: this.radius}
            }
        })
    }
    fillPositionTexture(texture, {obj}){
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
                data[index + 2] = this.radius
                data[index + 3] = 0
            }
        }

        texture.needsUpdate = true
    }
    setpositionVariable(){
        this.positionVariable.setDependencies()
    }


    // animate
    animate(){
        this.gpuCompute.compute()

        const time = window.performance.now()

        this.circle.setUniform('tPosition', this.gpuCompute.getCurrentRenderTarget(this.positionVariable.get()).texture)

        this.positionVariable.setUniform('time', time)
    }
}