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
            nPosition.xy *= tPos.z;

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
        uniform vec2 fres;
        uniform float rad;

        ${ShaderMethod.rand()}

        void main(){
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            ivec2 coord = ivec2(gl_FragCoord.xy);
            ivec2 res = ivec2(resolution.xy);

            // x: particle position x
            // y: particle position y
            // z: particle radius
            vec4 pos = texture(tPosition, uv);

            pos.y -= 0.1;

            if(pos.y < -fres.y * 0.5 - rad){
                pos.x = rand(vec2(time * 0.001 * uv.x, time * 0.01)) * fres.x - (fres.x * 0.5);
                pos.y = rand(vec2(time * 0.002 * uv.y, time * 0.02)) * fres.y - (fres.y * 0.5);
                pos.z = rad;
            }

            int idx = coord.y * res.x + coord.x;

            // if(pos.z > 0.0){

            //     for(int i = 0; i < res.y; i++){
            //         for(int j = 0; j < res.x; j++){
            //             int idx2 = i * res.x + j;

            //             if(idx == idx2) continue;

            //             vec4 pos2 = texelFetch(tPosition, ivec2(j, i), 0);
            //             float dist = distance(pos.xy, pos2.xy);
            //             float calcRad = pos.z + pos2.z;

            //             if(dist == 0.0) continue;
            //             if(pos2.z == 0.0) continue;

            //             if(dist < calcRad){
            //                 if(idx < idx2){
            //                     pos.z += pos2.z * 0.1;
            //                 }else{
            //                     pos.z = 0.0;
            //                     break;
            //                 }
            //             }
            //         }

            //         if(pos.z == 0.0) break;
            //     }

            // }

            gl_FragColor = pos;
        }
    `
}