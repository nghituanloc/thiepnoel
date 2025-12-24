import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.getElementById('scene');

// Detect device capabilities
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isLowEndDevice = isMobile || window.innerWidth < 768;

const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: !isLowEndDevice, 
    alpha: true,
    powerPreference: isLowEndDevice ? 'low-power' : 'high-performance',
    stencil: false,
    depth: true
});
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
// Limit pixel ratio on mobile for better performance
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEndDevice ? 1.5 : 2));
renderer.shadowMap.enabled = !isLowEndDevice;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x001428);
scene.fog = new THREE.FogExp2(0x001d3d, 0.015);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 150);
const initialCameraPos = new THREE.Vector3(0, 3.2, 9.5);
const initialTarget = new THREE.Vector3(0, 2.8, 0);
camera.position.copy(initialCameraPos);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.enableZoom = true;
controls.minDistance = 7;
controls.maxDistance = 18;
controls.enablePan = false;
controls.minPolarAngle = Math.PI / 6.5;
controls.maxPolarAngle = Math.PI / 2.1;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;
controls.target.copy(initialTarget);
controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
};
controls.update();

// Responsive camera adjustment
function updateCameraForDevice() {
    const width = window.innerWidth;
    if (width < 640) {
        // Mobile nhỏ - xa hơn để thấy toàn cảnh
        camera.position.set(0, 4, 13);
        controls.minDistance = 10;
        controls.maxDistance = 18;
        controls.autoRotateSpeed = 0.22;
        camera.fov = 50;
    } else if (width < 768) {
        // Mobile lớn
        camera.position.set(0, 3.8, 12);
        controls.minDistance = 9;
        controls.maxDistance = 17;
        controls.autoRotateSpeed = 0.25;
        camera.fov = 48;
    } else if (width < 1024) {
        // Tablet
        camera.position.set(0, 3.5, 10.5);
        controls.minDistance = 8;
        controls.maxDistance = 17;
        controls.autoRotateSpeed = 0.27;
        camera.fov = 46;
    } else {
        // Desktop
        camera.position.copy(initialCameraPos);
        controls.minDistance = 7;
        controls.maxDistance = 18;
        controls.autoRotateSpeed = 0.3;
        camera.fov = 45;
    }
    camera.updateProjectionMatrix();
    controls.update();
}

updateCameraForDevice();

function resetView() {
    camera.position.copy(initialCameraPos);
    controls.target.copy(initialTarget);
    controls.autoRotate = true;
    controls.update();
}

// Hệ thống ánh sáng tối ưu
const ambient = new THREE.AmbientLight(0xa8d8ea, 0.9);
scene.add(ambient);

// Ánh sáng chính - ánh trăng
const moonLight = new THREE.DirectionalLight(0xfff8e7, 2.0);
moonLight.position.set(8, 12, 6);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.near = 1;
moonLight.shadow.camera.far = 25;
moonLight.shadow.camera.left = -8;
moonLight.shadow.camera.right = 8;
moonLight.shadow.camera.top = 8;
moonLight.shadow.camera.bottom = -8;
moonLight.shadow.bias = -0.001;
scene.add(moonLight);

// Ánh sáng vàng - warm glow
const goldenLight = new THREE.PointLight(0xffd700, 3.5, 20);
goldenLight.position.set(0, 2.5, 0);
scene.add(goldenLight);

// Ánh sáng xanh - ice blue rim light  
const iceLight = new THREE.PointLight(0xa8d8ea, 1.5, 22);
iceLight.position.set(5, 5, -5);
scene.add(iceLight);

// Ánh sáng phụ từ phía trước
const frontLight = new THREE.PointLight(0xffffff, 1.2, 15);
frontLight.position.set(0, 3, 8);
scene.add(frontLight);

// Mặt đất tuyết phủ
const groundGeo = new THREE.CircleGeometry(12, 80);
const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0xf0f8ff,
    roughness: 0.92,
    metalness: 0.08,
    emissive: 0xa8d8ea,
    emissiveIntensity: 0.05
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Thêm hiệu ứng lấp lánh trên mặt đất (tối ưu)
const sparklesOnGround = new THREE.BufferGeometry();
const sparklesGroundPos = new Float32Array(80 * 3);
for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 11;
    sparklesGroundPos[i * 3] = Math.cos(angle) * radius;
    sparklesGroundPos[i * 3 + 1] = 0.02;
    sparklesGroundPos[i * 3 + 2] = Math.sin(angle) * radius;
}
sparklesOnGround.setAttribute('position', new THREE.BufferAttribute(sparklesGroundPos, 3));
const sparklesGroundMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const groundSparkles = new THREE.Points(sparklesOnGround, sparklesGroundMat);
scene.add(groundSparkles);


// Cây thông 3D đơn giản và đẹp mắt
function createRealisticTree() {
    const tree = new THREE.Group();
    
    // Thân cây
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.2, 12);
    const trunkMat = new THREE.MeshStandardMaterial({ 
        color: 0x5a4030, 
        roughness: 0.9,
        metalness: 0.05,
        emissive: 0x2a1810,
        emissiveIntensity: 0.1
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.6;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    // Vật liệu cho các tầng lá
    const treeMat = new THREE.MeshStandardMaterial({
        color: 0x2d6a3e,
        roughness: 0.85,
        metalness: 0.1,
        emissive: 0x1a3a25,
        emissiveIntensity: 0.12
    });
    
    // Tạo nhiều tầng lá - dạng cone chồng lên nhau
    const layers = [
        { radius: 1.6, height: 1.8, y: 1.3 },
        { radius: 1.4, height: 1.6, y: 2.4 },
        { radius: 1.2, height: 1.4, y: 3.3 },
        { radius: 1.0, height: 1.2, y: 4.0 },
        { radius: 0.8, height: 1.0, y: 4.6 },
        { radius: 0.6, height: 0.8, y: 5.1 },
        { radius: 0.4, height: 0.6, y: 5.5 }
    ];
    
    layers.forEach((layer, index) => {
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(layer.radius, layer.height, 16),
            treeMat.clone()
        );
        
        // Thêm biến thể màu sắc cho mỗi tầng
        const colorVariation = 1 - (index * 0.08);
        cone.material.color.multiplyScalar(colorVariation);
        
        cone.position.y = layer.y;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
    });
    
    // Đỉnh cây - cone nhọn
    const topGeo = new THREE.ConeGeometry(0.25, 0.8, 12);
    const topMat = treeMat.clone();
    topMat.color.lerp(new THREE.Color(0xe0f5e5), 0.3);
    topMat.emissive = new THREE.Color(0x2d6a3e);
    topMat.emissiveIntensity = 0.2;
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 5.9;
    top.castShadow = true;
    tree.add(top);
    
    return tree;
}

const christmasTree = createRealisticTree();
christmasTree.position.y = 0;
scene.add(christmasTree);

// Ngôi sao trên đỉnh cây
const starGroup = new THREE.Group();
const starMat = new THREE.MeshStandardMaterial({ 
    color: 0xffd700,
    emissive: 0xffd700,
    emissiveIntensity: 2.5,
    metalness: 0.9,
    roughness: 0.1
});

// Tạo ngôi sao 3D
function createStar() {
    const shape = new THREE.Shape();
    const points = 5;
    const outer = 0.25;
    const inner = 0.1;
    
    for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    
    const geo = new THREE.ExtrudeGeometry(shape, { 
        depth: 0.08, 
        bevelEnabled: true, 
        bevelSize: 0.02, 
        bevelThickness: 0.02,
        bevelSegments: 2 
    });
    const mesh = new THREE.Mesh(geo, starMat);
    mesh.castShadow = true;
    return mesh;
}

const star3D = createStar();
star3D.rotation.z = Math.PI;
starGroup.add(star3D);

// Thêm ánh sáng phát ra từ ngôi sao
const starGlow = new THREE.PointLight(0xffd700, 5.5, 9);
starGroup.add(starGlow);

