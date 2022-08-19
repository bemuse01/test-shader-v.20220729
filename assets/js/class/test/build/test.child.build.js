import Particle from '../../objects/particle.js'
import Plane from '../../objects/plane.js'
import InstancedPlane from '../../objects/InstancedPlane.js'
import InstancedCircle from '../../objects/InstancedCircle.js'
import * as THREE from '../../../lib/three.module.js'
import Shader from '../shader/test.child.shader.js'
import Method from '../../../method/method.js'
import TestParam from '../param/test.param.js'
import PublicMethod from '../../../method/method.js'

export default class{
    constructor({renderer, group, size, camera, textures, gpu}){
        this.renderer = renderer
        this.group = group
        this.size = size
        this.camera = camera
        this.textures = textures
        this.gpu = gpu

        this.parameters = [
            {
                w: 80,
                h: 80,
                count: 80 * 80,
                radius: 0.5,
                seg: 64,
                scaleY: 0.85
            },
            {
                w: 5,
                h: 5,
                count: 5 * 5,
                radius: 3,
                seg: 64,
                vel: {
                    min: -0.05,
                    max: -0.05
                },
                scaleY: 0.675
            }
        ]

        this.maxLife = 0.1
        this.collisionRadius = 0.6
        this.momentum = {
            min: 0.04,
            max: 0.08
        }
        this.scale = {
            min: 0.75,
            max: 1
        }

        this.dropVel = Array.from({length: this.parameters[1].count}, _ => 0)
        this.life = Array.from({length: this.parameters[1].count}, _ => THREE.Math.randFloat(0.01, 0.09))
        this.isOut = Array.from({length: this.parameters[1].count}, _ => false)

        this.trails = []

        this.init()
    }


    // init
    init(){
        this.create()
        this.createGPGPU()
    }
    initRenderObject(){
        this.renderTarget = new THREE.WebGLRenderTarget(this.size.el.w, this.size.el.h, {formaat: THREE.RGBAFormat})
        // this.renderTarget.samples = 256
        // console.log(this.renderTarget)

        this.rtScene = new THREE.Scene()
        this.rtCamera = new THREE.PerspectiveCamera(TestParam.fov, this.size.el.w / this.size.el.h, TestParam.near, TestParam.far)
        this.rtCamera.position.z = TestParam.pos
    }


    // create
    create(){
        this.createDroplet()
        this.createDrop()
        this.createTrail()
    }
    // droplet
    createDroplet(){
        const [bg, waterMap] = this.textures

        const {w, h, count, radius, seg, scaleY} = this.parameters[0]

        const {tPosition, tParam} = this.createDropletTexture()

        this.droplet = new InstancedCircle({
            count,
            radius,
            seg,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.droplet.vertex,
                fragmentShader: Shader.droplet.fragment,
                transparent: true,
                uniforms: {
                    tPosition: {value: tPosition},
                    tParam: {value: tParam},
                    bg: {value: bg},
                    waterMap: {value: waterMap},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    rad: {value: radius},
                    size: {value: new THREE.Vector2(w, h)},
                    scaleY: {value: scaleY}
                }
            }
        })

        const {coord, scale} = this.createDropletAttribute(w, h)

        this.droplet.setInstancedAttribute('coord', new Float32Array(coord), 2)
        this.droplet.setInstancedAttribute('scale', new Float32Array(scale), 1)

        this.droplet.get().renderOrder = 1

