export default {
    vertex: `
        varying vec2 vUv;

        void main(){
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vUv = uv;
        }
    `,
    fragment: `
        uniform sampler2D tBase;
        uniform sampler2D tDiffuse;
        uniform vec2 uRes;

        varying vec2 vUv;

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
            vec4 base = texture(tBase, vUv);
            vec4 diffuse = texture(tDiffuse, vUv);

            vec3 o = blendOverlay(diffuse.rgb, base.rgb, 1.0);
            // vec3 m = mix(o, diffuse.rgb, 0.5);

            base.rgb += o;

            // gl_FragColor = vec4(o, 1.0);
            gl_FragColor = base;
        }
    `
}