// Thêm vòng sáng xung quanh (tối ưu)
const haloGeo = new THREE.TorusGeometry(0.3, 0.02, 8, 24);
const haloMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
});
const halo = new THREE.Mesh(haloGeo, haloMat);
halo.rotation.x = Math.PI / 2;
starGroup.add(halo);

starGroup.position.y = 6.3;
scene.add(starGroup);


// Quả trang trí lấp lánh (tối ưu)
const ornaments = [];
const ornamentColors = [
    0xffd700, 0xff6b9d, 0x66d9ef, 0xffb347, 
    0xa8e6cf, 0xff8c94
];

for (let i = 0; i < 18; i++) {
    const layer = Math.floor(i / 4);
    const idx = i % 4;
    const y = 1.8 + layer * 0.8;
    const maxR = 1.4 - layer * 0.18;
    const angle = (idx / 4) * Math.PI * 2 + layer * 0.4;
    const r = maxR * 0.7;
    
    const size = 0.09 + Math.random() * 0.04;
    const geo = new THREE.SphereGeometry(size, 12, 12);
    const color = ornamentColors[i % ornamentColors.length];
    const mat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.9,
        roughness: 0.1,
        emissive: color,
        emissiveIntensity: 0.3
    });
    
    const orb = new THREE.Mesh(geo, mat);
    orb.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    orb.castShadow = true;
    orb.userData = { phase: i * 0.6, baseY: y };
    ornaments.push(orb);
    scene.add(orb);
}

// Dây đèn lấp lánh (tối ưu)
const lights = [];
const lightColors = [0xffd700, 0xff69b4, 0x00ffff, 0xff8c00];

for (let i = 0; i < 36; i++) {
    const t = i / 36;
    const y = 1.5 + t * 4.5;
    const r = (1.5 - t * 1.1);
    const angle = t * Math.PI * 9;
    
    const geo = new THREE.SphereGeometry(0.04, 8, 8);
    const lightColor = lightColors[i % lightColors.length];
    const mat = new THREE.MeshStandardMaterial({
        color: lightColor,
        emissive: lightColor,
        emissiveIntensity: 2.8,
        transparent: true,
        opacity: 0.95
    });
    
    const light = new THREE.Mesh(geo, mat);
    light.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    light.userData = { phase: i * 0.2, color: lightColor };
    lights.push(light);
    scene.add(light);
}

// Hộp quà đẹp mắt
function createGift(size, color, ribbon) {
    const g = new THREE.Group();
    
    const boxMat = new THREE.MeshStandardMaterial({ 
        color, 
        roughness: 0.3, 
        metalness: 0.15,
        emissive: color,
        emissiveIntensity: 0.08
    });
    const ribMat = new THREE.MeshStandardMaterial({ 
        color: ribbon, 
        roughness: 0.15, 
        metalness: 0.6,
        emissive: ribbon,
        emissiveIntensity: 0.1
    });
    
    const box = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.8, size), boxMat);
    box.castShadow = true;
    box.receiveShadow = true;
    g.add(box);
    
    // Dây ruy băng
    const rw = size * 0.09;
    const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(size + 0.02, rw, size + 0.02), ribMat);
    ribbon1.castShadow = true;
    g.add(ribbon1);
    
    const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(rw, size * 0.82, size + 0.02), ribMat);
    ribbon2.castShadow = true;
    g.add(ribbon2);
    
    // Nơ (tối ưu)
    const bowGeo = new THREE.TorusGeometry(size * 0.1, size * 0.025, 6, 12);
    [-1, 1].forEach(s => {
        const bow = new THREE.Mesh(bowGeo, ribMat);
        bow.position.set(s * size * 0.08, size * 0.45, 0);
        bow.rotation.y = Math.PI / 2;
        bow.rotation.z = s * 0.6;
        g.add(bow);
    });
    
    const knot = new THREE.Mesh(new THREE.SphereGeometry(size * 0.05, 8, 8), ribMat);
    knot.position.y = size * 0.45;
    g.add(knot);
    
    return g;
}

const giftData = [
    { s: 0.7, c: 0xdc143c, r: 0xffd700, x: 2.0, z: 1.2 },
    { s: 0.5, c: 0x4169e1, r: 0xffffff, x: -1.8, z: 1.5 },
    { s: 0.65, c: 0x228b22, r: 0xffd700, x: 1.0, z: -1.3 },
    { s: 0.55, c: 0xffd700, r: 0xdc143c, x: -1.6, z: -0.6 }
];

const gifts = [];
giftData.forEach((d, i) => {
    const gift = createGift(d.s, d.c, d.r);
    gift.position.set(d.x, d.s * 0.4, d.z);
    gift.rotation.y = Math.random() * 0.6 - 0.3;
    gift.userData = { baseY: d.s * 0.4, phase: i * 1.3 };
    gifts.push(gift);
    scene.add(gift);
});


// Hạt tuyết rơi (tối ưu theo thiết bị)
const snowCount = isLowEndDevice ? 150 : 300;
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(snowCount * 3);
const snowSizes = new Float32Array(snowCount);
const snowVel = [];

for (let i = 0; i < snowCount; i++) {
    snowPos[i * 3] = (Math.random() - 0.5) * 22;
    snowPos[i * 3 + 1] = Math.random() * 16;
    snowPos[i * 3 + 2] = (Math.random() - 0.5) * 22;
    snowSizes[i] = 0.04 + Math.random() * 0.05;
    snowVel.push({
        y: 0.01 + Math.random() * 0.012,
        x: (Math.random() - 0.5) * 0.003,
        p: Math.random() * Math.PI * 2
    });
}

snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
snowGeo.setAttribute('size', new THREE.BufferAttribute(snowSizes, 1));

const snowMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.06,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    map: createSnowflakeTexture()
});
const snow = new THREE.Points(snowGeo, snowMat);
scene.add(snow);

// Tạo texture cho bát tuyết
function createSnowflakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Các vì sao xa xăm (tối ưu theo thiết bị)
const starsCount = isLowEndDevice ? 60 : 120;
const starsGeo = new THREE.BufferGeometry();
const starsPos = new Float32Array(starsCount * 3);
const starsSizes = new Float32Array(starsCount);
for (let i = 0; i < starsCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.4;
    const r = 35 + Math.random() * 15;
    starsPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starsPos[i * 3 + 1] = r * Math.cos(phi) + 6;
    starsPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    starsSizes[i] = 0.1 + Math.random() * 0.15;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
starsGeo.setAttribute('size', new THREE.BufferAttribute(starsSizes, 1));

const starsMat = new THREE.PointsMaterial({ 
    color: 0xffffff, 
    size: 0.15, 
    transparent: true, 
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
});
const bgStars = new THREE.Points(starsGeo, starsMat);
scene.add(bgStars);

// Các hạt lấp lánh xung quanh cây (tối ưu theo thiết bị)
const sparkleCount = isLowEndDevice ? 40 : 80;
const sparkleGeo = new THREE.BufferGeometry();
const sparklePos = new Float32Array(sparkleCount * 3);
const sparkleColors = new Float32Array(sparkleCount * 3);
const sparklePhase = [];

for (let i = 0; i < sparkleCount; i++) {
    const t = Math.random();
    const radius = 0.6 + (1 - t) * 1.4;
    const angle = Math.random() * Math.PI * 2;
    const y = 1.6 + t * 4.5;
    sparklePos[i * 3] = Math.cos(angle) * radius;
    sparklePos[i * 3 + 1] = y;
    sparklePos[i * 3 + 2] = Math.sin(angle) * radius;
    
    // Màu ngẫu nhiên
    const colorChoice = Math.random();
    if (colorChoice < 0.5) {
        sparkleColors[i * 3] = 1; sparkleColors[i * 3 + 1] = 0.84; sparkleColors[i * 3 + 2] = 0;
    } else {
        sparkleColors[i * 3] = 1; sparkleColors[i * 3 + 1] = 1; sparkleColors[i * 3 + 2] = 1;
    }
    
    sparklePhase.push(Math.random() * Math.PI * 2);
}

sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
sparkleGeo.setAttribute('color', new THREE.BufferAttribute(sparkleColors, 3));

const sparkleMat = new THREE.PointsMaterial({
    size: 0.05,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    sizeAttenuation: true
});
const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
scene.add(sparkles);

// Dây trang trí vàng lấp lánh (tối ưu)
function createRibbon(turns = 5, height = 4.5, radiusTop = 0.4, radiusBottom = 1.3) {
    const points = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = t * Math.PI * 2 * turns;
        const y = 1.5 + t * height;
        const r = radiusBottom * (1 - t * 0.7) + radiusTop * 0.3;
        points.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
    }
    const path = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(path, 300, 0.015, 6, false);
    const tubeMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.75,
        emissive: 0xffd700,
        emissiveIntensity: 0.4
    });
    const ribbon = new THREE.Mesh(tubeGeo, tubeMat);
    return ribbon;
}

