import InstancedCircle from '../../objects/InstancedCircle.js'
import Plane from '../../objects/plane.js'
import * as THREE from '../../../lib/three.module.js'
import Shader from '../shader/test.child.shader.js'

export default class{
    constructor({group, size}){
        this.group = group
        this.size = size

        this.count = 1000
        this.radius = 2
        this.seg = 32

        this.init()
    }


    // init
    init(){
        this.create()
    }


    // create
    create(){
        this.plane = new InstancedCircle({
            count: this.count,
            radius: this.radius,
            seg: this.seg,
            materialName: 'ShaderMaterial',
            materialOpt: {
                vertexShader: Shader.vertex,
                fragmentShader: Shader.fragment,
                transparent: true,
                uniforms: {

                }
            }
        })

        const {position} = this.createAttribute()

        this.plane.setInstancedAttribute('iPosition', new Float32Array(position), 3)

        const mesh = this.plane.get()

        for(let i = 0; i < this.count; i++){
            const matrix = new THREE.Matrix4()
            
            const x = Math.random() * 40 - 20
            const y = Math.random() * 40 - 20

            matrix.multiply(new THREE.Matrix4().makeTranslation(x, y, 0))

            mesh.setMatrixAt(i, matrix)
            mesh.setColorAt(i, new THREE.Color(0xffffff))
        }

        mesh.instanceMatrix.needsUpdate = true
        mesh.instanceColor.needsUpdate = true

        this.group.add(mesh)
    }
    createAttribute(){
        const position = []
        const {w, h} = this.size.obj

        for(let i = 0; i < this.count; i++){
            const x = Math.random() * w - w / 2
            const y = Math.random() * h - h / 2

            position.push(x, y, 0)
        }

        return {position}
    }
}