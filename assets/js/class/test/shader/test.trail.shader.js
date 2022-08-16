export default {
    vertex: `
        attribute vec2 aPosition;

        varying vec2 vUv;
        varying vec2 vPosition;
        varying vec3 oPosition;

        void main(){
            vec3 nPosition = position;

            nPosition.x += aPosition.x;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);

            vUv = uv;
            vPosition = aPosition;
            oPosition = position;
        }
    `,
    fragment: `
        uniform sampler2D uTexture;
        uniform vec2 resolution;
        uniform float width;

        varying vec2 vUv;
        varying vec2 vPosition;
        varying vec3 oPosition;

        void main(){
            float ratio = oPosition.x / resolution.x;
            float crtPosX = (vPosition.x + resolution.x * 0.5) / resolution.x;
            vec2 coord = vec2(crtPosX + ratio, vUv.y);
            vec4 color = texture(uTexture, coord);

            gl_FragColor = color;
        }
    `
}