const ribbon = createRibbon();
scene.add(ribbon);

// Các ánh sáng bay nhỏ xung quanh (tối ưu theo thiết bị)
const fireflyCount = isLowEndDevice ? 15 : 25;
const fireflyGeo = new THREE.BufferGeometry();
const fireflyPos = new Float32Array(fireflyCount * 3);
const fireflyColors = new Float32Array(fireflyCount * 3);
const fireflyOffsets = [];

for (let i = 0; i < fireflyCount; i++) {
    const radius = 2.5 + Math.random() * 1.5;
    const angle = Math.random() * Math.PI * 2;
    const y = 0.6 + Math.random() * 2.5;
    fireflyPos[i * 3] = Math.cos(angle) * radius;
    fireflyPos[i * 3 + 1] = y;
    fireflyPos[i * 3 + 2] = Math.sin(angle) * radius;
    
    // Màu vàng
    fireflyColors[i * 3] = 1; 
    fireflyColors[i * 3 + 1] = 0.84; 
    fireflyColors[i * 3 + 2] = 0.4;
    
    fireflyOffsets.push({
        phase: Math.random() * Math.PI * 2,
        radius,
        speed: 0.4 + Math.random() * 0.3,
        vertSpeed: 0.3 + Math.random() * 0.3
    });
}

fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
fireflyGeo.setAttribute('color', new THREE.BufferAttribute(fireflyColors, 3));

const fireflyMat = new THREE.PointsMaterial({
    size: 0.1,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    sizeAttenuation: true
});
const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
scene.add(fireflies);

// Magic particles xung quanh ngôi sao (tối ưu theo thiết bị)
const magicParticleCount = isLowEndDevice ? 20 : 40;
const magicParticleGeo = new THREE.BufferGeometry();
const magicParticlePos = new Float32Array(magicParticleCount * 3);
const magicParticleVel = [];

for (let i = 0; i < magicParticleCount; i++) {
    const radius = 0.3 + Math.random() * 0.4;
    const angle = Math.random() * Math.PI * 2;
    const y = 6.2 + Math.random() * 0.7;
    magicParticlePos[i * 3] = Math.cos(angle) * radius;
    magicParticlePos[i * 3 + 1] = y;
    magicParticlePos[i * 3 + 2] = Math.sin(angle) * radius;
    
    magicParticleVel.push({
        angle: angle,
        radius: radius,
        speed: 0.6 + Math.random() * 0.4,
        ySpeed: (Math.random() - 0.5) * 0.12
    });
}

magicParticleGeo.setAttribute('position', new THREE.BufferAttribute(magicParticlePos, 3));
const magicParticleMat = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 0.06,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
});
const magicParticles = new THREE.Points(magicParticleGeo, magicParticleMat);
scene.add(magicParticles);

// Vòng sáng magic ở đáy cây (tối ưu)
const magicCircleGeo = new THREE.RingGeometry(1.7, 1.9, 32);
const magicCircleMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending
});
const magicCircle = new THREE.Mesh(magicCircleGeo, magicCircleMat);
magicCircle.rotation.x = -Math.PI / 2;
magicCircle.position.y = 0.05;
scene.add(magicCircle);

// ===== THÊM CÁC THÀNH PHẦN GIÁNG SINH BACKGROUND =====

// Người tuyết (Snowman)
function createSnowman(x, z) {
    const snowman = new THREE.Group();
    
    // Thân - 3 quả cầu tuyết
    const snowMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8,
        metalness: 0.1,
        emissive: 0xe0f0ff,
        emissiveIntensity: 0.1
    });
    
    // Quả dưới
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), snowMat);
    bottom.position.y = 0.35;
    bottom.castShadow = true;
    snowman.add(bottom);
    
    // Quả giữa
    const middle = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), snowMat);
    middle.position.y = 0.85;
    middle.castShadow = true;
    snowman.add(middle);
    
    // Quả đầu
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), snowMat);
    head.position.y = 1.25;
    head.castShadow = true;
    snowman.add(head);
    
    // Mũi cà rốt
    const noseMat = new THREE.MeshStandardMaterial({ 
        color: 0xff6600,
        emissive: 0xff3300,
        emissiveIntensity: 0.2
    });
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.15, 8), noseMat);
    nose.rotation.z = Math.PI / 2;
    nose.position.set(0, 1.25, 0.16);
    nose.castShadow = true;
    snowman.add(nose);
    
    // Mắt (than)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);
    leftEye.position.set(-0.08, 1.3, 0.16);
    snowman.add(leftEye);
    
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeMat);
    rightEye.position.set(0.08, 1.3, 0.16);
    snowman.add(rightEye);
    
    // Miệng cười
    for (let i = 0; i < 5; i++) {
        const mouthPart = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), eyeMat);
        const angle = (i - 2) * 0.15;
        mouthPart.position.set(angle * 0.3, 1.15 - Math.abs(angle) * 0.1, 0.16);
        snowman.add(mouthPart);
    }
    
    // Nút áo (than)
    for (let i = 0; i < 3; i++) {
        const button = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
        button.position.set(0, 0.95 - i * 0.15, 0.23);
        snowman.add(button);
    }
    
    // Khăn quàng đỏ
    const scarfMat = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.7,
        metalness: 0.1,
        emissive: 0x880000,
        emissiveIntensity: 0.1
    });
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), scarfMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 1.05;
    scarf.castShadow = true;
    snowman.add(scarf);
    
    // Đuôi khăn quàng
    const scarfTail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.35, 0.04),
        scarfMat
    );
    scarfTail.position.set(0.15, 0.85, 0.15);
    scarfTail.rotation.z = 0.3;
    snowman.add(scarfTail);
    
    // Mũ đen
    const hatMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0.2
    });
    
    // Vành mũ
    const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16),
        hatMat
    );
    brim.position.y = 1.45;
    brim.castShadow = true;
    snowman.add(brim);
    
    // Thân mũ
    const hatBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.25, 16),
        hatMat
    );
    hatBody.position.y = 1.595;
    hatBody.castShadow = true;
    snowman.add(hatBody);
    
    // Tay (cành cây)
    const armMat = new THREE.MeshStandardMaterial({ 
        color: 0x4a3020,
        roughness: 0.9
    });
    
    // Tay trái
    const leftArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.015, 0.45, 6),
        armMat
    );
    leftArm.position.set(-0.3, 0.85, 0);
    leftArm.rotation.z = Math.PI / 3.5;
    leftArm.rotation.x = 0.2;
    leftArm.castShadow = true;
    snowman.add(leftArm);
    
    // Tay phải - giơ lên chào
    const rightArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.015, 0.45, 6),
        armMat
    );
    rightArm.position.set(0.3, 0.85, 0);
    rightArm.rotation.z = -Math.PI / 2.5;
    rightArm.rotation.x = -0.3;
    rightArm.castShadow = true;
    snowman.add(rightArm);
    
    snowman.position.set(x, 0, z);
    return snowman;
}

// Thêm 2 người tuyết lớn (cao bằng 1/2 cây thông)
const snowmen = [];
const snowmanScale = isLowEndDevice ? 1.8 : 2.2;
const snowmanDistance = isLowEndDevice ? -3.5 : -2;

