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
        uniform vec3 color;

        void main(){
            gl_FragColor = vec4(color, 1);
        }
    `
}