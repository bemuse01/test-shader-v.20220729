import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute vec2 coord;
        attribute float seed;

        uniform sampler2D tPosition;
        uniform sampler2D tParam;
        uniform float cameraConstant;
        uniform vec2 size;
        uniform float scaleY;

        varying vec2 vPosition;
        varying vec2 vUv;
        varying float vAlpha;

        ${ShaderMethod.snoise3D()}
        ${ShaderMethod.executeNormalizing()}
        ${ShaderMethod.rand()}

        void main(){
            vec3 nPosition = position;

            vec4 tPos = texelFetch(tPosition, ivec2(coord), 0);
            vec4 tPrm = texelFetch(tParam, ivec2(coord), 0);

            float r = snoise3D(vec3(tPos.xy * 0.01, length(uv) * 0.1));
            float n = executeNormalizing(r, 0.9, 1.0, -1.0, 1.0);

            nPosition.x *= scaleY; 
            nPosition.xy *= tPrm.x * n;
            nPosition.xy += tPos.xy;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);

            vPosition = tPos.xy;
            vAlpha = tPrm.y;
            vUv = uv;
        }
    `,
    fragment: `
        // uniform vec3 color;
        uniform sampler2D uTexture;
        uniform sampler2D waterMap;
        uniform vec2 resolution;
        uniform float rad;

        varying vec2 vPosition;
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
            vec2 coord = (vPosition + resolution * 0.5) / resolution;
            vec2 ratio = vec2(rad * 2.0) / resolution * 10.0;
            // vec2 signs = vec2(sign(dir.x), sign(dir.y));
            vec4 base = texture(uTexture, coord + vUv * ratio);
            vec4 diffuse = texture(waterMap, vUv);
 
            vec3 o = blendOverlay(base.rgb, diffuse.rgb * 1.0, 1.0);

            float dist = distance(1.0, vUv.y) * 1.2;

            gl_FragColor = vec4(o, dist * vAlpha);
        }
    `
}