const snowman1 = createSnowman(-5, snowmanDistance);
snowman1.scale.setScalar(snowmanScale);
snowman1.rotation.y = 0.4;
snowman1.userData = { baseRotation: 0.4, swayPhase: 0 };
snowmen.push(snowman1);
scene.add(snowman1);

const snowman2 = createSnowman(5, snowmanDistance);
snowman2.scale.setScalar(snowmanScale * 0.9);
snowman2.rotation.y = -0.4;
snowman2.userData = { baseRotation: -0.4, swayPhase: Math.PI };
snowmen.push(snowman2);
scene.add(snowman2);

// Ngôi nhà Giáng Sinh
function createHouse(x, z) {
    const house = new THREE.Group();
    
    // Thân nhà
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9,
        metalness: 0.05
    });
    
    const walls = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 2, 2),
        wallMat
    );
    walls.position.y = 1;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);
    
    // Mái nhà phủ tuyết
    const roofMat = new THREE.MeshStandardMaterial({
        color: 0xdc143c,
        roughness: 0.7,
        metalness: 0.1
    });
    
    const roofGeo = new THREE.ConeGeometry(1.9, 1.2, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 2.6;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);
    
    // Tuyết trên mái
    const snowRoofMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9
    });
    
    const snowRoof = new THREE.Mesh(
        new THREE.ConeGeometry(2.0, 0.3, 4)
    );
    snowRoof.material = snowRoofMat;
    snowRoof.position.y = 3.05;
    snowRoof.rotation.y = Math.PI / 4;
    house.add(snowRoof);
    
    // Cửa
    const doorMat = new THREE.MeshStandardMaterial({
        color: 0x3d2817,
        roughness: 0.8
    });
    const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 1.2, 0.05),
        doorMat
    );
    door.position.set(0, 0.6, 1.03);
    door.castShadow = true;
    house.add(door);
    
    // Tay nắm cửa
    const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 })
    );
    knob.position.set(0.2, 0.6, 1.06);
    house.add(knob);
    
    // Cửa sổ
    const windowMat = new THREE.MeshStandardMaterial({
        color: 0xffe4b5,
        emissive: 0xffcc66,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.9
    });
    
    // Cửa sổ bên trái
    const window1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.05),
        windowMat
    );
    window1.position.set(-0.7, 1.3, 1.03);
    house.add(window1);
    
    // Khung cửa sổ
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const frameH1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.06), frameMat);
    frameH1.position.set(-0.7, 1.3, 1.04);
    house.add(frameH1);
    
    const frameV1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.06), frameMat);
    frameV1.position.set(-0.7, 1.3, 1.04);
    house.add(frameV1);
    
    // Cửa sổ bên phải
    const window2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.05),
        windowMat
    );
    window2.position.set(0.7, 1.3, 1.03);
    house.add(window2);
    
    const frameH2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.06), frameMat);
    frameH2.position.set(0.7, 1.3, 1.04);
    house.add(frameH2);
    
    const frameV2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.06), frameMat);
    frameV2.position.set(0.7, 1.3, 1.04);
    house.add(frameV2);
    
    // Point light từ cửa sổ
    const windowLight = new THREE.PointLight(0xffcc66, 1.2, 5);
    windowLight.position.set(0, 1.3, 1.5);
    house.add(windowLight);
    house.userData.windowLight = windowLight;
    
    // Ống khói
    const chimneyMat = new THREE.MeshStandardMaterial({
        color: 0x8b0000,
        roughness: 0.8
    });
    
    const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.8, 0.4),
        chimneyMat
    );
    chimney.position.set(-0.8, 2.7, 0.5);
    chimney.castShadow = true;
    house.add(chimney);
    
    // Tuyết trên ống khói
    const snowChimney = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.22, 0.15, 8),
        snowRoofMat
    );
    snowChimney.position.set(-0.8, 3.175, 0.5);
    house.add(snowChimney);
    
    // Khói từ ống khói
    const smokeParticles = [];
    const smokeGeo = new THREE.BufferGeometry();
    const smokePos = new Float32Array(20 * 3);
    
    for (let i = 0; i < 20; i++) {
        smokePos[i * 3] = -0.8 + (Math.random() - 0.5) * 0.2;
        smokePos[i * 3 + 1] = 3.3 + i * 0.15;
        smokePos[i * 3 + 2] = 0.5 + (Math.random() - 0.5) * 0.2;
        smokeParticles.push({
            baseY: 3.3 + i * 0.15,
            speed: 0.01 + Math.random() * 0.01,
            drift: (Math.random() - 0.5) * 0.01
        });
    }
    
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
    const smokeMat = new THREE.PointsMaterial({
        color: 0xcccccc,
        size: 0.15,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true
    });
    const smoke = new THREE.Points(smokeGeo, smokeMat);
    house.add(smoke);
    house.userData.smoke = { particles: smokeParticles, geometry: smokeGeo };
    
    house.position.set(x, 0, z);
    return house;
}

// Thêm ngôi nhà (chỉ desktop)
const houses = [];
if (!isLowEndDevice) {
    const house1 = createHouse(-7, -6);
    house1.rotation.y = 0.3;
    house1.scale.setScalar(0.9);
    houses.push(house1);
    scene.add(house1);
}

// Ông già Noel
function createSanta(x, z) {
    const santa = new THREE.Group();
    
    // Thân (áo đỏ)
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xdc143c,
        roughness: 0.8,
        emissive: 0x8b0000,
        emissiveIntensity: 0.1
    });
    
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.3, 0.8, 12),
        bodyMat
    );
    body.position.y = 0.7;
    body.castShadow = true;
    santa.add(body);
    
    // Đầu
    const headMat = new THREE.MeshStandardMaterial({
        color: 0xffd7b5,
        roughness: 0.9
    });
    
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        headMat
    );
    head.position.y = 1.3;
    head.castShadow = true;
    santa.add(head);
    
    // Mũ đỏ
    const hatMat = new THREE.MeshStandardMaterial({
        color: 0xdc143c,
        roughness: 0.8
    });
    
    const hatCone = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.5, 12),
        hatMat
    );
    hatCone.position.y = 1.65;
    hatCone.rotation.z = 0.2;
    hatCone.castShadow = true;
    santa.add(hatCone);
    
    // Quả bông mũ
    const pompom = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    pompom.position.y = 1.85;
    pompom.position.x = 0.08;
    santa.add(pompom);
    
    // Râu trắng
    const beardMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9
    });
    
    const beard = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.5),
        beardMat
    );
    beard.position.y = 1.15;
    beard.position.z = 0.15;
    santa.add(beard);
    
    // Mũi đỏ
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0xff6b6b,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        })
    );
    nose.position.set(0, 1.3, 0.18);
    santa.add(nose);
    
    // Dây nịt
    const beltMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.6,
        metalness: 0.4
    });
    
    const belt = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.05, 8, 16, Math.PI),
        beltMat
    );
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.7;
    santa.add(belt);
    
    // Khóa đai vàng
    const buckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.1, 0.05),
        new THREE.MeshStandardMaterial({ 
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.2
        })
    );
    buckle.position.set(0, 0.7, 0.32);
    santa.add(buckle);
    
    // Chân (ủng đen)
    const bootMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const leftBoot = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.25, 0.25),
        bootMat
    );
    leftBoot.position.set(-0.12, 0.125, 0);
    leftBoot.castShadow = true;
    santa.add(leftBoot);
    
    const rightBoot = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.25, 0.25),
        bootMat
    );
    rightBoot.position.set(0.12, 0.125, 0);
    rightBoot.castShadow = true;
    santa.add(rightBoot);
    
    // Tay (áo đỏ)
    const leftArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.06, 0.6, 8),
        bodyMat
    );
    leftArm.position.set(-0.35, 0.8, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.castShadow = true;
    santa.add(leftArm);
    
    // Tay phải giơ lên vẫy chào
    const rightArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.06, 0.6, 8),
        bodyMat
    );
    rightArm.position.set(0.35, 0.9, 0);
    rightArm.rotation.z = -Math.PI / 2.5;
    rightArm.castShadow = true;
    santa.add(rightArm);
    
    // Găng tay trắng
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    const leftGlove = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        gloveMat
    );
    leftGlove.position.set(-0.5, 0.55, 0);
    santa.add(leftGlove);
    
    const rightGlove = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        gloveMat
    );
    rightGlove.position.set(0.45, 1.15, 0);
    santa.add(rightGlove);
    
    // Túi quà
    const bagMat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9
    });
    
    const bag = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 12, 12),
        bagMat
    );
    bag.position.set(-0.5, 0.3, 0);
    bag.castShadow = true;
    santa.add(bag);
    
    // Dây túi
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xdaa520 });
    const rope = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.015, 6, 12),
        ropeMat
    );
    rope.position.set(-0.5, 0.5, 0);
    rope.rotation.x = Math.PI / 2;
    santa.add(rope);
    
    // Cây thông mini nhô ra từ túi
    const miniTreeMat = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        emissive: 0x0f4d0f,
        emissiveIntensity: 0.2
    });
    
    const miniTree = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.25, 8),
        miniTreeMat
    );
    miniTree.position.set(-0.5, 0.6, 0);
    santa.add(miniTree);
    
    // Ngôi sao nhỏ trên cây mini
    const miniStar = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        new THREE.MeshBasicMaterial({ 
            color: 0xffd700,
            emissive: 0xffd700
        })
    );
    miniStar.position.set(-0.5, 0.73, 0);
    santa.add(miniStar);
    
    santa.position.set(x, 0, z);
    santa.userData = { 
        baseRotation: 0,
        wavePhase: 0,
        rightArm: rightArm
    };
    return santa;
}

