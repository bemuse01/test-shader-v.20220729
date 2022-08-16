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
    create(){
        const texture = this.textures[0]
        const dropPosArr = this.position.array

        for(let i = 0; i < this.count; i++){
            const idx = i * 4
            const x = dropPosArr[idx]
            const y = dropPosArr[idx + 1]

            const object = new Plane({
                count: this.count,
                width: this.width,
                widthSeg: 1,
                height: this.size.obj.h,
                heightSeg: this.seg,
                materialName: 'ShaderMaterial',
                materialOpt: {
                    vertexShader: Shader.vertex,
                    fragmentShader: Shader.fragment,
                    transparent: true,
                    uniforms: {
                        uTexture: {value: texture},
                        resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                        width: {value: this.width},
                        posX: {value: x},
                        posY: {value: y}
                    }
                }
            })

            const {opacity} = this.createAttribute(object.getAttribute('position').count)
            object.setAttribute('opacity', new Float32Array(opacity), 1)

            this.group.add(object.get())

            this.objects.push(object)
        }
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
        const dropPosArr = this.position.array
        
        this.objects.forEach((object, i) => {
            const idx = i * 4
            const x = dropPosArr[idx + 0]
            const y = dropPosArr[idx + 1]

            const position = object.getAttribute('position')
            const posArr = position.array
            const opacity = object.getAttribute('opacity')
            const {count} = opacity
            const opacityArr = opacity.array
            // const dist = (y + (this.size.obj.h / 2)) / this.size.obj.h
            // const crtOpacityIdx = ~~((count / 2) - dist * (count / 2))

            // opacityArr[crtOpacityIdx + 0] = 1
            // opacityArr[crtOpacityIdx + 1] = 1

            for(let j = 0; j < count / 2; j++){
                const idx2 = j * 2

                const cy = posArr[idx * 3 + 1]
                // const dist = cy - y

                if(y < cy){
                    opacityArr[idx2 + 0] = 1
                    opacityArr[idx2 + 1] = 1
                }

                // if(dist < 0.1){
                //     opacityArr[idx2 + 0] = 1
                //     opacityArr[idx2 + 1] = 1
                // }

                opacityArr[idx2 + 0] -= 0.02
                opacityArr[idx2 + 1] -= 0.02

                if(opacityArr[idx2 + 0] < 0) opacityArr[idx2 + 0] = 0
                if(opacityArr[idx2 + 1] < 0) opacityArr[idx2 + 1] = 0
            }

            object.setUniform('posX', x)
            object.setUniform('posY', y)

            opacity.needsUpdate = true
        })
    }
    updateAttribute(){

    }
}