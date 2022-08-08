import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute vec2 coord;

        uniform sampler2D tPosition;
        uniform sampler2D tParam;
        uniform float cameraConstant;

        varying vec3 vColor;

        void main(){
            vec3 nPosition = position;

            vec4 tPos = texelFetch(tPosition, ivec2(coord), 0);
            vec4 tPrm = texelFetch(tParam, ivec2(coord), 0);

            nPosition.xy = tPos.xy;
            vec4 mvPosition = modelViewMatrix * vec4(nPosition, 1.0);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);
            gl_PointSize = tPrm.x * cameraConstant / ( -mvPosition.z );

            vColor = tPrm.yzw;
        }
    `,
    fragment: `
        uniform vec3 color;

        varying vec3 vColor;

        void main(){
            float f = distance(gl_PointCoord, vec2(0.5));

            if(f > 0.5){
            	discard;
            }

            gl_FragColor = vec4(vColor, 1);
        }
    `
}