import InstancedPlane from '../../objects/InstancedPlane.js'
import Plane from '../../objects/plane.js'
import Shader from '../shader/test.trail.shader.js'
import * as THREE from '../../../lib/three.module.js'

export default class{
    constructor({group, size, comp, textures}){
        this.group = group
        this.size = size
        this.textures = textures
        this.child = comp['Child']

        this.row = this.child.parameters[1].row
        this.col = this.child.parameters[1].col

        this.position = this.child.drop.getAttribute('aPosition')
        this.count = this.position.count

        this.objects = []

        // this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        const texture = this.textures[0]
        // const dropPosArr = this.position.array

        // const idx = i * 4
        // const x = dropPosArr[idx]
        // const y = dropPosArr[idx + 1]

        const object = new Plane({
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
                    uTexture: {value: texture},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                }
            }
        })

        // const {opacity} = this.createAttribute(object.getAttribute('position').count)
        // object.setAttribute('opacity', new Float32Array(opacity), 1)

        this.group.add(object.get())

        // this.objects.push(object)
    }
    createAttribute(count){
        const opacity = []

        for(let i = 0; i < count; i++){
            opacity.push(0)
        }

        return{
            opacity
        }
    }
}