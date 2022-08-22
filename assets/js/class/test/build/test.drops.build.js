import InstancedCircle from '../../objects/InstancedCircle.js'
import * as THREE from '../../../lib/three.module.js'
import Shader from '../shader/test.drops.shader.js'
import PublicMethod from '../../../method/method.js'

export default class{
    constructor({renderer, group, size, camera, textures, gpu, comp, images}){
        this.renderer = renderer
        this.group = group
        this.size = size
        this.camera = camera
        this.textures = textures
        this.gpu = gpu
        this.comp = comp
        this.images = images

        this.param = {
            w: 6,
            h: 6,
            count: 6 * 6,
            radius: 3,
            seg: 64,
            vel: {
                min: -0.05,
                max: -0.05
            },
            scaleY: 0.675,
            bgViewScale: 4
        }

        this.tweenTimer = 1600

        this.maxLife = 0.1
        this.collisionRadius = 0.6
        this.momentum = {min: 0.04, max: 0.08}
        this.scale = {min: 0.75, max: 1}

        this.dropVel = Array.from({length: this.param.count}, _ => 0)
        this.life = Array.from({length: this.param.count}, _ => THREE.Math.randFloat(0.01, 0.09))
        this.isOut = Array.from({length: this.param.count}, _ => false)

        this.group.renderOrder = 2

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        this.createDrop()
    }
    // drop
    createDrop(){
        const [_, waterMap] = this.textures
        const {w, h, count, radius, seg, scaleY} = this.param

        const bg = this.createTexture(this.images[0])

        this.drop = new InstancedCircle({
            count,
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
                    size: {value: new THREE.Vector2(w, h)},
                    scaleY: {value: scaleY},
                    bgViewScale: {value: this.param.bgViewScale}
                }
            }
        })

        const {coord, position, param, scale, transition} = this.createDropAttribute(w, h)

        this.drop.setInstancedAttribute('coord', new Float32Array(coord), 2)
        this.drop.setInstancedAttribute('aPosition', new Float32Array(position), 4)
        this.drop.setInstancedAttribute('aParam', new Float32Array(param), 4)
        this.drop.setInstancedAttribute('scale', new Float32Array(scale), 1)
        this.drop.setInstancedAttribute('transition', new Float32Array(transition), 1)

        this.drop.get().renderOrder = 2

        this.group.add(this.drop.get()) 
    }
    createDropAttribute(w, h){
        const coord = []
        const position = []
        const param = []
        const scale = []
        const transition = []

        const width = this.size.obj.w
        const height = this.size.obj.h
        
        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                coord.push(j, i)
                

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
            coord,
            position,
            param,
            scale,
            transition
        }
    }


    // texture
    createTexture(img){
        const canvas = PublicMethod.createTextureFromCanvas({img, width: this.size.el.w, height: this.size.el.h})
        const bg = new THREE.CanvasTexture(canvas)
        return bg
    }


    // tween
    createTween(idx){
        const Trail = this.comp['Trails']

        const position = this.drop.getAttribute('aPosition')
        const param = this.drop.getAttribute('aParam')
        const scale = this.drop.getAttribute('scale')

        const trailPos1 = Trail.trail.getAttribute('aPosition1')
        const trailPos2 = Trail.trail.getAttribute('aPosition2')
        const trailOpacity = Trail.trail.getAttribute('opacity')
        const trailScale = Trail.trail.getAttribute('scale')

        const start = {opacity: 1}
        const end = {opacity: 0}

        const tw = new TWEEN.Tween(start)
        .to(end, this.tweenTimer)
        .onUpdate(() => this.onUpdateTween(idx, trailOpacity, start))
        .onComplete(() => this.onCompleteTween({Trail, idx, position, scale, param, trailPos1, trailPos2, trailOpacity, trailScale}))
        .start()
    }
    onCompleteTween({Trail, idx, position, scale, param, trailPos1, trailPos2, trailOpacity, trailScale}){
        this.isOut[idx] = false
        Trail.trailPlay[idx] = true

        const posArr = position.array
        const scaleArr = scale.array
        const paramArr = param.array

        const trailPosArr1 = trailPos1.array
        const trailPosArr2 = trailPos2.array
        const trailOpacityArr = trailOpacity.array
        const trailScaleArr = trailScale.array
        
        const width = this.size.obj.w
        const height = this.size.obj.h

        const index = idx * 4
        const index2 = idx * 2

        const px = Math.random() * width - width / 2
        const py = Math.random() * height - height / 2
        const vel = 0
        const alivedTime = 0

        const scale1 = THREE.Math.randFloat(this.scale.min, this.scale.max)

        const alpha = 1

        posArr[index + 0] = px
        posArr[index + 1] = py
        posArr[index + 2] = vel
        posArr[index + 3] = alivedTime

        scaleArr[idx] = scale1
        paramArr[index + 1] = alpha
        
        trailPosArr1[index2 + 1] = py
        trailPosArr2[index2 + 1] = py
        trailOpacityArr[idx] = 1
        trailScaleArr[idx] = scale1

        position.needsUpdate = true
        scale.needsUpdate = true
        param.needsUpdate = true
        trailPos1.needsUpdate = true
        trailPos2.needsUpdate = true
        trailScale.needsUpdate = true
    }
    onUpdateTween(idx, trailOpacity, {opacity}){
        const trailOpacityArr = trailOpacity.array
        
        trailOpacityArr[idx] = opacity

        trailOpacity.needsUpdate = true
    }
    // createTween(arr, idx){
    //     const start = {scale: 0.7}
    //     const end = {scale: 1}

    //     const tw = new TWEEN.Tween(start)
    //     .to(end, 150)
    //     .easing(TWEEN.Easing.Back.Out)
    //     .onUpdate(() => this.onUpdateTween(arr, idx, start))
    //     .start()
    // }
    // onUpdateTween(arr, idx, {scale}){
    //     // arr[idx] = PublicMethod.clamp(scale, 0, 1.1)
    //     arr[idx] = scale
    // }


    // resize
    resize(size){
        this.size = size

        const bg = this.createTexture(this.images[0])

        this.drop.setUniform('bg', bg)
        this.drop.setUniform('resolution', new THREE.Vector2(this.size.obj.w, this.size.obj.h))
    }


    // animate
    animate(){
        this.updateDropVelocity()
        this.updateDropAttribute()
    }
    updateDropVelocity(){
        const time = window.performance.now()

        for(let i = 0; i < this.dropVel.length; i++){
            const r = SIMPLEX.noise2D(i * 0.1, time * 0.002)
            const vel = PublicMethod.normalize(r, 0.0, 0.3, -1, 1)
            this.dropVel[i] = vel > 0.15 ? 0 : vel
        }
    }
    updateDropAttribute(){
        const Trail = this.comp['Trails']

        const position = this.drop.getAttribute('aPosition')
        const param = this.drop.getAttribute('aParam')
        const transition = this.drop.getAttribute('transition')
        const scale = this.drop.getAttribute('scale')

        const posArr = position.array
        const scaleArr = scale.array
        const paramArr = param.array

        const {radius} = this.param
        const height = this.size.obj.h
        const halfHeight = height / 2

        for(let i = 0; i < position.count; i++){
            const idx = i * 4

            const dropVel = this.dropVel[i]
            let vel = posArr[idx + 2]
            const life = this.life[i]
            const isOut = this.isOut[i]

            if(isOut) continue

            let px = posArr[idx + 0]
            let py = posArr[idx + 1]
            let alivedTime = posArr[idx + 3]
            const rad = radius * scaleArr[i]
            const scale = scaleArr[i]

            alivedTime += (1 / 60) * 0.01

            if(alivedTime > life){
                vel += THREE.Math.randFloat(this.momentum.min, this.momentum.max)
            }

            py -= dropVel + vel

            if(scale !== 0){

                for(let j = 0; j < position.count; j++){
                    const idx2 = j * 4

                    if(i === j) continue

                    const px2 = posArr[idx2 + 0]
                    const py2 = posArr[idx2 + 1]
                    const rad2 = radius * scaleArr[j]
                    const vel2 = posArr[idx + 2]
                    const scale2 = scaleArr[j]

                    if(scale2 === 0) continue

                    const dist = Math.sqrt((px2 - px) ** 2 + (py2 - py) ** 2)
                    
                    if(dist < (rad + rad2) * this.collisionRadius){
                        if(py < py2){
                            vel = vel2
                            alivedTime = this.maxLife
                            scaleArr[i] += scale2 * 0.1
                            scaleArr[j] = 0
                            paramArr[idx2 + 1] = 0
                            Trail.trailPlay[j] =  false
                        }else{
                            posArr[idx2 + 2] = vel2
                            posArr[idx2 + 3] = this.maxLife
                            scaleArr[j] += scale * 0.1
                            scaleArr[i] = 0
                            paramArr[idx + 1] = 0
                            Trail.trailPlay[i] =  false
                        }
                        continue
                    }
                }

            }

            if(py < -halfHeight - radius * 2){
                this.createTween(i)

                this.isOut[i] = true
            }

            posArr[idx + 0] = px
            posArr[idx + 1] = py
            posArr[idx + 2] = vel
            posArr[idx + 3] = alivedTime
        }

        position.needsUpdate = true
        param.needsUpdate = true
        transition.needsUpdate = true
        scale.needsUpdate = true
    }
}