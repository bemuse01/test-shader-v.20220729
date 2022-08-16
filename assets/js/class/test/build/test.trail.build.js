import Plane from '../../objects/plane.js'
import Shader from '../shader/test.trail.shader.js'
import * as THREE from '../../../lib/three.module.js'

export default class{
    constructor({group, size, comp}){
        this.group = group
        this.size = size

        this.count = 5
        this.width = 3

        this.sources = [
            './assets/src/1.jpg'
        ]
        this.objects = []

        this.init()
    }


    // init
    async init(){
        const textures = await this.getTextures()

        this.create(textures)
    }


    // create
    create(textures){
        const texture = textures[0]

        for(let i = 0; i < this.count; i++){
            const object = new Plane({
                width: this.width,
                widthSeg: 1,
                height: this.size.obj.h,
                heightSeg: 1,
                materialName: 'ShaderMaterial',
                materialOpt: {
                    vertexShader: Shader.vertex,
                    fragmentShader: Shader.fragment,
                    transparent: true,
                    uniforms: {
                        uTexture: {value: texture},
                        resolution: {value: new THREE.Vector2(this.size.obj.w, this.size.obj.h)},
                        width: {value: this.width}
                    }
                }
            })

            const {positionX} = this.createAttribute(object.getAttribute('position').count)
            console.log(positionX)
            object.setAttribute('positionX', new Float32Array(positionX), 1)

            this.group.add(object.get())
        }
    }
    createAttribute(count){
        const positionX = []

        const width = this.size.obj.w
        const x = Math.random() * width - width / 2

        for(let i = 0; i < count; i++){
            positionX.push(x)
        }

        return{
            positionX
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
}