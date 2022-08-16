import InstancedPlane from '../../objects/InstancedPlane.js'
import Shader from '../shader/test.trail.shader.js'
import * as THREE from '../../../lib/three.module.js'

export default class{
    constructor({group, size, comp, textures}){
        this.group = group
        this.size = size
        this.textures = textures
        this.child = comp['Child']

        this.position = this.child.drop.getAttribute('aPosition')
        this.count = this.position.count
        this.width = 3

        this.objects = []

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        const texture = this.textures[0]

        this.object = new InstancedPlane({
            count: this.count,
            width: this.width,
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
                    width: {value: this.width}
                }
            }
        })

        const {position} = this.createAttribute()
        this.object.setInstancedAttribute('aPosition', new Float32Array(position), 2)

        this.group.add(this.object.get())
    }
    createAttribute(){
        const position = []

        const dropPosArr = this.position.array

        for(let i = 0; i < this.count; i++){
            const idx = i * 4
            position.push(dropPosArr[idx], dropPosArr[idx + 1])
        }

        return{
            position
        }
    }


    // animate
    animate(){
        const dropPosArr = this.position.array
        const position = this.object.getAttribute('aPosition')

        const positionArr = position.array 

        for(let i = 0; i < this.count; i++){
            const idx = i * 2
            const idx2 = i * 4
            positionArr[idx + 0] = dropPosArr[idx2 + 0]
            positionArr[idx + 1] = dropPosArr[idx2 + 1]
        }

        position.needsUpdate = true
    }
}