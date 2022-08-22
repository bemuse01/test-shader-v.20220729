import InstancedPlane from '../../objects/InstancedPlane.js'
import Shader from '../shader/test.trail.shader.js'
import * as THREE from '../../../lib/three.module.js'
import PublicMethod from '../../../method/method.js'

export default class{
    constructor({group, size, comp, textures, images}){
        this.group = group
        this.size = size
        this.textures = textures
        this.images = images
        this.drops = comp['Drops']

        this.dropsParam = this.drops.param

        this.trailPlay = Array.from({length: this.dropsParam.count}, _ => true)

        this.group.renderOrder = 0

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        const [_, __, fg] = this.textures
        const {count, radius} = this.dropsParam

        const bg = this.createTexture(this.images[0])

        const scale = [...this.drops.drop.getAttribute('scale').array]

        this.trail = new InstancedPlane({
            count: count,
            width: radius,
            height: 0,
            widthSeg: 1,
            heightSeg: 1,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {
                    uBg: {value: bg},
                    uFg: {value: fg},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    eResolution: {value: new THREE.Vector2(this.size.el.w, this.size.el.h)},
                }
            }
        })

        const {position1, position2, opacity} = this.createAttribute()
        this.trail.setInstancedAttribute('aPosition1', new Float32Array(position1), 2)
        this.trail.setInstancedAttribute('aPosition2', new Float32Array(position2), 2)
        this.trail.setInstancedAttribute('opacity', new Float32Array(opacity), 1)
        this.trail.setInstancedAttribute('scale', new Float32Array(scale), 1)

        this.trail.get().renderOrder = 0

        this.group.add(this.trail.get())
    }
    createAttribute(){
        const position1 = []
        const position2 = []
        const opacity = []
        const posArr = this.drops.drop.getAttribute('aPosition').array
        const {count} = this.dropsParam

        for(let i = 0; i < count; i++){
            const idx = i * 4
            const x = posArr[idx + 0]
            const y = posArr[idx + 1]
            position1.push(x, y)
            position2.push(x, y)

            opacity.push(1)
        }

        return{
            position1,
            position2,
            opacity
        }
    }


    // texture
    createTexture(img){
        const canvas = PublicMethod.createTextureFromCanvas({img, width: this.size.el.w, height: this.size.el.h})
        const bg = new THREE.CanvasTexture(canvas)
        return bg
    }


    // resize
    resize(size){
        this.size = size

        const bg = this.createTexture(this.images[0])

        this.trail.setUniform('uBg', bg)
        this.trail.setUniform('resolution', new THREE.Vector2(this.size.obj.w, this.size.obj.h))
        this.trail.setUniform('eResolution', new THREE.Vector2(this.size.el.w, this.size.el.h))
    }


    // animate
    animate(){
        this.updateTrail()
    }
    updateTrail(){
        const position1 = this.trail.getAttribute('aPosition1')
        const posArr1 = position1.array
        const position2 = this.trail.getAttribute('aPosition2')
        const posArr2 = position2.array
        const dropPosArr = this.drops.drop.getAttribute('aPosition').array

        for(let i = 0; i < this.dropsParam.count; i++){
            if(!this.trailPlay[i]) continue 

            const idx = i * 2
            const idx2 = i * 4

            const px = dropPosArr[idx2 + 0]
            const py = dropPosArr[idx2 + 1]

            posArr1[idx + 0] = px 
            posArr2[idx + 0] = px

            posArr1[idx + 1] -= 0
            posArr2[idx + 1] = py

            if(py >= posArr1[idx + 1]) posArr1[idx + 1] = py
        }

        position1.needsUpdate = true
        position2.needsUpdate = true
    }
}