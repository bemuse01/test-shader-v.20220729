export default class{
    constructor({gpuCompute, textureName, shader, uniforms, texture}){
        this.gpuCompute = gpuCompute
        this.texture = texture
        this.textureName = textureName
        this.shader = shader
        this.uniforms = uniforms

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        this.variable = this.gpuCompute.addVariable(this.textureName, this.shader, this.texture)
    }
 


    // set dependencies
    setDependencies(vars = []){
        this.gpuCompute.setVariableDependencies(this.variable, [this.variable, ...vars])

        this.setUniforms()
    }
    setUniforms(){
        for(const uniform in this.uniforms){
            this.variable.material.uniforms[uniform] = this.uniforms[uniform]
        }
    }
    setUniform(name, value){
        this.variable.material.uniforms[name].value = value
    }


    // get
    get(){
        return this.variable
    }
}