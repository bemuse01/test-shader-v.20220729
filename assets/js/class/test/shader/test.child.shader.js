import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute vec2 coord;

        uniform sampler2D tPosition;
        uniform sampler2D tParam;
        uniform float cameraConstant;

        varying vec3 vColor;
        varying vec2 vPosition;
        varying vec2 vUv;

        ${ShaderMethod.snoise3D()}
        ${ShaderMethod.executeNormalizing()}

        void main(){
            vec3 nPosition = position;

            vec4 tPos = texelFetch(tPosition, ivec2(coord), 0);
            vec4 tPrm = texelFetch(tParam, ivec2(coord), 0);

            float r = snoise3D(vec3(tPos.xy, length(uv) * 0.35));
            float n = executeNormalizing(r, 0.9, 1.0, -1.0, 1.0);

            nPosition.xy += tPos.xy;
            nPosition.xy *= n;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);

            vColor = tPrm.yzw;
            vPosition = tPos.xy;
            vUv = uv;
        }
    `,
    fragment: `
        uniform vec3 color;
        uniform sampler2D uTexture;

        varying vec3 vColor;
        varying vec2 vPosition;
        varying vec2 vUv;

        void main(){
            vec4 diffuse = texture(uTexture, vUv);

            // gl_FragColor = vec4(color, 1.0);
            gl_FragColor = diffuse;
        }
    `
}