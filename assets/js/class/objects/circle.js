import * as THREE from '../../lib/three.module.js'

export default class{
    constructor({radius, seg, materialName, materialOpt}){
        this.radius = radius
        this.seg = seg
        this.materialName = materialName
        this.materialOpt = materialOpt
    
        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        const geometry = this.createGeometry()
        const material = this.createMaterial()
        this.mesh = new THREE.Mesh(geometry, material)
    }
    createGeometry(){
        return new THREE.CircleGeometry(this.radius, this.seg)
    }
    createMaterial(){
        return new THREE[this.materialName](this.materialOpt)
    }


    // dispose
    dispose(){
        const uniforms = this.getUniforms()

        if(uniforms){
            for(const name in uniforms){
                if(!uniforms[name].value.dispose) continue 
                uniforms[name].value.dispose()
                uniforms[name].value = null
            }
        }else{
            if(this.getMaterial().map) {
                this.getMaterial().map.dispose()
                this.getMaterial().map = null
            }
        }

        this.getGeometry().dispose()
        this.getMaterial().dispose()

        this.mesh.geometry = null
        this.mesh.material = null
        this.mesh = null
    }


    // set
    setAttribute(name, array, itemSize){
        this.mesh.geometry.setAttribute(name, new THREE.BufferAttribute(array, itemSize))
    }
    setUniform(name, value){
        this.mesh.material.uniforms[name].value = value
    }


    // get
    get(){
        return this.mesh
    }
    getGeometry(){
        return this.mesh.geometry
    }
    getMaterial(){
        return this.mesh.material
    }
    getAttribute(name){
        return this.mesh.geometry.attributes[name]
    }
    getUniform(name){
        return this.mesh.material.uniforms[name].value
    }
}