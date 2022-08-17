import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute float opacity;

        uniform float posX;
        uniform float posY;

        varying vec2 vUv;
        varying vec2 vPosition;
        varying vec3 oPosition;
        varying float vOpacity;

        ${ShaderMethod.executeNormalizing()}
        ${ShaderMethod.snoise3D()}

        void main(){
            vec3 nPosition = position;

            float r = snoise3D(vec3(uv * 2.0, length(uv) * 2.0));
            float p = executeNormalizing(r, 0.95, 1.0, -1.0, 1.0);

            // nPosition.x += posX * p;
            nPosition.x += posX;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);

            vUv = uv;
            vPosition = vec2(posX, posY);
            oPosition = position;
            vOpacity = opacity;
        }
    `,
    fragment: `
        uniform sampler2D uTexture;
        uniform vec2 resolution;
        uniform float width;

        varying vec2 vUv;
        varying vec2 vPosition;
        varying vec3 oPosition;
        varying float vOpacity;

        ${ShaderMethod.executeNormalizing()}

        void main(){
            float ratio = oPosition.x / resolution.x;
            float crtPosX = (vPosition.x + resolution.x * 0.5) / resolution.x;
            vec2 coord = vec2(crtPosX + ratio, vUv.y);
            vec4 color = texture(uTexture, coord);

            // color.a = 1.0 - distance(vPosition.y, 0.0) / resolution.y;
            // float dist = vUv.y

            // color.a = 1.0 - vUv.y;

            gl_FragColor = color;
        }
    `
}