// Thêm ông già Noel (hiện cả mobile)
const santas = [];
const santaScale = isLowEndDevice ? 1.3 : 1.6;
const santaDistance = isLowEndDevice ? -4 : -5;

const santa1 = createSanta(7, santaDistance);
santa1.rotation.y = -Math.PI / 6;
santa1.scale.setScalar(santaScale);
santa1.userData.baseRotation = -Math.PI / 6;
santas.push(santa1);
scene.add(santa1);

// Tuần lộc (Reindeer)
function createReindeer(x, z) {
    const reindeer = new THREE.Group();
    
    // Màu nâu cho tuần lộc
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9,
        metalness: 0.05
    });
    
    // Thân
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.3, 0.6),
        bodyMat
    );
    body.position.y = 0.65;
    body.castShadow = true;
    reindeer.add(body);
    
    // Đầu
    const headMat = new THREE.MeshStandardMaterial({
        color: 0xa0522d,
        roughness: 0.9
    });
    
    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.25),
        headMat
    );
    head.position.set(0, 0.85, 0.35);
    head.castShadow = true;
    reindeer.add(head);
    
    // Mõm
    const snout = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.12, 0.15),
        headMat
    );
    snout.position.set(0, 0.8, 0.5);
    reindeer.add(snout);
    
    // Mũi đỏ (Rudolph)
    const redNose = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 1.5
        })
    );
    redNose.position.set(0, 0.8, 0.58);
    reindeer.add(redNose);
    
    // Point light cho mũi đỏ
    const noseLight = new THREE.PointLight(0xff0000, 0.5, 2);
    noseLight.position.set(0, 0.8, 0.6);
    reindeer.add(noseLight);
    reindeer.userData.noseLight = noseLight;
    
    // Tai
    const earMat = new THREE.MeshStandardMaterial({ color: 0xa0522d });
    
    const leftEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.12, 6),
        earMat
    );
    leftEar.position.set(-0.08, 1.0, 0.35);
    leftEar.rotation.z = -0.3;
    reindeer.add(leftEar);
    
    const rightEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.12, 6),
        earMat
    );
    rightEar.position.set(0.08, 1.0, 0.35);
    rightEar.rotation.z = 0.3;
    reindeer.add(rightEar);
    
    // Sừng (Antlers)
    const antlerMat = new THREE.MeshStandardMaterial({
        color: 0x654321,
        roughness: 0.8
    });
    
    function createAntler(side) {
        const antler = new THREE.Group();
        
        // Thân sừng chính
        const main = new THREE.Mesh(
            new THREE.CylinderGeometry(0.02, 0.015, 0.3, 6),
            antlerMat
        );
        main.rotation.z = side * Math.PI / 6;
        antler.add(main);
        
        // Nhánh sừng
        for (let i = 0; i < 2; i++) {
            const branch = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.01, 0.15, 5),
                antlerMat
            );
            branch.position.y = 0.1 + i * 0.08;
            branch.position.x = side * 0.05;
            branch.rotation.z = side * Math.PI / 4;
            antler.add(branch);
        }
        
        return antler;
    }
    
    const leftAntler = createAntler(-1);
    leftAntler.position.set(-0.08, 1.0, 0.3);
    reindeer.add(leftAntler);
    
    const rightAntler = createAntler(1);
    rightAntler.position.set(0.08, 1.0, 0.3);
    reindeer.add(rightAntler);
    
    // Chân
    const legMat = new THREE.MeshStandardMaterial({
        color: 0x654321,
        roughness: 0.9
    });
    
    const legPositions = [
        [-0.12, 0, 0.2],
        [0.12, 0, 0.2],
        [-0.12, 0, -0.15],
        [0.12, 0, -0.15]
    ];
    
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.025, 0.4, 6),
            legMat
        );
        leg.position.set(pos[0], 0.2, pos[1]);
        leg.castShadow = true;
        reindeer.add(leg);
    });
    
    // Đuôi
    const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.15, 6),
        bodyMat
    );
    tail.position.set(0, 0.7, -0.35);
    tail.rotation.x = Math.PI / 3;
    reindeer.add(tail);
    
    reindeer.position.set(x, 0, z);
    reindeer.userData = {
        baseY: 0,
        jumpPhase: Math.random() * Math.PI * 2
    };
    return reindeer;
}

// Thêm tuần lộc (hiện cả mobile)
const reindeers = [];
const reindeerScale = isLowEndDevice ? 1.0 : 1.5;
const reindeerDistance = isLowEndDevice ? -3.5 : -3;

const reindeer1 = createReindeer(6, reindeerDistance);
reindeer1.rotation.y = -Math.PI / 4;
reindeer1.scale.setScalar(reindeerScale);
reindeers.push(reindeer1);
scene.add(reindeer1);

const reindeer2 = createReindeer(-6, isLowEndDevice ? -4.5 : -4);
reindeer2.rotation.y = Math.PI / 3;
reindeer2.scale.setScalar(reindeerScale * 0.87);
reindeers.push(reindeer2);
scene.add(reindeer2);

// Hòm thư Giáng Sinh (Mailbox)
function createMailbox(x, z) {
    const mailbox = new THREE.Group();
    
    // Cột
    const postMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.05, 0.8, 8),
        postMat
    );
    post.position.y = 0.4;
    post.castShadow = true;
    mailbox.add(post);
    
    // Hộp thư
    const boxMat = new THREE.MeshStandardMaterial({
        color: 0xdc143c,
        roughness: 0.7,
        metalness: 0.3
    });
    
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.25, 0.2),
        boxMat
    );
    box.position.y = 0.925;
    box.castShadow = true;
    mailbox.add(box);
    
    // Nắp hộp thư (bán cầu)
    const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.175, 0.175, 0.25, 12, 1, false, 0, Math.PI),
        boxMat
    );
    lid.rotation.z = Math.PI / 2;
    lid.position.y = 1.05;
    lid.castShadow = true;
    mailbox.add(lid);
    
    // Cờ đỏ
    const flagMat = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0x880000,
        emissiveIntensity: 0.2
    });
    const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.08, 0.02),
        flagMat
    );
    flag.position.set(0.3, 1.05, 0);
    flag.rotation.y = -Math.PI / 6;
    mailbox.add(flag);
    
    // Tuyết trên hộp thư
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const snow = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12, 1, false, 0, Math.PI),
        snowMat
    );
    snow.rotation.z = Math.PI / 2;
    snow.position.y = 1.15;
    mailbox.add(snow);
    
    mailbox.position.set(x, 0, z);
    return mailbox;
}

