import * as THREE from '../../lib/three.module.js'
import {PrefabBufferGeometry} from '../../lib/three.module.extends.js'

export default class{
    constructor({prefab, count, materialOpt}){
        this.prefab = prefab
        this.count = count
        this.materialOpt = materialOpt

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        this.createGeometry()
        this.createMaterial()
        this.mesh = new THREE.Mesh(this.geometry, this.material)
    }
    createGeometry(){
        this.geometry = new PrefabBufferGeometry(this.prefab, this.count)
    }
    createMaterial(){
        if(this.materialOpt.vertexShader){
            this.material = new THREE.ShaderMaterial(this.materialOpt)
        }else{
            this.material = new THREE.MeshBasicMaterial(this.materialOpt)
        }
    }
    createAttribute(name, itemSize){
        this.geometry.createAttribute(name, itemSize)
    }


    // set


    // get
    get(){
        return this.mesh
    }
    getAttribute(name){
        return this.geometry.attributes[name]
    }
}