        this.group.add(this.droplet.get())
    }
    createDropletAttribute(w, h){
        const coord = []
        const scale = []
        
        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                coord.push(j, i)
                scale.push(Math.random() * 0.25 + 0.75)
            }
        }

        return{
            coord,
            scale
        }
    }
    // drop
    createDrop(){
        const [bg, waterMap] = this.textures
        const {w, h, count, radius, seg, scaleY} = this.parameters[1]

        this.drop = new InstancedCircle({
            count,
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
                    scaleY: {value: scaleY}
                }
            }
        })

        const {coord, position, param, scale, transition} = this.createDropAttribute(w, h)

        this.drop.setInstancedAttribute('coord', new Float32Array(coord), 2)
        this.drop.setInstancedAttribute('aPosition', new Float32Array(position), 4)
        this.drop.setInstancedAttribute('aParam', new Float32Array(param), 4)
        this.drop.setInstancedAttribute('scale', new Float32Array(scale), 1)
        this.drop.setInstancedAttribute('transition', new Float32Array(transition), 1)

        for(let i = 0; i < this.parameters[1].count; i++) this.createTrail(i)

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
    // trail
    createTrail(){
        // for(let i = 0; i < this.trails.length; i++){
        //     const idx2 = this.trails[i].idx
        //     if(idx2 === idx) this.trails[i].killed = true
        // }

        const texture = this.textures[0]

        this.trail = new InstancedPlane({
            count: this.parameters[1].count,
            width: 2.5,
            height: 0,
            widthSeg: 1,
            heightSeg: 1,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.trail.vertex,
                fragmentShader: Shader.trail.fragment,
                transparent: true,
                uniforms: {
                    uTexture: {value: texture},
                    resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                    // posX: {value: x},
                    // posY: {value: 0}
                }
            }
        })

        const {position1, position2, opacity} = this.createTrailAttribute()
        this.trail.setInstancedAttribute('aPosition1', new Float32Array(position1), 2)
        this.trail.setInstancedAttribute('aPosition2', new Float32Array(position2), 2)
        this.trail.setInstancedAttribute('opacity', new Float32Array(opacity), 1)

        // trail.get().position.x = x
        // console.log(position)
        this.trail.get().renderOrder = 0

        this.group.add(this.trail.get())
    }
    createTrailAttribute(){
        const position1 = []
        const position2 = []
        const opacity = []
        const posArr = this.drop.getAttribute('aPosition').array
        const {count} = this.parameters[1]

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
    createDropletTexture(){
        const {w, h} = this.parameters[0]

        const position = []
        const param = []
        const width = this.size.obj.w
        const height = this.size.obj.h

        for(let i = 0; i < h; i++){
            for(let j = 0; j < w; j++){
                const px = Math.random() * width - width / 2
                const py = Math.random() * height - height / 2
                position.push([px, py, 0, 0])

                // const size = THREE.Math.randFloat(this.scale.min, this.scale.max)
                const alpha = 1
                param.push([0, alpha, 0, 0])
            }
        }

        const tPosition = new THREE.DataTexture(new Float32Array(position.flat()), w, h, THREE.RGBAFormat, THREE.FloatType)
        const tParam = new THREE.DataTexture(new Float32Array(param.flat()), w, h, THREE.RGBAFormat, THREE.FloatType)

        tPosition.needsUpdate = true
        tParam.needsUpdate = true

        return{
            tPosition,
            tParam,
        }
    }


    // gpgpu
    createGPGPU(){
        this.createGpuKernels()
    }
    createGpuKernels(){
        this.detectCollision = this.gpu.createKernel(function(param1, param2, pos1, pos2, height){
            const i = this.thread.x
            const idx = i * 4
            const rad1 = this.constants.radius1
            const rad2 = this.constants.radius2
            const count2 = this.constants.count2

            const x1 = pos1[idx + 0]
            const y1 = pos1[idx + 1]

            let x = param1[idx + 0]
            let alpha = param1[idx + 1]
            let z = param1[idx + 2]
            let w = param1[idx + 3]

            if(Math.random() > 0.995 && alpha === 0){
                alpha = 1
            }

            if(alpha !== 0){
                // do not use continue...
                for(let i2 = 0; i2 < count2; i2++){
                    const idx2 = i2 * 4
                    const x2 = pos2[idx2 + 0]
                    const y2 = pos2[idx2 + 1]
                    const alpha2 = param2[idx2 + 1]

                    const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                    const rad = (rad1 + rad2) * 0.7

                    if(dist < rad && alpha2 !== 0){
                        alpha = 0
                    }
                }

            }

            return [x, alpha, z, w]
        }).setDynamicOutput(true)
    }
    updateDroplet(){
        const {count, radius} = this.parameters[0]
        const radius2 = this.parameters[1].radius
        const count2 = this.parameters[1].count

        // const position1 = this.droplet.getUniform('tPosition')
        const position1Arr = this.droplet.getUniform('tPosition').image.data
        const position2Arr = this.drop.getAttribute('aPosition').array

        const param1 = this.droplet.getUniform('tParam')
        const param1Arr = this.droplet.getUniform('tParam').image.data
        const param2Arr = this.drop.getAttribute('aParam').array
        
        this.detectCollision.setOutput([count])
        this.detectCollision.setConstants({
            radius1: radius,
            radius2,
            count2
        })

        const temp = []
        const res = this.detectCollision(param1Arr, param2Arr, position1Arr, position2Arr, this.size.obj.h)

        for(let i = 0; i < res.length; i++) temp.push(...res[i])

        param1.image.data = new Float32Array(temp)
        param1.needsUpdate = true
    }


    // tween
    createTween(idx){
        const position = this.drop.getAttribute('aPosition')
        const param = this.drop.getAttribute('aParam')
        const scale = this.drop.getAttribute('scale')

        const trailPos1 = this.trail.getAttribute('aPosition1')
        const trailPos2 = this.trail.getAttribute('aPosition2')
        const trailOpacity = this.trail.getAttribute('opacity')

        const start = {opacity: 1}
        const end = {opacity: 0}

        const tw = new TWEEN.Tween(start)
        .to(end, 1200)
        .onUpdate(() => this.onUpdateTween(idx, trailOpacity, start))
        .onComplete(() => this.onCompleteTween({idx, position, scale, param, trailPos1, trailPos2, trailOpacity}))
        .start()
    }
    onCompleteTween({idx, position, scale, param, trailPos1, trailPos2, trailOpacity}){
        this.isOut[idx] = false

        const posArr = position.array
        const scaleArr = scale.array
        const paramArr = param.array

        const trailPosArr1 = trailPos1.array
        const trailPosArr2 = trailPos2.array
        const trailOpacityArr = trailOpacity.array
        
        const width = this.size.obj.w
        const height = this.size.obj.h

        const index = idx * 4
        const index2 = idx * 2

        const px = Math.random() * width - width / 2
        const py = Math.random() * height - height / 2
        const vel = 0
        const alivedTime = 0

        const alpha = 1

        posArr[index + 0] = px
        posArr[index + 1] = py
        posArr[index + 2] = vel
        posArr[index + 3] = alivedTime

        scaleArr[idx] = THREE.Math.randFloat(this.scale.min, this.scale.max)
        paramArr[index + 1] = alpha
        
        trailPosArr1[index2 + 1] = py
        trailPosArr2[index2 + 1] = py
        trailOpacityArr[idx] = 1

        position.needsUpdate = true
        scale.needsUpdate = true
        param.needsUpdate = true
        trailPos1.needsUpdate = true
        trailPos2.needsUpdate = true
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


    // animate
    animate(){
        if(!this.detectCollision) return

        this.updateDropVelocity()
        this.updateDropAttribute()

        this.updateDroplet()

        this.updateTrail2()

        // this.renderer.setRenderTarget(this.renderTarget)
        // this.renderer.clear()
        // this.renderer.render(this.rtScene, this.rtCamera)
        // this.renderer.setRenderTarget(null)
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
        // const crtTime = window.performance.now()

        const position = this.drop.getAttribute('aPosition')
        const param = this.drop.getAttribute('aParam')
        const transition = this.drop.getAttribute('transition')
        const scale = this.drop.getAttribute('scale')

        const trailPos1 = this.trail.getAttribute('aPosition1')
        const trailPosArr1 = trailPos1.array
        const trailPos2 = this.trail.getAttribute('aPosition2')
        const trailPosArr2 = trailPos2.array

        const posArr = position.array
        const scaleArr = scale.array
        const paramArr = param.array
        // const transitionArr = transition.array

        const {radius} = this.parameters[1]
        const width = this.size.obj.w
        const height = this.size.obj.h
        const halfWidth = width / 2
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
                        }else{
                            posArr[idx2 + 2] = vel2
                            posArr[idx2 + 3] = this.maxLife
                            scaleArr[j] += scale * 0.1
                            scaleArr[i] = 0
                            paramArr[idx + 1] = 0
                        }
                        continue
                    }
                }

            }

            if(py < -halfHeight - radius * 2){
                this.createTween(i)

                this.isOut[i] = true
                // px = Math.random() * width - halfWidth
                // py = Math.random() * height - halfHeight
                // vel = 0
                // alivedTime = 0
                // scaleArr[i] = THREE.Math.randFloat(this.scale.min, this.scale.max)
                // paramArr[idx + 1] = 1

                // trailPosArr1[i * 2 + 1] = py
                // trailPosArr2[i * 2 + 1] = py

                // this.createTween(transitionArr, i)
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

        // trailPos1.needsUpdate = true
        // trailPos2.needsUpdate = true
    }
    updateTrail2(){
        const position1 = this.trail.getAttribute('aPosition1')
        const posArr1 = position1.array
        const position2 = this.trail.getAttribute('aPosition2')
        const posArr2 = position2.array
        const dropPosArr = this.drop.getAttribute('aPosition').array

        for(let i = 0; i < this.parameters[1].count; i++){
            const idx = i * 2
            const idx2 = i * 4

            const px = dropPosArr[idx2 + 0]
            const py = dropPosArr[idx2 + 1]

            posArr1[idx + 0] = px 
            posArr2[idx + 0] = px

            posArr1[idx + 1] -= 0.02
            posArr2[idx + 1] = py

            if(py >= posArr1[idx + 1]) posArr1[idx + 1] = py
        }

        position1.needsUpdate = true
        position2.needsUpdate = true
    }
}