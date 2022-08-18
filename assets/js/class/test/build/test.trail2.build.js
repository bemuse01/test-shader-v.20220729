import Plane from '../../objects/plane.js'
import Shader from '../shader/test.trail2.shader.js'
import * as THREE from '../../../lib/three.module.js'

export default class{
    constructor({group, size, comp, textures, gpu}){
        this.group = group
        this.size = size
        this.textures = textures
        this.child = comp['Child']
        this.gpu = gpu

        this.position = this.child.drop.getAttribute('aPosition')
        this.count = this.position.count
        this.ctx = this.createCanvasTexture({width: this.size.el.w, height: this.size.el.h})
        this.image = this.textures[0].image

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        // const texture = this.textures[0]
        this.texture = new THREE.CanvasTexture(this.ctx.canvas)

        this.object = new Plane({
            width: this.size.obj.w,
            widthSeg: 1,
            height: this.size.obj.h,
            heightSeg: 1,
            materialName: 'MeshBasicMaterial',
            materialOpt: {
                map: this.texture,
                // vertexShader: Shader.vertex,
                // fragmentShader: Shader.fragment,
                transparent: true,
                // uniforms: {
                //     uTexture: {value: texture},
                //     oResolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                //     eResolution: {value: new THREE.Vector2(this.size.el.w, this.size.el.h)},
                // }
            }
        })

        this.group.add(this.object.get())
    }
    createAttribute(count){
    }
    createCanvasTexture({width, height}){
        const ctx = document.createElement('canvas').getContext('2d')
        ctx.canvas.width = width
        ctx.canvas.height = height
        return ctx
    }


    // animate
    animate(){
        this.drawCanvasTexture()
        // this.object.getUniform('uTexture').needsUpdate = true
        this.texture.needsUpdate = true
    }
    drawCanvasTexture(){
        const {width, height} = this.ctx.canvas
        const posArr = this.position.array
        const ratio = width / height

        this.ctx.clearRect(0, 0, width, height)
        // this.ctx.globalAlpha = 0.01
        // this.ctx.drawImage(this.image, 0, 0, width, height)
        // this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        // this.ctx.fillRect(0, 0, width, height)

        // this.ctx.globalAlpha = 1

        for(let i = 0; i < this.count; i++){
            const idx = i * 4

            const px = (posArr[idx + 0] + this.size.obj.w / 2) / this.size.obj.w
            const py = (posArr[idx + 1] + this.size.obj.h / 2) / this.size.obj.h

            const sx = this.size.el.w * px
            const sy = this.size.el.h * py

            const dx = sx
            const dy = height - sy

            // const sizeRatio = (2.5 / this.size.obj.w)

            this.ctx.drawImage(this.image, sx, dy, 10, 10, dx, dy, 10, 10)
            // this.ctx.drawImage(this.image, sx, sy, 10, 10, sx, sy)
        }
    }
}