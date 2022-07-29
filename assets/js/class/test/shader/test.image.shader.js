import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute vec3 aStartPosition;
        attribute vec3 aEndPosition;
        attribute vec3 aControl0;
        attribute vec3 aControl1;
        attribute float aDuration;
        attribute float aDelay;

        uniform float uTime;
        uniform int uPhase;

        varying vec2 vUv;

        ${ShaderMethod.cubicBezier()}

        void main(){
            vec3 newPosition = position;

            float p = clamp(uTime - aDelay, 0.0, aDuration) / aDuration;

            // p = uPhase == 0 ? 1.0 - p : p;
            float r = uPhase == 0 ? 1.0 - p : p;

            newPosition *= r;
            newPosition += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, p);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

            vUv = uv;
        }
    `,
    fragment: `
        uniform sampler2D uTexture;
        uniform float uOpacity;

        varying vec2 vUv;

        void main(){
            // test 2
            // vec2 nUv;
            // nUv.x = clamp(distance(coord.x, offset.x) * sign(coord.x - offset.x) / hf.x, 0.0, 1.0);
            // nUv.y = clamp(distance(coord.y, offset.y) * sign(coord.y - offset.y) / hf.y, 0.0, 1.0);
            // vec4 tex = texture(uTexture, nUv);



            // test 3
            vec3 tex = texture(uTexture, vUv).xyz;



            gl_FragColor = vec4(tex, uOpacity);
            // gl_FragColor = vec4(nUv, 0.0, 1.0);
        }
    `
}