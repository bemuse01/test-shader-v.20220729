import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute float opacity;

        varying vec2 vUv;
        varying float vOpacity;

        void main(){
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vUv = uv;
            vOpacity = opacity;
        }
    `,
    fragment: `
        uniform sampler2D uTexture;
        uniform vec2 drops[25];
        uniform vec2 oResolution;
        uniform vec2 eResolution;

        varying vec2 vUv;
        varying float vOpacity;

        ${ShaderMethod.executeNormalizing()}

        void main(){
            vec2 coord = oResolution * (gl_FragCoord.xy / eResolution) - (oResolution * 0.5);
            vec4 color = texture(uTexture, vUv);
            float opacity = 0.0; 

            for(int i = 0; i < 25; i++){
                vec2 drop = drops[i];

                float dist = distance(drop, coord);

                if(dist < 2.5) opacity = 1.0;
            }

            color.a = opacity;

            gl_FragColor = color;
        }
    `
}