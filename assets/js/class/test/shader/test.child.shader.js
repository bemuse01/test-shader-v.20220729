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
        ${ShaderMethod.rand()}

        void main(){
            vec3 nPosition = position;

            vec4 tPos = texelFetch(tPosition, ivec2(coord), 0);
            vec4 tPrm = texelFetch(tParam, ivec2(coord), 0);

            float r = snoise3D(vec3(uv * 0.001, rand(uv) * 0.001));
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
        // uniform vec3 color;
        uniform sampler2D uTexture;
        uniform sampler2D waterMap;
        uniform vec2 resolution;

        varying vec3 vColor;
        varying vec2 vPosition;
        varying vec2 vUv;

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
            vec2 coord = vPosition / resolution;
            vec4 base = texture(uTexture, coord);
            vec4 diffuse = texture(waterMap, vUv);
 
            // float dist = distance(vUv, vec2(0.5));
            // float pdist = executeNormalizing(dist, 0.0, 1.0, 0.0, 0.5);
            // base.a = 1.0 - pdist;

            // vec3 o = blendOverlay(diffuse.rgb, base.rgb, 0.5);

            // gl_FragColor = vec4(o, 1.0);

            // base *= diffuse;
            // vec4 p = mix(diffuse, base, base.a * 1.5);
            
            // gl_FragColor = p;
            // gl_FragColor = vec4(0.4);
            gl_FragColor = base;
        }
    `
}