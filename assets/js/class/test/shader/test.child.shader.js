export default {
    vertex: `
        attribute vec3 iPosition;

        void main(){
            vec3 nPosition = position;

            nPosition += iPosition;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);
        }
    `,
    fragment: `
        void main(){
            gl_FragColor = vec4(vec3(1), 1);
        }
    `
}