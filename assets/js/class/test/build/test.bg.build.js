import * as THREE from '../../../lib/three.module.js'
import Plane from '../../objects/plane.js'
import TestParam from '../param/test.param.js'

export default class{
    constructor({renderer, group, size}){
        this.renderer = renderer
        this.group = group
        this.size = size

        this.sources = [
            './assets/src/1_blur.jpg'
        ]

        this.init()
    }


    // init
    async init(){
        this.initRenderObject()
        const textures = await this.getTextures()

        this.create(textures)
    }
    initRenderObject(){
        this.renderTarget = new THREE.WebGLRenderTarget(this.size.el.w, this.size.el.h)
        // this.renderTarget.samples = 256

        this.rtScene = new THREE.Scene()
        this.rtCamera = new THREE.PerspectiveCamera(TestParam.fov, this.size.el.w / this.size.el.h, TestParam.near, TestParam.far)
        this.rtCamera.position.z = TestParam.pos
    }


    // create
    create(textures){
        const texture = textures[0]

        this.object = new Plane({
            width: this.size.obj.w,
            widthSeg: 1,
            height: this.size.obj.h,
            heightSeg: 1,
            materialName: 'MeshBasicMaterial',
            materialOpt: {
                map: texture,
                transparent: true
            }
        })

        this.rtScene.add(this.object.get())
    }


    getTextures(){
        return new Promise((resolve, _) => {
            // resolve when loading complete
            const manager = new THREE.LoadingManager(() => resolve(textures))
            
            // bind manager to loader
            const loader = new THREE.TextureLoader(manager)
            
            // load textures
            const textures = this.sources.map(file => loader.load(file))
        })
    }


    // animate
    animate(){
        this.renderer.setRenderTarget(this.renderTarget)
        this.renderer.clear()
        this.renderer.render(this.rtScene, this.rtCamera)
        this.renderer.setRenderTarget(null)
    }
}