// Thêm hòm thư (mobile: 0, desktop: 2)
if (!isLowEndDevice) {
    const mailbox1 = createMailbox(-8, -3);
    mailbox1.scale.setScalar(0.9);
    scene.add(mailbox1);
    
    const mailbox2 = createMailbox(8, -3.5);
    mailbox2.rotation.y = Math.PI;
    mailbox2.scale.setScalar(0.9);
    scene.add(mailbox2);
}

// Bảng chỉ dẫn "North Pole"
function createSign(x, z) {
    const sign = new THREE.Group();
    
    // Cột
    const postMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 1.2, 8),
        postMat
    );
    post.position.y = 0.6;
    post.castShadow = true;
    sign.add(post);
    
    // Bảng gỗ
    const boardMat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9
    });
    
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.3, 0.05),
        boardMat
    );
    board.position.y = 1.2;
    board.castShadow = true;
    sign.add(board);
    
    // Tuyết trên bảng
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const snow = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.08, 0.06),
        snowMat
    );
    snow.position.y = 1.34;
    sign.add(snow);
    
    // Mũi tên chỉ hướng
    const arrowMat = new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3
    });
    const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.15, 3),
        arrowMat
    );
    arrow.rotation.z = -Math.PI / 2;
    arrow.position.set(0.5, 1.2, 0.03);
    sign.add(arrow);
    
    sign.position.set(x, 0, z);
    sign.rotation.y = Math.random() * 0.3 - 0.15;
    return sign;
}

// Thêm bảng chỉ dẫn (hiện cả mobile)
const sign1 = createSign(0, isLowEndDevice ? -4.5 : -5);
sign1.scale.setScalar(isLowEndDevice ? 0.8 : 1);
scene.add(sign1);

// Cây thông nhỏ xung quanh
function createSmallTree(x, z, scale = 1) {
    const tree = new THREE.Group();
    
    const treeMat = new THREE.MeshStandardMaterial({
        color: 0x2d5c3a,
        roughness: 0.9,
        emissive: 0x1a3025,
        emissiveIntensity: 0.1
    });
    
    // 3 tầng lá
    for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(0.4 - i * 0.1, 0.6, 8),
            treeMat
        );
        cone.position.y = 0.3 + i * 0.35;
        cone.castShadow = true;
        tree.add(cone);
    }
    
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    return tree;
}

// Thêm rừng cây nhỏ xung quanh (mobile: 4, desktop: 6)
const smallTreePositions = isLowEndDevice 
    ? [
        { x: -5, z: 2, s: 0.6 },
        { x: 5.5, z: 1.5, s: 0.7 },
        { x: -3, z: 4, s: 0.5 },
        { x: 3.5, z: 4, s: 0.6 }
      ]
    : [
        { x: -5, z: 2, s: 0.6 },
        { x: -6, z: -1, s: 0.8 },
        { x: 5.5, z: 1.5, s: 0.7 },
        { x: 6, z: -2, s: 0.9 },
        { x: -3, z: 4, s: 0.5 },
        { x: 3.5, z: 4, s: 0.6 }
      ];

smallTreePositions.forEach(pos => {
    const tree = createSmallTree(pos.x, pos.z, pos.s);
    scene.add(tree);
});

// Hàng rào tuyết
function createFence(startX, startZ, length, rotation = 0) {
    const fence = new THREE.Group();
    const fenceMat = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9
    });
    const snowCapMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.8
    });
    
    const posts = Math.floor(length / 0.5);
    for (let i = 0; i < posts; i++) {
        // Cột dọc
        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.4, 0.06),
            fenceMat
        );
        post.position.set(i * 0.5, 0.2, 0);
        post.castShadow = true;
        fence.add(post);
        
        // Tuyết trên cột
        const snowCap = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.04, 0.08),
            snowCapMat
        );
        snowCap.position.set(i * 0.5, 0.42, 0);
        fence.add(snowCap);
        
        // Thanh ngang
        if (i < posts - 1) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.04, 0.04),
                fenceMat
            );
            rail.position.set(i * 0.5 + 0.25, 0.25, 0);
            fence.add(rail);
        }
    }
    
    fence.position.set(startX, 0, startZ);
    fence.rotation.y = rotation;
    return fence;
}

// Thêm hàng rào (mobile: 1, desktop: 2)
const fence1 = createFence(-7, -4, isLowEndDevice ? 3 : 4, 0);
fence1.scale.setScalar(isLowEndDevice ? 0.8 : 1);
scene.add(fence1);

if (!isLowEndDevice) {
    const fence2 = createFence(3.5, -4, 4, 0);
    scene.add(fence2);
}

// Shooting stars (Sao băng)
const shootingStars = [];
const shootingStarCount = isLowEndDevice ? 2 : 5;

function createShootingStar() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(20 * 3);
    
    for (let i = 0; i < 20; i++) {
        const t = i / 20;
        positions[i * 3] = t * 2;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const star = new THREE.Points(geometry, material);
    star.position.set(
        (Math.random() - 0.5) * 20,
        10 + Math.random() * 10,
        (Math.random() - 0.5) * 20
    );
    star.rotation.z = Math.random() * Math.PI;
    
    star.userData = {
        velocity: new THREE.Vector3(
            -0.1 - Math.random() * 0.1,
            -0.05 - Math.random() * 0.05,
            0
        ),
        life: 0,
        maxLife: 3 + Math.random() * 2
    };
    
    return star;
}

for (let i = 0; i < shootingStarCount; i++) {
    const star = createShootingStar();
    star.userData.life = Math.random() * star.userData.maxLife;
    shootingStars.push(star);
    scene.add(star);
}

// Đám mây tuyết nhẹ
const cloudCount = isLowEndDevice ? 0 : 3;
const clouds = [];

function createCloud(x, y, z) {
    const cloud = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xe0e8f0,
        transparent: true,
        opacity: 0.3,
        roughness: 1
    });
    
    for (let i = 0; i < 5; i++) {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8),
            cloudMat
        );
        sphere.position.set(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.5
        );
        cloud.add(sphere);
    }
    
    cloud.position.set(x, y, z);
    cloud.userData = {
        speed: 0.01 + Math.random() * 0.01,
        startX: x
    };
    return cloud;
}

for (let i = 0; i < cloudCount; i++) {
    const cloud = createCloud(
        (Math.random() - 0.5) * 20,
        8 + Math.random() * 3,
        -10 - Math.random() * 5
    );
    clouds.push(cloud);
    scene.add(cloud);
}

// Đèn cột đường (Lamp posts)
function createLampPost(x, z) {
    const lamp = new THREE.Group();
    
    // Cột
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2c2c2c });
    const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.06, 1.8, 8),
        postMat
    );
    post.position.y = 0.9;
    post.castShadow = true;
    lamp.add(post);
    
    // Đèn
    const lightGeo = new THREE.SphereGeometry(0.15, 12, 12);
    const lightMat = new THREE.MeshStandardMaterial({
        color: 0xfff4d0,
        emissive: 0xfff4d0,
        emissiveIntensity: 1.5
    });
    const bulb = new THREE.Mesh(lightGeo, lightMat);
    bulb.position.y = 1.8;
    lamp.add(bulb);
    
    // Point light
    const light = new THREE.PointLight(0xfff4d0, 0.8, 4);
    light.position.y = 1.8;
    lamp.add(light);
    
    // Tuyết trên đèn
    const snowTop = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    snowTop.position.y = 1.95;
    lamp.add(snowTop);
    
    lamp.position.set(x, 0, z);
    lamp.userData = { light: light, baseLightIntensity: 0.8 };
    return lamp;
}

// Thêm đèn cột (mobile: 1, desktop: 2)
const lampPosts = [];
const lamp1 = createLampPost(-3.5, -3.5);
lamp1.scale.setScalar(isLowEndDevice ? 0.8 : 1);
lampPosts.push(lamp1);
scene.add(lamp1);

