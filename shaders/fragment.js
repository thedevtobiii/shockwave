export const fragCommon = /* glsl */`
varying vec3  vWorldPos;
uniform float uWaveRadius;
uniform float uWaveWidth;
uniform float uVerticalLift;
uniform vec3  uColor;
uniform vec3  uOrigin;
`;

export const fragFloor = /* glsl */`
float fDist   = distance(vWorldPos.xz, uOrigin.xz);
float fReveal = 1.0 - smoothstep(uWaveRadius - 0.5, uWaveRadius + 0.5, fDist);
if (fReveal < 0.001) discard;

vec2 gMinor  = abs(fract(vWorldPos.xz - 0.5) - 0.5) / fwidth(vWorldPos.xz);
float minor  = 1.0 - min(min(gMinor.x, gMinor.y), 1.0);

vec2 gMajor  = abs(fract(vWorldPos.xz / 5.0 - 0.5) - 0.5) / fwidth(vWorldPos.xz / 5.0);
float major  = 1.0 - min(min(gMajor.x, gMajor.y), 1.0);

vec3 gridBg    = vec3(0.020, 0.040, 0.080);
vec3 gridMinor = vec3(0.055, 0.185, 0.400);
vec3 gridMajor = vec3(0.115, 0.340, 0.740);

vec3 gridCol = gridBg;
gridCol = mix(gridCol, gridMinor, clamp(minor * 0.75, 0.0, 1.0));
gridCol = mix(gridCol, gridMajor, clamp(major,        0.0, 1.0));
gl_FragColor.rgb = gridCol;

float fFlash = pow(1.0 - smoothstep(0.0, uWaveWidth, abs(fDist - uWaveRadius)), 3.0);
gl_FragColor.rgb += uColor * fFlash * 0.18;
`;

export const fragMesh = /* glsl */`
float xzDist = distance(vWorldPos.xz, uOrigin.xz);
float fDist  = xzDist + max(0.0, vWorldPos.y) * uVerticalLift;

float fReveal = 1.0 - smoothstep(uWaveRadius - 0.5, uWaveRadius + 0.5, fDist);
if (fReveal < 0.001) discard;

float fFlash = pow(1.0 - smoothstep(0.0, uWaveWidth, abs(fDist - uWaveRadius)), 3.0);
gl_FragColor.rgb += uColor * fFlash * 0.20;
`;
