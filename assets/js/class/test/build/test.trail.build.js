import InstancedPlane from '../../objects/InstancedPlane.js'
import Shader from '../shader/test.trail.shader.js'
import * as THREE from '../../../lib/three.module.js'

export default class{
    constructor({group, size, comp, textures}){
        this.group = group
        this.size = size
        this.textures = textures
        this.child = comp['Child']

        this.param = this.child.parameters[1]

        this.trailPlay = Array.from({length: this.param.count}, _ => true)

        this.group.renderOrder = 0

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        const [bg, _, fg] = this.textures
        const {count, radius} = this.param

        const scale = [...this.child.drop.getAttribute('scale').array]

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
        const posArr = this.child.drop.getAttribute('aPosition').array
        const {count} = this.param

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


    // animate
    animate(){
        this.updateTrail()
    }
    updateTrail(){
        const position1 = this.trail.getAttribute('aPosition1')
        const posArr1 = position1.array
        const position2 = this.trail.getAttribute('aPosition2')
        const posArr2 = position2.array
        const dropPosArr = this.child.drop.getAttribute('aPosition').array

        for(let i = 0; i < this.param.count; i++){
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