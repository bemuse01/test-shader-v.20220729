import { DataTexture, FloatType, RGBAFormat } from '../../../lib/three.module.js'
import Particle from '../../objects/particle.js'
import Shader from '../shader/test.particle.shader.js'

export default class{
    constructor({group, size}){
        this.group = group
        this.size = size

        this.w = 3
        this.h = 3

        this.init()
    }


    // init
    init(){
        this.create()
    }

    
    // create
    create(){
        const {position} = this.createTexture()
        const {coord} = this.createAttribute()

        position.needsUpdate = true

        this.particle = new  Particle({
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {
                    tPosition: {value: position},
                    oResolution: {value: this.size.obj},
                    eResolution: {value: this.size.el}
                }
            }
        })

        this.particle.setAttribute('position', new Float32Array(this.w * this.h * 3), 3)
        this.particle.setAttribute('coord', new Float32Array(coord), 2)

        this.group.add(this.particle.get())
    }
    createAttribute(){
        const coord = []
        
        for(let i = 0; i < this.h; i++){
            for(let j = 0; j < this.w; j++){
                coord.push(j, i)
            }
        }

        return {coord}
    }
    createTexture(){
        const position = []

        const {w, h} = this.size.obj

        for(let i = 0; i < this.h; i++){
            for(let j = 0; j < this.w; j++){
                const x = (Math.random() * w - w / 2) * 0.2
                const y = (Math.random() * h - h / 2) * 0.2
                position.push(x, y, 0, 0)
            }
        }

        return {
            position: new DataTexture(new Float32Array(position), this.w, this.h, RGBAFormat, FloatType)
        }
    }
}