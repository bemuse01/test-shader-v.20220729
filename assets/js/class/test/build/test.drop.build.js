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
            seg: 16,
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
        this.maxCount = 10
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
                    scale: {value: scale1},
                    scaleX: {value: scaleX},
                    opacity: {value: 1},
                    pos: {value: new THREE.Vector2(x, y)}
                }
            }
        })

        drop.alivedTime = 0
        drop.life = THREE.Math.randFloat(0.01, 0.09)
        drop.vel = 0
        drop.momentum = 0
        drop.alive = true

        // const {position, scale} = this.createAttribute(drop.getAttribute('position').count)
        // drop.setAttribute('aPosition', new Float32Array(position), 2)
        // drop.setAttribute('scale', new Float32Array(scale), 1)

        // drop.get().scale.set(scale1 * scaleX, scale1, 1)
        // drop.get().position.set(x, y, 0)

        this.group.add(drop.get())
        
        this.drops.push(drop)
    }
    // createAttribute(count){
    //     const position = []
    //     const scale = []

    //     const width = this.size.obj.w
    //     const height = this.size.obj.h

    //     const x = Math.random() * width - width / 2
    //     const y  = Math.random() * height - height / 2
    //     const scale1 = THREE.Math.randFloat(this.param.scale.min, this.param.scale.max)

    //     for(let i = 0; i < count; i++){
    //         position.push(x, y)
    //         scale.push(scale1)
    //     }

    //     return{
    //         position,
    //         scale
    //     }
    // }


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

            const pos = drop.getUniform('pos')
            const posArr = pos.array

            const scale = drop.getUniform('scale') 
            // const pos = drop.get().position
            const rad = radius * scale

            
            // momentum
            const r = SIMPLEX.noise2D(i * 0.1, time * 0.002)
            const p = PublicMethod.normalize(r, 0.0, 0.3, -1, 1)
            drop.vel = p > 0.15 ? 0 : p

            drop.alivedTime += (1 / 60) * 0.01
            if(drop.alivedTime > drop.life){
                drop.momentum += THREE.Math.randFloat(momentumRange.min, momentumRange.max)
            }

            pos.y -= drop.vel + drop.momentum
            // drop.setUniform('pos', pos)

            // check collision
            if(drop.alive){

                for(let j = 0; j < this.drops.length; j++){
                    if(i === j) continue

                    const drop2 = this.drops[j]

                    if(drop2.alive === false) continue

                    const pos2 = drop2.getUniform('pos')
                    const scale2 = drop2.getUniform('scale')
                    const rad2 = radius * scale2

                    const dist = Math.sqrt((pos2.x - pos.x) ** 2 + (pos2.y - pos.y) ** 2)
                    
                    if(dist < (rad + rad2) * this.collisionRadius){
                        if(pos.y < pos2.y){
                            drop.momentum = drop2.momentum
                            drop.alivedTime = this.maxLife
                            drop.setUniform('scale', scale + scale2 * 0.1)

                            drop2.alive = false
                            drop2.setUniform('opacity', 0)
                        }else{
                            drop2.momentum = drop.momentum
                            drop2.alivedTime = this.maxLife
                            drop2.setUniform('scale', scale2 + scale * 0.1)

                            drop.alive = false
                            drop.setUniform('opacity', 0)
                        }
                        // continue
                    }
                }

            }


            // kill
            if(pos.y < -halfHeight - radius * 2){
                drop.alive = false
            }
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