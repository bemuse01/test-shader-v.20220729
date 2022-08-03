export default {
    vertex: `
        attribute vec2 coord;

        uniform sampler2D tPosition;
        uniform vec2 oResolution;
        uniform vec2 eResolution;

        varying vec3 vColor;

        void main(){
            ivec2 icoord = ivec2(coord);
            int idx = icoord.y * 3 + icoord.x;
            vec3 nPosition = position;

            vec4 pos = texelFetch(tPosition, icoord, 0);

            nPosition.xy = pos.xy;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);
            gl_PointSize = 30.0;

            vColor = vec3(1);

            for(int i = 0; i < 3; i++){
                for(int j = 0; j < 3; j++){
                    int idx2 = i * 3 + j;

                    if(idx == idx2) continue;

                    vec4 pos2 = texelFetch(tPosition, ivec2(j, i), 0);
                    float dist = distance(pos.xy, pos2.xy);

                    if(dist < 5.0) vColor = vec3(1.0, 0.0, 0.0);
                }
            }
        }
    `,
    fragment: `
        varying vec3 vColor;

        void main(){
            gl_FragColor = vec4(vColor, 1.0);
        }
    `
}