if (!isLowEndDevice) {
    const lamp2 = createLampPost(3.5, -3.5);
    lampPosts.push(lamp2);
    scene.add(lamp2);
}

// Tuyết trên mặt đất (snow piles)
function createSnowPile(x, z, size = 1) {
    const pile = new THREE.Mesh(
        new THREE.SphereGeometry(0.3 * size, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0.05
        })
    );
    pile.position.set(x, 0, z);
    pile.scale.y = 0.5;
    pile.receiveShadow = true;
    return pile;
}

// Thêm các đống tuyết ngẫu nhiên (mobile: 6, desktop: 10)
const snowPileCount = isLowEndDevice ? 6 : 10;
for (let i = 0; i < snowPileCount; i++) {
    const angle = (i / snowPileCount) * Math.PI * 2;
    const radius = 6 + Math.random() * 2;
    const pile = createSnowPile(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (isLowEndDevice ? 0.7 : 0.8) + Math.random() * 0.4
    );
    scene.add(pile);
}

// Kẹo gậy Giáng Sinh (Candy Canes)
function createCandyCane(x, z) {
    const candyCane = new THREE.Group();
    
    // Tạo đường curve cho kẹo gậy
    const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.3, 0),
        new THREE.Vector3(0.15, 0.5, 0)
    );
    
    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.02, 8, false);
    
    // Tạo texture sọc đỏ trắng
    const candyMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.3,
        metalness: 0.5,
        emissive: 0xff0000,
        emissiveIntensity: 0.2
    });
    
    const candy = new THREE.Mesh(tubeGeo, candyMat);
    candy.castShadow = true;
    candyCane.add(candy);
    
    candyCane.position.set(x, 0, z);
    candyCane.rotation.y = Math.random() * Math.PI * 2;
    return candyCane;
}

// Thêm kẹo gậy (mobile: 2, desktop: 4)
const candyPositions = isLowEndDevice 
    ? [{ x: -2.5, z: 3 }, { x: 2.5, z: 3 }]
    : [{ x: -2.5, z: 3 }, { x: 2.5, z: 3 }, { x: -4.5, z: 0 }, { x: 4.5, z: 0.5 }];

candyPositions.forEach(pos => {
    const candy = createCandyCane(pos.x, pos.z);
    candy.scale.setScalar(isLowEndDevice ? 0.8 : 1);
    scene.add(candy);
});

// Chuông Giáng Sinh (Bells)
function createBell(x, y, z) {
    const bell = new THREE.Group();
    
    // Thân chuông
    const bellGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.15, 12);
    const bellMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.2,
        metalness: 0.9,
        emissive: 0xffd700,
        emissiveIntensity: 0.3
    });
    const bellMesh = new THREE.Mesh(bellGeo, bellMat);
    bellMesh.castShadow = true;
    bell.add(bellMesh);
    
    // Quả đập chuông
    const clapperGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const clapper = new THREE.Mesh(clapperGeo, bellMat);
    clapper.position.y = -0.1;
    bell.add(clapper);
    
    // Dây treo
    const ropeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 6);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.y = 0.15;
    bell.add(rope);
    
    bell.position.set(x, y, z);
    bell.userData = { 
        swingAngle: 0, 
        swingSpeed: 2 + Math.random(),
        baseY: y 
    };
    return bell;
}

// Thêm chuông treo (mobile: 1, desktop: 2)
const bells = [];
const bell1 = createBell(0, 1.5, 2.5);
bell1.scale.setScalar(isLowEndDevice ? 1.2 : 1.5);
bells.push(bell1);
scene.add(bell1);

if (!isLowEndDevice) {
    const bell2 = createBell(1.8, 1.5, 2.5);
    bell2.scale.setScalar(1.3);
    bells.push(bell2);
    scene.add(bell2);
}

// Dấu chân trên tuyết (Footprints)
function createFootprint(x, z, rotation) {
    const footprint = new THREE.Group();
    
    const fpMat = new THREE.MeshStandardMaterial({
        color: 0xd0e0f0,
        roughness: 0.9
    });
    
    // Gót chân
    const heel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8),
        fpMat
    );
    heel.position.z = -0.06;
    footprint.add(heel);
    
    // Bàn chân
    const sole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.09, 0.02, 8),
        fpMat
    );
    sole.position.z = 0.04;
    footprint.add(sole);
    
    footprint.position.set(x, 0.01, z);
    footprint.rotation.y = rotation;
    return footprint;
}

// Tạo đường đi bằng dấu chân (mobile: 4, desktop: 10)
const footprintCount = isLowEndDevice ? 4 : 10;
for (let i = 0; i < footprintCount; i++) {
    const t = i / footprintCount;
    const angle = -Math.PI / 4;
    const distance = 3 + i * 0.4;
    
    const x = Math.cos(angle) * distance - 1;
    const z = Math.sin(angle) * distance - 1;
    const side = i % 2 === 0 ? 0.1 : -0.1;
    
    const footprint = createFootprint(x + side, z, angle + Math.PI / 2);
    footprint.scale.setScalar(isLowEndDevice ? 0.8 : 1);
    scene.add(footprint);
}

// Particles lấp lánh trong không khí (Magic dust)
const magicDustCount = isLowEndDevice ? 30 : 60;
const magicDustGeo = new THREE.BufferGeometry();
const magicDustPos = new Float32Array(magicDustCount * 3);
const magicDustVel = [];

for (let i = 0; i < magicDustCount; i++) {
    magicDustPos[i * 3] = (Math.random() - 0.5) * 15;
    magicDustPos[i * 3 + 1] = Math.random() * 8;
    magicDustPos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    
    magicDustVel.push({
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        phase: Math.random() * Math.PI * 2
    });
}

magicDustGeo.setAttribute('position', new THREE.BufferAttribute(magicDustPos, 3));
const magicDustMat = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 0.03,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const magicDust = new THREE.Points(magicDustGeo, magicDustMat);
scene.add(magicDust);

