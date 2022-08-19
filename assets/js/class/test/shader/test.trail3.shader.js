export default {
    vertex: `
        void main(){
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragment: `
        uniform vec2 eResolution;
        uniform vec2 oResolution;
        uniform vec2 uPosition[25];

        void main(){
            vec2 coord = gl_FragCoord.xy / eResolution;

            vec4 color = vec4(coord, 1.0, 0.0);

            for(int i = 0; i < 25; i++){
                vec2 oRatio = (uPosition[i] + oResolution * 0.5) / oResolution;
                vec2 pos = oRatio * eResolution;
                float dist = distance(pos, gl_FragCoord.xy);
                
                if(dist < 20.0) color.a = 1.0;
            }

            gl_FragColor = color;
        }
    `
}