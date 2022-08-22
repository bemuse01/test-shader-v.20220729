import * as THREE from '../../lib/three.module.js'
import PublicMethod from '../../method/method.js'

import Drops from './build/test.drops.build.js'
// import Particle from './build/test.particle.build.js'
// import Plane from './build/test.plane.build.js'
// import Bg from './build/test.bg.build.js'
import Trails from './build/test.trails.build.js'

export default class{
    constructor({app}){
        this.renderer = app.renderer

        this.param = {
            fov: 60,
            near: 0.1,
            far: 10000,
            pos: 100
        }

        this.modules = {
            // Bg,
            Drops,
            // Trail2,
            // Trail3,
            Trails,
            // Plane
            // Particle
        }
        this.group = {}
        this.comp = {}
        this.build = new THREE.Group()

        this.sources = [
            './assets/src/1.jpg',
            './assets/src/drop_fg2.png',
            './assets/src/trail_fg.png'
        ]

        this.gpu = new GPU()

        this.init()
    }


    // init
    async init(){
        this.initGroup()
        this.initRenderObject()

        this.textures = await this.getTextures()

        this.create()
        this.add()
    }
    initGroup(){
        for(const module in this.modules){
            this.group[module] = new THREE.Group()
            this.comp[module] = null
        }
    }
    initRenderObject(){
        this.element = document.querySelector('.test-object')

        const {width, height} = this.element.getBoundingClientRect()

        this.scene = new THREE.Scene()

        this.camera = new THREE.PerspectiveCamera(this.param.fov, width / height, this.param.near, this.param.far)
        this.camera.position.z = this.param.pos
        
        this.size = {
            el: {
                w: width,
                h: height
            },
            obj: {
                w: PublicMethod.getVisibleWidth(this.camera, 0),
                h: PublicMethod.getVisibleHeight(this.camera, 0)
            }
        }
    }


    // add
    add(){
        for(let i in this.group) this.build.add(this.group[i])
        
        this.scene.add(this.build)
    }


    // create
    create(){
        for(const module in this.modules){
            const instance = this.modules[module]
            const group = this.group[module]

            this.comp[module] = new instance({group, size: this.size, renderer: this.renderer, camera: this.camera, comp: this.comp, textures: this.textures, gpu: this.gpu})
        }
    }


    // get
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
        this.render()
        this.animateObject()
    }
    render(){
        const rect = this.element.getBoundingClientRect()
        const width = rect.right - rect.left
        const height = rect.bottom - rect.top
        const left = rect.left
        const bottom = this.renderer.domElement.clientHeight - rect.bottom

        // app.renderer.clear()

        this.renderer.setScissor(left, bottom, width, height)
        this.renderer.setViewport(left, bottom, width, height)

        this.camera.lookAt(this.scene.position)
        this.renderer.render(this.scene, this.camera)
    }
    animateObject(){
        for(let i in this.comp){
            if(!this.comp[i] || !this.comp[i].animate) continue
            this.comp[i].animate()
        }
    }


    // resize
    resize(){
        const rect = this.element.getBoundingClientRect()
        const width = rect.right - rect.left
        const height = rect.bottom - rect.top

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()

        this.size = {
            el: {
                w: width,
                h: height
            },
            obj: {
                w: PublicMethod.getVisibleWidth(this.camera, 0),
                h: PublicMethod.getVisibleHeight(this.camera, 0)
            }
        }

        this.resizeObject()
    }
    resizeObject(){
        for(let i in this.comp){
            if(!this.comp[i] || !this.comp[i].resize) continue
            this.comp[i].resize(this.size)
        }
    }
}