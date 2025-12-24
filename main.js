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
        // Mobile nhỏ
        camera.position.set(0, 3.5, 11);
        controls.minDistance = 8;
        controls.maxDistance = 16;
        controls.autoRotateSpeed = 0.25;
    } else if (width < 768) {
        // Mobile lớn
        camera.position.set(0, 3.4, 10.5);
        controls.minDistance = 7.5;
        controls.maxDistance = 17;
        controls.autoRotateSpeed = 0.27;
    } else if (width < 1024) {
        // Tablet
        camera.position.set(0, 3.3, 10);
        controls.minDistance = 7;
        controls.maxDistance = 17.5;
        controls.autoRotateSpeed = 0.28;
    } else {
        // Desktop
        camera.position.copy(initialCameraPos);
        controls.minDistance = 7;
        controls.maxDistance = 18;
        controls.autoRotateSpeed = 0.3;
    }
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


// Cây thông 3D cao cấp với chi tiết phong phú
function createRealisticTree() {
    const tree = new THREE.Group();
    
    const tintColor = (base, factor) => {
        const c = new THREE.Color(base);
        const w = new THREE.Color(0xffffff);
        c.lerp(w, factor);
        return c;
    };
    
    // Thân cây chi tiết hơn với texture
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.25, 1.6, 16);
    const trunkMat = new THREE.MeshStandardMaterial({ 
        color: 0x5a4030, 
        roughness: 0.95,
        metalness: 0.02,
        emissive: 0x2a1810,
        emissiveIntensity: 0.12
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.8;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    
    // Vật liệu lá với nhiều biến thể màu sắc
    const needleMatLight = new THREE.MeshStandardMaterial({
        color: 0x3d9555,
        roughness: 0.7,
        metalness: 0.18,
        emissive: 0x1d4528,
        emissiveIntensity: 0.18,
        side: THREE.DoubleSide
    });
    const needleMatDark = new THREE.MeshStandardMaterial({
        color: 0x2d6840,
        roughness: 0.82,
        metalness: 0.1,
        emissive: 0x0f2818,
        emissiveIntensity: 0.12,
        side: THREE.DoubleSide
    });
    const needleMatMid = new THREE.MeshStandardMaterial({
        color: 0x358047,
        roughness: 0.76,
        metalness: 0.14,
        emissive: 0x163620,
        emissiveIntensity: 0.15,
        side: THREE.DoubleSide
    });
    
    const branchMatBase = new THREE.MeshStandardMaterial({
        color: 0x1f3a28,
        roughness: 0.92,
        metalness: 0.04
    });
    
    // Tối ưu số lượng kim lá theo thiết bị
    const needleDensity = isLowEndDevice ? 22 : 35;
    
    function createBranch(length, thickness, tone, layerIndex) {
        const branch = new THREE.Group();
        
        // Cành chính với chi tiết hơn
        const stemGeo = new THREE.CylinderGeometry(thickness * 0.3, thickness, length, 6);
        const stemMat = branchMatBase.clone();
        stemMat.color.copy(tintColor(0x1f3a28, tone * 0.25));
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.rotation.z = Math.PI / 2;
        stem.position.x = length / 2;
        stem.castShadow = true;
        branch.add(stem);
        
        // Tăng mật độ kim lá
        const needleCount = Math.floor(length * needleDensity);
        
        for (let i = 0; i < needleCount; i++) {
            const t = i / needleCount;
            const x = t * length;
            
            // Biến thể chiều dài kim lá
            const needleLen = 0.18 + Math.random() * 0.12;
            const needleGeo = new THREE.ConeGeometry(0.02, needleLen, 4);
            
            // Chọn màu ngẫu nhiên từ 3 loại
            const colorRand = Math.random();
            let mat;
            if (colorRand < 0.35) {
                mat = needleMatDark.clone();
            } else if (colorRand < 0.7) {
                mat = needleMatMid.clone();
            } else {
                mat = needleMatLight.clone();
            }
            
            // Thêm hiệu ứng sương giá
            const frost = tone * 0.3 + (1 - t) * 0.18;
            mat.color.lerp(new THREE.Color(0xe0f5e8), frost * 0.4);
            
            const needle = new THREE.Mesh(needleGeo, mat);
            needle.position.x = x;
            
            // Phân bố kim lá xung quanh cành dày đặc hơn
            const angle = Math.random() * Math.PI * 2;
            const spread = 0.05 + t * 0.04;
            needle.position.y = Math.cos(angle) * spread;
            needle.position.z = Math.sin(angle) * spread;
            
            // Góc nghiêng tự nhiên hơn
            needle.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.6;
            needle.rotation.y = angle + (Math.random() - 0.5) * 0.3;
            needle.rotation.x = (Math.random() - 0.5) * 0.2;
            
            branch.add(needle);
        }
        
        // Thêm sub-branches (cành phụ) cho tầng dưới
        if (layerIndex < 6 && !isLowEndDevice) {
            const subBranchCount = Math.floor(2 + Math.random() * 2);
            for (let s = 0; s < subBranchCount; s++) {
                const subLength = length * (0.3 + Math.random() * 0.2);
                const subPos = 0.3 + Math.random() * 0.4;
                
                const subBranch = new THREE.Group();
                const subStemGeo = new THREE.CylinderGeometry(thickness * 0.2, thickness * 0.4, subLength, 4);
                const subStem = new THREE.Mesh(subStemGeo, stemMat.clone());
                subStem.rotation.z = Math.PI / 2;
                subStem.position.x = subLength / 2;
                subBranch.add(subStem);
                
                // Kim lá cho cành phụ
                const subNeedleCount = Math.floor(subLength * (needleDensity * 0.7));
                for (let n = 0; n < subNeedleCount; n++) {
                    const nt = n / subNeedleCount;
                    const nx = nt * subLength;
                    const nLen = 0.15 + Math.random() * 0.08;
                    const nGeo = new THREE.ConeGeometry(0.018, nLen, 4);
                    const nMat = (Math.random() < 0.5 ? needleMatDark : needleMatMid).clone();
                    const nNeedle = new THREE.Mesh(nGeo, nMat);
                    nNeedle.position.x = nx;
                    const nAngle = Math.random() * Math.PI * 2;
                    const nSpread = 0.03 + nt * 0.02;
                    nNeedle.position.y = Math.cos(nAngle) * nSpread;
                    nNeedle.position.z = Math.sin(nAngle) * nSpread;
                    nNeedle.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
                    nNeedle.rotation.y = nAngle;
                    subBranch.add(nNeedle);
                }
                
                subBranch.position.x = length * subPos;
                subBranch.rotation.y = (Math.random() - 0.5) * Math.PI;
                subBranch.rotation.z = -0.3 - Math.random() * 0.3;
                branch.add(subBranch);
            }
        }
        
        return branch;
    }
    
    // Tăng số tầng và cành
    const treeHeight = 4.8;
    const layerCount = isLowEndDevice ? 14 : 18;
    
    for (let layer = 0; layer < layerCount; layer++) {
        const t = layer / layerCount;
        const y = 1.2 + t * (treeHeight - 1.2);
        const layerRadius = 1.7 * (1 - t * 0.86);
        const branchCount = Math.floor(8 - t * 2.5);
        const branchLength = layerRadius * (0.88 + Math.random() * 0.2);
        const tone = 0.5 + (1 - t) * 0.35;
        
        for (let b = 0; b < branchCount; b++) {
            const angle = (b / branchCount) * Math.PI * 2 + layer * 0.45;
            const branch = createBranch(branchLength, 0.032 - t * 0.014, tone, layer);
            
            branch.position.y = y;
            branch.rotation.y = angle;
            branch.rotation.z = 0.22 + (1 - t) * 0.38;
            
            tree.add(branch);
        }
    }
    
    // Đỉnh cây đẹp hơn với nhiều chi tiết
    const topHeight = 0.6;
    const topGeo = new THREE.ConeGeometry(0.12, topHeight, 8);
    const topMat = needleMatLight.clone();
    topMat.color.lerp(new THREE.Color(0xe8f7ec), 0.5);
    topMat.emissive = new THREE.Color(0x2d6a3e);
    topMat.emissiveIntensity = 0.2;
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = treeHeight + topHeight / 2 + 0.2;
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

starGroup.position.y = 5.35;
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
    const y = 1.5 + layer * 0.7;
    const maxR = 1.3 - layer * 0.16;
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
    const y = 1.2 + t * 3.8;
    const r = (1.4 - t * 0.95);
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
    const radius = 0.5 + (1 - t) * 1.3;
    const angle = Math.random() * Math.PI * 2;
    const y = 1.3 + t * 3.8;
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
function createRibbon(turns = 5, height = 3.8, radiusTop = 0.35, radiusBottom = 1.1) {
    const points = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = t * Math.PI * 2 * turns;
        const y = 1.2 + t * height;
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
    const y = 5.3 + Math.random() * 0.7;
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
        
        if (mp[i * 3 + 1] < 5.1 || mp[i * 3 + 1] > 6.2) {
            vel.ySpeed *= -1;
        }
    }
    magicParticles.geometry.attributes.position.needsUpdate = true;
    magicParticleMat.opacity = 0.7 + Math.sin(t * 2) * 0.3;

    // Vòng sáng magic
    magicCircle.rotation.z = t * 0.2;
    magicCircleMat.opacity = 0.1 + Math.sin(t * 1.5) * 0.08;

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
