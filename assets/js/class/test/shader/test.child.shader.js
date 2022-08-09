import ShaderMethod from '../../../method/method.shader.js'

export default {
    vertex: `
        attribute vec2 coord;

        uniform sampler2D tPosition;
        uniform sampler2D tParam;
        uniform float cameraConstant;

        varying vec3 vColor;
        varying vec2 vPosition;

        void main(){
            vec3 nPosition = position;

            vec4 tPos = texelFetch(tPosition, ivec2(coord), 0);
            vec4 tPrm = texelFetch(tParam, ivec2(coord), 0);

            nPosition.xy = tPos.xy;
            vec4 mvPosition = modelViewMatrix * vec4(nPosition, 1.0);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(nPosition, 1.0);
            gl_PointSize = tPrm.x * cameraConstant / ( -mvPosition.z );

            vColor = tPrm.yzw;
            vPosition = tPos.xy;
        }
    `,
    fragment: `
        uniform vec3 color;
        uniform sampler2D uTexture;

        varying vec3 vColor;
        varying vec2 vPosition;

        ${ShaderMethod.snoise3D()}
        ${ShaderMethod.executeNormalizing()}

        void main(){
            // vec2 coord = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
            // vec4 diffuse = texture(uTexture, coord);
            vec4 diffuse = texture(uTexture, gl_PointCoord);

            float f = distance(gl_PointCoord, vec2(0.5));

            float r = snoise3D(vec3(vPosition * 10.0, length(gl_PointCoord)));
            float n = executeNormalizing(r, 0.35, 0.5, -1.0, 1.0);

            if(f > n){
                discard;
            }

            // gl_FragColor = vec4(vColor, 1);
            gl_FragColor = diffuse;
        }
    `
}