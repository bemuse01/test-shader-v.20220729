import { Vector2 } from '../../../lib/three.module.js'
import Shader from '../shader/test.plane.shader.js'
import Plane from '../../objects/plane.js'

export default class{
    constructor({renderer, group, size, comp}){
        this.renderer = renderer
        this.group = group
        this.size = size
        this.tBase = comp['Bg'].renderTarget.texture
        this.tDiffuse = comp['Child'].renderTarget.texture

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        this.plane = new Plane({
            width: this.size.obj.w,
            widthSeg: 1,
            height: this.size.obj.h,
            heightSeg: 1,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {
                    tBase: {value: this.tBase},
                    tDiffuse: {value: this.tDiffuse},
                    uRes: {value: new Vector2(this.size.el.w, this.size.el.h)}
                },
            }
        })

        this.group.add(this.plane.get())
    }
}