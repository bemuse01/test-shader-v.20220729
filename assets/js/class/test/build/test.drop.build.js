import Circle from '../../objects/circle.js'
import * as THREE from '../../../lib/three.module.js'
import Shader from '../shader/test.drop.shader.js'
import PublicMethod from '../../../method/method.js'

export default class{
    constructor({group, size, textures}){
        this.group = group
        this.size = size
        this.textures = textures

        this.param = {
            radius: 2.5,
            seg: 32,
            vel: {
                min: -0.05,
                max: -0.05
            },
            scaleX: 0.675,
            momentumRange: {
                min: 0.04,
                max: 0.08
            },
            scale: {
                min: 0.75,
                max: 1
            }
        }

        this.drops = []
        this.maxLife = 0.1
        this.collisionRadius = 0.6
        this.maxCount = 25
        this.intervalTime = 1000

        // this.dropVel = Array.from({length: this.param.count}, _ => 0)
        // this.life = Array.from({length: this.param.count}, _ => THREE.Math.randFloat(0.01, 0.09))
        // this.alivedTime = Array.from({length: this.param.count}, _ => 0)

        this.init()
    }


    // init
    init(){
        setInterval(() => {
            const currentCount = this.drops.length
            if(currentCount >= this.maxCount) return

            this.create()

        }, this.intervalTime)
    }


    // create
    create(){
        const [bg, waterMap] = this.textures
        const {radius, seg, scale, scaleX} = this.param

        const width = this.size.obj.w
        const height = this.size.obj.h

        const scale1 = THREE.Math.randFloat(scale.min, scale.max)
        const x = Math.random() * width - width / 2
        const y = Math.random() * height - height / 2

        const drop = new Circle({
            radius,
            seg,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {
                    bg: {value: bg},
                    waterMap: {value: waterMap},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    rad: {value: radius},
                    // size: {value: new THREE.Vector2(w, h)},
                    // scale: {value: scale1},
                    // scaleY: {value: scaleY},
                    opacity: {value: 1},
                    pos: {value: new THREE.Vector2(x, y)}
                }
            }
        })

        drop.alivedTime = 0
        drop.life = THREE.Math.randFloat(0.01, 0.09)
        drop.vel = 0
        drop.momentum = 0
        drop.scale = scale1
        drop.alive = true

        const {position} = this.createAttribute(drop.getAttribute('position').count)
        drop.setAttribute('aPosition', new Float32Array(position), 2)

        drop.get().scale.set(scale1 * scaleX, scale1, 1)
        // drop.get().position.set(x, y, 0)

        this.group.add(drop.get())
        
        this.drops.push(drop)
    }
    createAttribute(count){
        const position = []
        const scale = []

        const width = this.size.obj.w
        const height = this.size.obj.h

        const x = Math.random() * width - width / 2
        const y  = Math.random() * height - height / 2

        for(let i = 0; i < count; i++){
            position.push(x, y)
        }

        return{
            position
        }
    }


    // animate
    animate(){
        this.updateDrop()
        this.removeDrop()
    }
    updateDrop(){
        const time = window.performance.now()

        const {momentumRange, radius} = this.param
        const height = this.size.obj.h
        const halfHeight = height / 2

        for(let i = 0; i < this.drops.length; i++){
            const drop = this.drops[i]
            const pos = drop.getAttribute('aPosition')
            const posArr = pos.array
            // const pos = drop.get().position
            const rad = radius * drop.scale

            
            // momentum
            const r = SIMPLEX.noise2D(i * 0.1, time * 0.002)
            const p = PublicMethod.normalize(r, 0.0, 0.3, -1, 1)
            drop.vel = p > 0.15 ? 0 : p

            drop.alivedTime += (1 / 60) * 0.01
            if(drop.alivedTime > drop.life){
                drop.momentum += THREE.Math.randFloat(momentumRange.min, momentumRange.max)
            }

            // pos.y -= drop.vel + drop.momentum
            for(let j = 0; j < pos.count; j++){
                const idx = j * 2
                posArr[idx + 1] -= drop.vel + drop.momentum
            }

            // drop.setUniform('pos', new THREE.Vector2(pos.x, pos.y))

            const x = posArr[0]
            const y = posArr[1]

            // check collision
            if(drop.alive){

                for(let j = 0; j < this.drops.length; j++){
                    if(i === j) continue

                    const drop2 = this.drops[j]
                    const pos2 = drop2.getAttribute('aPosition')
                    const posArr2 = pos2.array
                    const x2 = posArr2[0]
                    const y2 = posArr2[1]
                    // const pos2 = drop2.get().position
                    const rad2 = radius * drop2.scale

                    const dist = Math.sqrt((x2 - x) ** 2 + (y2 - y) ** 2)
                    
                    if(dist < (rad + rad2) * this.collisionRadius){
                        if(y < y2){
                            drop.momentum = drop2.momentum
                            drop.alivedTime = this.maxLife
                            drop.scale += drop.scale2 * 0.1

                            drop2.alive = false
                            drop2.setUniform('opacity', 0)
                        }else{
                            drop2.momentum = drop.momentum
                            drop2.alivedTime = this.maxLife
                            drop2.scale += drop.scale * 0.1

                            drop.alive = false
                            drop.setUniform('opacity', 0)
                        }
                        // continue
                    }
                }

            }


            // kill
            if(y < -halfHeight - radius * 2){
                drop.alive = false
            }

            pos.needsUpdate = true
        }
    }
    removeDrop(){
        const temp = this.drops.filter(drop => drop.alive === false)

        temp.forEach(drop => {
            this.group.remove(drop.get())
            drop.dispose()
            // drop.getUniform('bg').dispose()
            // drop.getUniform('waterMap').dispose()
        })

        temp.length = 0

        this.drops = this.drops.filter(drop => drop.alive === true)
    }
}