// Animation loop nâng cao
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Xoay ngôi sao và thay đổi ánh sáng
    starGroup.rotation.y = t * 0.35;
    starGlow.intensity = 4.5 + Math.sin(t * 2.5) * 1.5;
    halo.rotation.z = t * 0.5;

    // Các quả trang trí nhẹ nhàng
    ornaments.forEach(o => {
        o.position.y = o.userData.baseY + Math.sin(t * 1.4 + o.userData.phase) * 0.025;
        o.rotation.y += 0.005;
    });

    // Dây đèn nhấp nháy
    lights.forEach(l => {
        const pulse = Math.sin(t * 3.5 + l.userData.phase);
        l.material.emissiveIntensity = 2.0 + pulse * 1.2;
        l.scale.setScalar(0.9 + pulse * 0.4);
    });

    // Hộp quà nhẹ nhàng
    gifts.forEach(g => {
        g.position.y = g.userData.baseY + Math.sin(t * 0.8 + g.userData.phase) * 0.025;
        g.rotation.y = Math.sin(t * 0.3 + g.userData.phase) * 0.05;
    });

    // Tuyết rơi
    const sp = snow.geometry.attributes.position.array;
    for (let i = 0; i < snowCount; i++) {
        sp[i * 3 + 1] -= snowVel[i].y;
        sp[i * 3] += snowVel[i].x + Math.sin(t * 0.4 + snowVel[i].p) * 0.003;
        sp[i * 3 + 2] += Math.cos(t * 0.35 + snowVel[i].p) * 0.002;
        
        if (sp[i * 3 + 1] < 0) {
            sp[i * 3 + 1] = 16;
            sp[i * 3] = (Math.random() - 0.5) * 22;
            sp[i * 3 + 2] = (Math.random() - 0.5) * 22;
        }
    }
    snow.geometry.attributes.position.needsUpdate = true;

    // Sao xa nhấp nháy
    starsMat.opacity = 0.5 + Math.sin(t * 0.3) * 0.25;
    bgStars.rotation.y = t * 0.01;

    // Lấp lánh mặt đất
    sparklesGroundMat.opacity = 0.5 + Math.sin(t * 2) * 0.3;

    // Fireflies bay
    const fp = fireflies.geometry.attributes.position.array;
    for (let i = 0; i < fireflyCount; i++) {
        const off = fireflyOffsets[i];
        fp[i * 3] = Math.cos(t * off.speed + off.phase) * off.radius;
        fp[i * 3 + 2] = Math.sin(t * off.speed + off.phase) * off.radius;
        fp[i * 3 + 1] = 0.8 + Math.sin(t * off.vertSpeed + off.phase) * 0.6;
    }
    fireflies.geometry.attributes.position.needsUpdate = true;
    fireflyMat.opacity = 0.7 + Math.sin(t * 3) * 0.3;

    // Sparkles xung quanh cây
    const spk = sparkles.geometry.attributes.position.array;
    for (let i = 0; i < sparkleCount; i++) {
        const phase = sparklePhase[i];
        const yOffset = Math.sin(t * 2 + phase) * 0.003;
        spk[i * 3 + 1] += yOffset;
        
        const radius = Math.sqrt(spk[i * 3] * spk[i * 3] + spk[i * 3 + 2] * spk[i * 3 + 2]);
        const angle = Math.atan2(spk[i * 3 + 2], spk[i * 3]) + 0.002;
        spk[i * 3] = Math.cos(angle) * radius;
        spk[i * 3 + 2] = Math.sin(angle) * radius;
    }
    sparkles.geometry.attributes.position.needsUpdate = true;
    sparkleMat.opacity = 0.6 + Math.sin(t * 2.5) * 0.3;

    // Dây vàng xoay nhẹ
    ribbon.rotation.y = Math.sin(t * 0.4) * 0.06;

    // Ánh sáng động
    goldenLight.intensity = 3 + Math.sin(t * 1.5) * 1.0;
    iceLight.intensity = 1.5 + Math.sin(t * 1.2 + 1) * 0.5;

    // Magic particles xung quanh ngôi sao
    const mp = magicParticles.geometry.attributes.position.array;
    for (let i = 0; i < magicParticleCount; i++) {
        const vel = magicParticleVel[i];
        vel.angle += vel.speed * 0.02;
        mp[i * 3] = Math.cos(vel.angle) * vel.radius;
        mp[i * 3 + 2] = Math.sin(vel.angle) * vel.radius;
        mp[i * 3 + 1] += vel.ySpeed * 0.01;
        
        if (mp[i * 3 + 1] < 6.0 || mp[i * 3 + 1] > 7.1) {
            vel.ySpeed *= -1;
        }
    }
    magicParticles.geometry.attributes.position.needsUpdate = true;
    magicParticleMat.opacity = 0.7 + Math.sin(t * 2) * 0.3;

    // Vòng sáng magic
    magicCircle.rotation.z = t * 0.2;
    magicCircleMat.opacity = 0.1 + Math.sin(t * 1.5) * 0.08;

    // ===== ANIMATION CÁC THÀNH PHẦN GIÁNG SINH BACKGROUND =====
    
    // Shooting stars (Sao băng)
    shootingStars.forEach((star, index) => {
        star.userData.life += 0.016;
        
        if (star.userData.life >= star.userData.maxLife) {
            // Reset sao băng
            star.position.set(
                (Math.random() - 0.5) * 20,
                10 + Math.random() * 10,
                (Math.random() - 0.5) * 20
            );
            star.userData.life = 0;
        } else {
            // Di chuyển sao băng
            star.position.add(star.userData.velocity);
            
            // Fade out khi gần hết life
            const lifeRatio = star.userData.life / star.userData.maxLife;
            star.material.opacity = lifeRatio < 0.3 ? lifeRatio / 0.3 : (1 - lifeRatio) / 0.7;
        }
    });
    
    // Clouds (Đám mây) - di chuyển chậm
    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed;
        if (cloud.position.x > 15) {
            cloud.position.x = -15;
        }
        // Lên xuống nhẹ
        cloud.position.y += Math.sin(t * 0.3 + cloud.position.x) * 0.001;
    });
    
    // Lamp posts - nhấp nháy nhẹ
    lampPosts.forEach((lamp, index) => {
        const light = lamp.userData.light;
        light.intensity = lamp.userData.baseLightIntensity + Math.sin(t * 2 + index) * 0.2;
    });
    
    // Bells - đung đưa nhẹ
    bells.forEach((bell, index) => {
        bell.userData.swingAngle = Math.sin(t * bell.userData.swingSpeed + index) * 0.15;
        bell.rotation.z = bell.userData.swingAngle;
        bell.position.y = bell.userData.baseY + Math.abs(Math.sin(t * bell.userData.swingSpeed + index)) * 0.02;
    });
    
    // Magic dust - lơ lửng và lấp lánh
    const mdp = magicDust.geometry.attributes.position.array;
    for (let i = 0; i < magicDustCount; i++) {
        mdp[i * 3] += magicDustVel[i].x;
        mdp[i * 3 + 1] += Math.sin(t + magicDustVel[i].phase) * 0.005;
        
        // Reset nếu ra ngoài phạm vi
        if (Math.abs(mdp[i * 3]) > 8 || mdp[i * 3 + 1] < 0 || mdp[i * 3 + 1] > 8) {
            mdp[i * 3] = (Math.random() - 0.5) * 15;
            mdp[i * 3 + 1] = Math.random() * 8;
            mdp[i * 3 + 2] = (Math.random() - 0.5) * 15;
        }
    }
    magicDust.geometry.attributes.position.needsUpdate = true;
    magicDustMat.opacity = 0.4 + Math.sin(t * 1.5) * 0.2;
    
    // Snowmen - đung đưa nhẹ
    snowmen.forEach((snowman, index) => {
        const sway = Math.sin(t * 0.8 + snowman.userData.swayPhase) * 0.03;
        snowman.rotation.y = snowman.userData.baseRotation + sway;
    });
    
    // Houses - khói từ ống khói
    houses.forEach((house) => {
        const smoke = house.userData.smoke;
        const smokePos = smoke.geometry.attributes.position.array;
        
        for (let i = 0; i < 20; i++) {
            // Khói bay lên
            smokePos[i * 3 + 1] += smoke.particles[i].speed;
            smokePos[i * 3] += smoke.particles[i].drift * Math.sin(t * 2 + i);
            
            // Reset khói khi bay quá cao
            if (smokePos[i * 3 + 1] > 6) {
                smokePos[i * 3] = -0.8 + (Math.random() - 0.5) * 0.2;
                smokePos[i * 3 + 1] = 3.3;
                smokePos[i * 3 + 2] = 0.5 + (Math.random() - 0.5) * 0.2;
            }
        }
        smoke.geometry.attributes.position.needsUpdate = true;
        
        // Ánh sáng cửa sổ nhấp nháy nhẹ
        house.userData.windowLight.intensity = 1.0 + Math.sin(t * 3) * 0.3;
    });
    
    // Santa - vẫy tay
    santas.forEach((santa) => {
        const wave = Math.sin(t * 3) * 0.3;
        santa.userData.rightArm.rotation.z = -Math.PI / 2.5 + wave;
        
        // Người cũng nghiêng nhẹ
        santa.rotation.y = santa.userData.baseRotation + Math.sin(t * 0.5) * 0.05;
    });
    
    // Reindeer - nhảy nhẹ và mũi đỏ nhấp nháy
    reindeers.forEach((reindeer) => {
        const jump = Math.abs(Math.sin(t * 1.5 + reindeer.userData.jumpPhase)) * 0.15;
        reindeer.position.y = reindeer.userData.baseY + jump;
        
        // Nghiêng khi nhảy
        const tilt = Math.sin(t * 1.5 + reindeer.userData.jumpPhase) * 0.08;
        reindeer.rotation.x = tilt;
        
        // Mũi đỏ Rudolph nhấp nháy
        if (reindeer.userData.noseLight) {
            reindeer.userData.noseLight.intensity = 0.4 + Math.sin(t * 4) * 0.3;
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateCameraForDevice();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        resetView();
    }
});

animate();
