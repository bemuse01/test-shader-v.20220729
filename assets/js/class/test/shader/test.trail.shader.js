export default {
    vertex: `
        varying vec2 vUv;

        void main(){
            gl_Position = projectionMatrix * viewModelMatrix * vec4(position, 1.0);

            vUv = uv;
        }
    `,
    fragment: `
        uniform sampler2D utexture;

        varying vec2 vUv;

        void main(){
            vec4 color = texture(uTexture, vUv);

            gl_FragColor = color;
        }
    `
}