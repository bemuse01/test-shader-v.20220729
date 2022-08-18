import Circle from '../../objects/circle.js'
import * as THREE from '../../../lib/three.module.js'

export default class{
    constructor({group, size, textures}){
        this.group = group
        this.textures = textures

        this.param = {
            w: 5,
            h: 5,
            maxCount: 5 * 5,
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
        // this.dropVel = Array.from({length: this.param.count}, _ => 0)
        // this.life = Array.from({length: this.param.count}, _ => THREE.Math.randFloat(0.01, 0.09))
        // this.alivedTime = Array.from({length: this.param.count}, _ => 0)

        this.init()
    }


    // init
    init(){
    }


    // create
    create(){
        const [bg, waterMap] = this.textures
        const {radius, seg, scale, scaleX} = this.param

        const width = this.size.obj.w
        const height = this.size.obj.h

        const scale1 = THREE.Math.randFloat(scale.min, scale.max)
        const x = Math.random() * width - width / 2
        const y = Math.radnom() * height - height / 2

        const drop = new Circle({
            radius,
            seg,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.drop.vertex,
                fragmentShader: Shader.drop.fragment,
                transparent: true,
                uniforms: {
                    bg: {value: bg},
                    waterMap: {value: waterMap},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    rad: {value: radius},
                    size: {value: new THREE.Vector2(w, h)},
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

        drop.get().scale.set(scale1 * scaleX, scale1, 1)
        drop.get().position.set(x, y, 0)

        // const {position, param, scale, transition} = this.createDropAttribute(w, h)

        // drop.setAttribute('aPosition', new Float32Array(position), 4)
        // drop.setAttribute('aParam', new Float32Array(param), 4)
        // drop.setAttribute('scale', new Float32Array(scale), 1)
        // drop.setAttribute('transition', new Float32Array(transition), 1)

        this.group.add(drop.get())
        
        this.drops.add(drop)
    }
    createAttribute(w, h){
        const position = []
        const param = []
        const scale = []
        const transition = []

        const width = this.size.obj.w
        const height = this.size.obj.h
        
        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                const px = Math.random() * width - width / 2
                const py = Math.random() * height - height / 2
                const velocity = 0
                const alivedTime = 0
                position.push(px, py, velocity, alivedTime)


                const alpha = 1
                param.push(0, alpha, 0, 0)


                scale.push(THREE.Math.randFloat(this.scale.min, this.scale.max))
            

                transition.push(1)
            }
        }

        return{
            position,
            param,
            scale,
            transition
        }
    }


    // animate
    animate(){

    }
    updateDropAttribute(){
        const time = window.performance.now()

        // const crtTime = window.performance.now()

        // const position = this.drop.getAttribute('aPosition')
        // const param = this.drop.getAttribute('aParam')
        // const transition = this.drop.getAttribute('transition')
        // const scale = this.drop.getAttribute('scale')

        // const posArr = position.array
        // const scaleArr = scale.array
        // const paramArr = param.array
        // const transitionArr = transition.array

        const {momentumRange, radius} = this.param
        const width = this.size.obj.w
        const height = this.size.obj.h
        const halfWidth = width / 2
        const halfHeight = height / 2

        // for(let i = 0; i < position.count; i++){
        //     const idx = i * 4

        //     const dropVel = this.dropVel[i]
        //     let vel = posArr[idx + 2]
        //     const life = this.life[i]

        //     let px = posArr[idx + 0]
        //     let py = posArr[idx + 1]
        //     let alivedTime = posArr[idx + 3]
        //     const rad = radius * scaleArr[i]
        //     const scale = scaleArr[i]

        //     alivedTime += (1 / 60) * 0.01

        //     if(alivedTime > life){
        //         vel += THREE.Math.randFloat(this.momentum.min, this.momentum.max)
        //     }

        //     py -= dropVel + vel

        //     if(scale !== 0){

        //         for(let j = 0; j < position.count; j++){
        //             const idx2 = j * 4

        //             if(i === j) continue

        //             const px2 = posArr[idx2 + 0]
        //             const py2 = posArr[idx2 + 1]
        //             const rad2 = radius * scaleArr[j]
        //             const vel2 = posArr[idx + 2]
        //             const scale2 = scaleArr[j]

        //             if(scale2 === 0) continue

        //             const dist = Math.sqrt((px2 - px) ** 2 + (py2 - py) ** 2)
                    
        //             if(dist < (rad + rad2) * this.collisionRadius){
        //                 if(py < py2){
        //                     vel = vel2
        //                     alivedTime = this.maxLife
        //                     scaleArr[i] += scale2 * 0.1
        //                     scaleArr[j] = 0
        //                     paramArr[idx2 + 1] = 0
        //                 }else{
        //                     posArr[idx2 + 2] = vel2
        //                     posArr[idx2 + 3] = this.maxLife
        //                     scaleArr[j] += scale * 0.1
        //                     scaleArr[i] = 0
        //                     paramArr[idx + 1] = 0
        //                 }
        //                 continue
        //             }
        //         }

        //     }

        //     if(py < -halfHeight - radius * 2){
        //         px = Math.random() * width - halfWidth
        //         py = Math.random() * height - halfHeight
        //         vel = 0
        //         alivedTime = 0
        //         scaleArr[i] = THREE.Math.randFloat(this.scale.min, this.scale.max)
        //         paramArr[idx + 1] = 1

        //         // this.createTrail(i)
        //         // this.createTween(transitionArr, i)
        //     }

        //     posArr[idx + 0] = px
        //     posArr[idx + 1] = py
        //     posArr[idx + 2] = vel
        //     posArr[idx + 3] = alivedTime
        // }

        // position.needsUpdate = true
        // param.needsUpdate = true
        // transition.needsUpdate = true
        // scale.needsUpdate = true
        

        for(let i = 0; i < this.drops.length; i++){
            const drop = this.drops[i]
            const pos = drop.get().position
            const rad = radius * drop.scale

            
            // momentum
            const r = SIMPLEX.noise2D(i * 0.1, time * 0.002)
            const p = PublicMethod.normalize(r, 0.0, 0.3, -1, 1)
            drop.vel = p > 0.15 ? 0 : p

            drop.alivedTime += (1 / 60) * 0.01
            if(alivedTime > life){
                drop.momentum += THREE.Math.randFloat(momentumRange.min, momentumRange.max)
            }

            pos.y -= drop.vel + drop.momentum


            // check collision
            if(drop.alive){

                for(let j = 0; j < this.drops.length; j++){
                    if(i === j) continue

                    const drop2 = this.drops[j]
                    const pos2 = drop2.get().position
                    const rad2 = radius * drop.scale2

                    const dist = Math.sqrt((pos2.x - pos.x) ** 2 + (pos2.y - pos2.y) ** 2)
                    
                    if(dist < (rad + rad2) * this.collisionRadius){
                        if(pos.y < pos2.y){
                            drop.momentum = drop2.momentum
                            drop.alivedTime = this.maxLife
                            drop.scale += drop.scale2 * 0.1

                            drop2.alive = false
                        }else{
                            drop2.momentum = drop.momentum
                            drop2.alivedTime = this.maxLife
                            drop2.scale += drop.scale * 0.1

                            drop.alive = false
                        }
                        // continue
                    }
                }

            }


            // kill
            if(py < -halfHeight - radius * 2){
                drop.alive = false
            }
        }
    }
    removeDrop(){
        this.drops = this.drops.filter(drop => drop.alive === true)
    }
}