import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import gsap from 'gsap';

import { vertCommon, vertBegin } from './shaders/vertex.js';
import { fragCommon, fragFloor, fragMesh } from './shaders/fragment.js';

// scene
const canvas = document.querySelector('.webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10);

// camera
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 200);
camera.position.set(-0.478660610424568, 4.049911084977727, 24.070087333115428);
scene.add(camera);

// controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

// renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// lights
scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const sun = new THREE.DirectionalLight(0xfff5ea, 1.4);
sun.position.set(8, 16, 10);
scene.add(sun);

// shockwave uniforms
const shockUniforms = {
    uWaveRadius: { value: -2.0 },
    uWaveWidth: { value: 2.5 },
    uColor: { value: new THREE.Color(0x60d5ff) },
    uOrigin: { value: new THREE.Vector3(camera.position.x, 0, camera.position.z) },
    uVerticalLift: { value: 3.0 }
};

// shader injection
function applyShockwave(mat, isFloor = false) {
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uWaveRadius = shockUniforms.uWaveRadius;
        shader.uniforms.uWaveWidth = shockUniforms.uWaveWidth;
        shader.uniforms.uColor = shockUniforms.uColor;
        shader.uniforms.uOrigin = shockUniforms.uOrigin;
        shader.uniforms.uVerticalLift = shockUniforms.uVerticalLift;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `#include <common>\n${vertCommon}`
        );

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>\n${vertBegin}`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `#include <common>\n${fragCommon}`
        );

        const fragChunk = isFloor ? fragFloor : fragMesh;
        const targetChunk = shader.fragmentShader.includes('#include <opaque_fragment>')
            ? '#include <opaque_fragment>'
            : '#include <dithering_fragment>';
        shader.fragmentShader = shader.fragmentShader.replace(
            targetChunk,
            `${targetChunk}\n${fragChunk}`
        );
    };

    mat.customProgramCacheKey = () => mat.uuid;
}

// floor
const floorMat = new THREE.MeshStandardMaterial({ color: 0x050a14, roughness: 1.0, metalness: 0.0 });
applyShockwave(floorMat, true);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60, 80, 80), floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// centerpiece
const meshes = [];
const centerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.9 });
applyShockwave(centerMat);
const center = new THREE.Mesh(new THREE.TorusKnotGeometry(1.4, 0.4, 128, 32), centerMat);
center.position.set(0, 2.4, 0);
scene.add(center);
meshes.push(center);

function addMesh(geo, color, x, y, z) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.25 });
    applyShockwave(mat);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    scene.add(m);
    meshes.push(m);
    return m;
}

// scattered shapes
const geos = [
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.SphereGeometry(1.0, 32, 32),
    new THREE.ConeGeometry(1.0, 2.0, 32),
    new THREE.CylinderGeometry(0.7, 0.7, 1.8, 32),
    new THREE.TorusGeometry(0.9, 0.35, 24, 48),
    new THREE.IcosahedronGeometry(1.1, 0)
];
const colors = [0xff4081, 0x00e676, 0xffd600, 0x00b0ff, 0xaa00ff, 0xff6d00];

let ci = 0;
for (let r = 4; r <= 16; r += 3.5) {
    const count = Math.floor(r * 1.1);
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const m = addMesh(
            geos[Math.floor(Math.random() * geos.length)],
            colors[ci++ % colors.length],
            Math.cos(a) * r, 1.2, Math.sin(a) * r
        );
        m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    }
}

// animation params
const params = {
    duration: 5.0,
    shapeType: 'Random'
};

// shockwave playback
let busy = false;

function playShockwave() {
    if (busy) return;
    busy = true;
    shockUniforms.uWaveRadius.value = -2.0;
    gsap.to(shockUniforms.uWaveRadius, {
        value: 65.0,
        duration: params.duration,
        ease: 'power2.out',
        onComplete: () => { busy = false; }
    });
}

playShockwave();
document.getElementById('replay-btn').addEventListener('click', playShockwave);

// spawn geometry
const geoMap = {
    Box: () => new THREE.BoxGeometry(1.6, 1.6, 1.6),
    Sphere: () => new THREE.SphereGeometry(1.0, 32, 32),
    Cone: () => new THREE.ConeGeometry(1.0, 2.0, 32),
    Cylinder: () => new THREE.CylinderGeometry(0.7, 0.7, 1.8, 32),
    Torus: () => new THREE.TorusGeometry(0.9, 0.35, 24, 48),
    Icosahedron: () => new THREE.IcosahedronGeometry(1.1, 0),
};
const spawnColors = [0xff4081, 0x00e676, 0xffd600, 0x00b0ff, 0xaa00ff, 0xff6d00, 0xff9100, 0x00e5ff];
let spawnCI = 0;

function spawnGeometry() {
    const type = params.shapeType === 'Random'
        ? Object.keys(geoMap)[Math.floor(Math.random() * Object.keys(geoMap).length)]
        : params.shapeType;
    const geo = geoMap[type]();
    const color = spawnColors[spawnCI++ % spawnColors.length];
    const radius = 4 + Math.random() * 13;
    const angle = Math.random() * Math.PI * 2;
    const m = addMesh(geo, color,
        Math.cos(angle) * radius,
        1.2,
        Math.sin(angle) * radius
    );
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
}

// GUI
const gui = new GUI({ title: 'Controls' });
gui.add(params, 'duration', 1, 12, 0.1).name('Wave Speed (s)');
gui.add(shockUniforms.uVerticalLift, 'value', 0, 4, 0.05).name('Vertical Lift');
gui.add(params, 'shapeType', ['Random', 'Box', 'Sphere', 'Cone', 'Cylinder', 'Torus', 'Icosahedron']).name('Shape');
gui.add({ add: spawnGeometry }, 'add').name('+ Add Geometry');

// resize
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// render loop
(function animate() {
    requestAnimationFrame(animate);
    center.rotation.y += 0.008;
    center.rotation.x += 0.004;
    meshes.forEach((m, idx) => {
        if (m === center) return;
        m.rotation.y += 0.007 + idx * 0.0001;
        m.rotation.x += 0.003;
    });
    controls.update();
    renderer.render(scene, camera);
})();
