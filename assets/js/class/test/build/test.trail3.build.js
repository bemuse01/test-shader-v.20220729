import Plane from '../../objects/plane.js'
import Shader from '../shader/test.trail3.shader.js'
import * as THREE from '../../../lib/three.module.js'

export default class{
    constructor({group, size, comp}){
        this.group = group
        this.size = size
        this.child = comp['Child']

        this.position = this.child.drop.getAttribute('aPosition')
        this.count = this.position.count

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        const {position} = this.createUniform()

        this.object = new Plane({
            width: this.size.obj.w,
            widthSeg: 1,
            height: this.size.obj.h,
            heightSeg: 1,
            materialName: 'ShaderMaterial',
            materialOpt: {
                // map: this.texture,
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {
                //     uTexture: {value: texture},
                    oResolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    uPosition: {value: position},
                    eResolution: {value: new THREE.Vector2(this.size.el.w, this.size.el.h)},
                }
            }
        })

        this.group.add(this.object.get())
    }
    createUniform(){
        const position = []
        const posArr = this.position.array

        for(let i = 0; i < this.count; i++){
            const idx = i * 4
            position.push(new THREE.Vector2(posArr[idx], posArr[idx + 1]))
        }

        return{
            position
        }
    }


    // animate
    animate(){
        const {position} = this.createUniform()

        this.object.setUniform('uPosition', position)
    }
}