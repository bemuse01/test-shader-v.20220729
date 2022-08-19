import ShaderMethod from '../../../method/method.shader.js'

export default {
    droplet: {
        vertex: `
            attribute vec2 coord;
            attribute float scale;

            uniform sampler2D tPosition;
            uniform sampler2D tParam;
            uniform vec2 size;
            uniform float scaleY;

            varying vec2 vPosition;
            varying vec2 oPosition;
            varying vec2 vUv;
            varying float vAlpha;

            void main(){
                vec3 nPosition = position;

                vec4 pos = texelFetch(tPosition, ivec2(coord), 0);
                vec4 param = texelFetch(tParam, ivec2(coord), 0);

                nPosition.x *= scaleY;
                nPosition.xy *= scale;
                nPosition.xy += pos.xy;

                gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);

                vPosition = pos.xy;
                oPosition = position.xy;
                vAlpha = param.y;
                vUv = uv;
            }
        `,
        fragment: `
            uniform sampler2D bg;
            uniform sampler2D waterMap;
            uniform vec2 resolution;
            uniform float rad;

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
                vec2 coord = (vPosition + resolution * 0.5) / resolution;
                // vec2 ratio = vec2(rad * 2.0) / resolution * 10.0;
                vec2 ratio = oPosition / resolution * 5.0;
                // vec2 signs = vec2(sign(dir.x), sign(dir.y));
                vec4 base = texture(bg, coord + ratio);
                vec4 diffuse = texture(waterMap, vUv);
    
                vec3 o = blendOverlay(base.rgb, diffuse.rgb * 1.0, 1.0);

                float alphaGradient = distance(1.0, vUv.y) * 1.2;

                gl_FragColor = vec4(o, alphaGradient * vAlpha);
            }
        `
    },
    drop: {
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
                vec2 coord = (vPosition + resolution * 0.5) / resolution;
                // vec2 ratio = oPosition / resolution * 10.0;
                vec2 ratio = oPosition / resolution * 2.0;
                // vec2 signs = vec2(sign(dir.x), sign(dir.y));
                vec4 base = texture(bg, coord + ratio);
                vec4 diffuse = texture(waterMap, vUv);
    
                vec3 o = blendOverlay(base.rgb, diffuse.rgb * 1.0, 1.0);

                float alphaGradient = distance(1.0, vUv.y) * 1.2;

                gl_FragColor = vec4(o, alphaGradient * vAlpha);
            }
        `
    },
    trail: {
        vertex: `
            attribute vec2 aPosition1;
            attribute vec2 aPosition2;
            attribute float opacity;

            // uniform float posX;
            // uniform float posY;

            varying vec2 vUv;
            varying vec2 vPosition;
            varying vec3 oPosition;
            varying float vOpacity;

            ${ShaderMethod.executeNormalizing()}
            ${ShaderMethod.snoise3D()}

            void main(){
                vec3 nPosition = position;

                // float r = snoise3D(vec3(uv * 2.0, length(uv) * 2.0));
                // float p = executeNormalizing(r, 0.95, 1.0, -1.0, 1.0);

                // nPosition.x += posX * p;
                // nPosition.xy += aPosition2;

                if(uv.y == 1.0){
                    nPosition.xy += aPosition1;
                }else{
                    nPosition.xy += aPosition2;
                }


                gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);

                vUv = uv;
                vPosition = aPosition2;
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
                // vec2 ratio = oPosition.xy / resolution;
                // vec2 crtPos = (vPosition + resolution * 0.5) / resolution;
                // vec2 coord = crtPos + ratio;
                // vec4 color = texture(uTexture, coord);

                // color.a = 1.0 - distance(vPosition.y, 0.0) / resolution.y;
                // float dist = vUv.y

                // color.a = 1.0 - vUv.y;
                // color.rgb *= 1.5;
                // color.a = vOpacity;

                gl_FragColor = vec4(vec3(1), 1.0 * vOpacity);
            }
        `
    }
}