import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute vec2 aPosition1;
        attribute vec2 aPosition2;
        attribute float opacity;
        attribute float scale;

        varying vec2 vUv;
        varying vec2 vPosition;
        varying vec3 oPosition;
        varying float vOpacity;

        ${ShaderMethod.executeNormalizing()}
        ${ShaderMethod.snoise3D()}

        void main(){
            vec3 nPosition = position;

            nPosition.x *= scale * 1.75;

            if(uv.y == 1.0){
                nPosition.xy += aPosition1;
            }else{
                nPosition.xy += aPosition2;
            }

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);

            vUv = uv;
            vPosition = nPosition.xy;
            oPosition = position;
            vOpacity = opacity;
        }
    `,
    fragment: `
        uniform sampler2D uBg;
        uniform sampler2D uFg;
        uniform vec2 resolution;
        uniform float width;

        varying vec2 vUv;
        varying vec2 vPosition;
        varying vec3 oPosition;
        varying float vOpacity;

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
            vec2 coord = (vPosition + resolution * 0.5) / resolution;
            vec4 bg = texture(uBg, coord);
            vec4 fg = texture(uFg, vUv);

            vec3 o = blendOverlay(bg.rgb, fg.rgb, 1.0);

            float dist = distance(vUv * 2.0, vec2(1));
            float opacity = 1.0 - dist;

            vec4 color = vec4(o, vOpacity * opacity);

            gl_FragColor = color;
        }
    `
}