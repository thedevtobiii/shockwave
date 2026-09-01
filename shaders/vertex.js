export const vertCommon = /* glsl */`
varying vec3 vWorldPos;
uniform vec3 uOrigin;
`;

export const vertBegin = /* glsl */`
vec4 _wPos = modelMatrix * vec4(position, 1.0);
vWorldPos  = _wPos.xyz;
`;
