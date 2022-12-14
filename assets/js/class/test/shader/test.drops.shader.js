import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute vec2 coord;
        attribute vec4 aPosition;
        attribute vec4 aParam;
        attribute float scale;
        attribute float transition;

        uniform vec2 size;
        uniform float scaleY;

        varying vec2 vPosition;
        varying vec2 oPosition;
        varying vec2 vUv;
        varying float vAlpha;

        void main(){
            vec3 nPosition = position;

            nPosition.x *= scaleY;
            nPosition.xy *= scale * transition;
            nPosition.xy += aPosition.xy;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);

            vPosition = aPosition.xy;
            oPosition = position.xy;
            vAlpha = aParam.y;
            vUv = uv;
        }
    `,
    fragment: `
        uniform sampler2D bg;
        uniform sampler2D waterMap;
        uniform vec2 resolution;
        uniform float rad;
        uniform float bgViewScale;

        varying vec2 vPosition;
        varying vec2 oPosition;
        varying vec2 vUv;
        varying float vAlpha;

        ${ShaderMethod.executeNormalizing()}

        float blendOverlay(float base, float blend) {
            return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
        }
        
        vec3 blendOverlay(vec3 base, vec3 blend) {
            return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
        }
        
        vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
            return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
        }

        void main(){
            // vec2 dir = vUv - 0.5;
            // vec2 ratio = oPosition / resolution * 10.0;
            // vec2 signs = vec2(sign(dir.x), sign(dir.y));

            vec2 coord = (vPosition + resolution * 0.5) / resolution;
            vec2 ratio = (oPosition / resolution) * 2.0;
            vec4 base = texture(bg, coord + ratio);
            vec4 diffuse = texture(waterMap, vUv);

            vec3 o = blendOverlay(base.rgb, diffuse.rgb * 1.0, 1.0);

            float alphaGradient = distance(1.0, vUv.y) * 1.2;

            gl_FragColor = vec4(o, alphaGradient * vAlpha);
        }
    `
}