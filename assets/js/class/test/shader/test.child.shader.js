import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute vec3 iPosition;
        attribute vec2 coord;

        uniform sampler2D tPosition;

        void main(){
            vec3 nPosition = position;

            // nPosition += iPosition;
            // vec4 tPos = texelFetch(tPosition, ivec2(coord), 0);
            vec4 tPos = texelFetch(tPosition, ivec2(coord), 0);

            nPosition.xy += tPos.xy;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);
        }
    `,
    fragment: `
        uniform vec3 color;

        void main(){
            gl_FragColor = vec4(color, 1);
        }
    `,
    position: `
        uniform float time;
        uniform vec2 res;
        uniform float rad;

        ${ShaderMethod.rand()}

        void main(){
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            ivec2 coord = ivec2(gl_FragCoord.xy);
            // ivec2 res = ivec2(resolution.xy);

            // x: particle position x
            // y: particle position y
            vec4 pos = texture(tPosition, uv);

            pos.y -= 0.1;

            if(pos.y < -res.y * 0.5 - rad){
                pos.x = rand(vec2(time * 0.001 * uv.x, time * 0.01)) * res.x - (res.x * 0.5);
                pos.y = rand(vec2(time * 0.002 * uv.y, time * 0.02)) * res.y - (res.y * 0.5);
            }

            gl_FragColor = pos;
        }
    `
}