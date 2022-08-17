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

        this.position = this.child.drop.getAttribute('aPosition')
        this.count = this.position.count
        this.width = 3
        this.seg = 50

        this.objects = []

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(i){
        const texture = this.textures[0]
        const dropPosArr = this.position.array

        const idx = i * 4
        const x = dropPosArr[idx]
        const y = dropPosArr[idx + 1]

        const object = new Plane({
            count: this.count,
            width: this.width,
            widthSeg: 1,
            height: this.size.obj.h / 2,
            heightSeg: this.seg,
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

        this.group.add(object.get())

        this.objects.push(object)
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


    // animate
    animate(){
        this.objects.forEach(object => {
            const position = object.getAttribute('position')
            const posArr = position.array
            const count = position.count
            const last = (count - 1) * 3
            
            for(let i = 0; i < count; i++){
                if(i === count - 1) continue

                const idx = i * 3
                
                posArr[idx + 1] -= 0.25

                if(posArr[idx + 1] <= posArr[last + 1]) posArr[idx + 1] = posArr[last + 1]
            }

            position.needsUpdate = true
        })
    }
}