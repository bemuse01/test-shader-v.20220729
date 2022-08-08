export default {
    vertex: `
        varying vec2 vUv;

        void main(){
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vUv = uv;
        }
    `,
    fragment: `
        uniform sampler2D uTexture;
        uniform vec2 uRes;

        varying vec2 vUv;

        const float PI = ${Math.PI};

        const float directions = 16.0;
        const float quality = 4.0;
        const float size = 8.0;

        const vec4 o = vec4(0, 0, 0, -12.0);
        const mat4 colorMatrix = mat4(
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 17.0
        );

        void main(){
            vec4 tex = texture(uTexture, vUv);


            // blur 1
            vec2 radius = size / uRes;

            for(float d = 0.0; d < PI; d += PI / directions){
                for(float i = 1.0 / quality; i <= 1.0; i += 1.0 / quality){
                    tex += texture(uTexture, vUv + vec2(cos(d), sin(d)) * radius * i);
                }
            }

            tex /= quality * directions - 15.0;


            // color matrix
            vec4 color = tex * colorMatrix + o;

            gl_FragColor = color;
        }
    `
}