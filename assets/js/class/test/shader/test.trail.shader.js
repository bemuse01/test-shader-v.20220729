export default {
    vertex: `
        attribute float positionX;

        varying vec2 vUv;
        varying float vPositionX;
        varying vec3 vPosition;

        void main(){
            vec3 nPosition = position;

            nPosition.x += positionX;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);

            vUv = uv;
            vPositionX = positionX;
            vPosition = position;
        }
    `,
    fragment: `
        uniform sampler2D uTexture;
        uniform vec2 resolution;
        uniform float width;

        varying vec2 vUv;
        varying float vPositionX;
        varying vec3 vPosition;

        void main(){
            float ratio = vPosition.x / resolution.x;
            float crtPosX = (vPositionX + resolution.x * 0.5) / resolution.x;
            vec2 coord = vec2(crtPosX + ratio, vUv.y);
            vec4 color = texture(uTexture, coord);

            gl_FragColor = color;
        }
    `
}