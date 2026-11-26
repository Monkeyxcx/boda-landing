import * as THREE from 'three';

const canvas = document.querySelector<HTMLCanvasElement>('#wedding-world');
const world = document.querySelector<HTMLElement>('.world');
const progressBar = document.querySelector<HTMLElement>('.world-progress i');

if (canvas && world) {
  try {
    const worldSection = world;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 18);
    camera.position.set(0, 0.6, 6.7);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: window.innerWidth > 640, alpha: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 640 ? 1.2 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    scene.add(new THREE.HemisphereLight('#fff8e9', '#758476', 2.2));
    const keyLight = new THREE.DirectionalLight('#fff3d9', 3.1);
    keyLight.position.set(-4, 7, 6);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight('#dfa990', 31, 24, 2);
    rimLight.position.set(4, 1, -11);
    scene.add(rimLight);

    const material = (color: string, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const petalColors = ['#dcae9b', '#e7c3ae', '#e8d8c4', '#c98776', '#efe1d1'];
    const petalShape = new THREE.SphereGeometry(1, 16, 12);
    const centerGeometry = new THREE.SphereGeometry(0.15, 16, 12);
    const stemMaterial = material('#78876d', 0.88);
    const leafMaterial = material('#9ba58b', 0.84);
    const flowerMats = petalColors.map((color) => material(color, 0.76));
    const centerMat = material('#bc906d', 0.75);

    function makeFlower(size = 1) {
      const flower = new THREE.Group();
      const petals = 9;
      for (let i = 0; i < petals; i += 1) {
        const angle = (i / petals) * Math.PI * 2;
        const petal = new THREE.Mesh(petalShape, flowerMats[i % flowerMats.length]);
        petal.scale.set(0.22 * size, 0.43 * size, 0.11 * size);
        petal.position.set(Math.cos(angle) * 0.28 * size, Math.sin(angle) * 0.28 * size, 0);
        petal.rotation.z = angle - Math.PI / 2;
        petal.castShadow = false;
        flower.add(petal);
      }
      const heart = new THREE.Mesh(centerGeometry, centerMat);
      heart.scale.setScalar(size);
      flower.add(heart);
      return flower;
    }

    function addStem(group: THREE.Group, x: number, z: number, height: number, bloomSize: number, tilt = 0) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.043, height, 8), stemMaterial);
      stem.position.set(x, height / 2 - 0.8, z);
      stem.rotation.z = tilt;
      group.add(stem);
      const bloom = makeFlower(bloomSize);
      bloom.position.set(x + Math.sin(tilt) * height * 0.35, height - 0.8, z);
      group.add(bloom);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), leafMaterial);
      leaf.scale.set(0.3, 0.75, 0.12);
      leaf.position.set(x + 0.18, height * 0.42 - 0.8, z);
      leaf.rotation.z = -0.8;
      group.add(leaf);
      return bloom;
    }

    function addArch(group: THREE.Group) {
      const archMaterial = material('#d1bda4', 0.62);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.065, 12, 72, Math.PI), archMaterial);
      arch.rotation.z = Math.PI;
      arch.position.set(0, 0.25, 0);
      group.add(arch);
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 1.72, 12), archMaterial);
        post.position.set(side * 1.55, -0.58, 0);
        group.add(post);
      }
      for (let i = 0; i < 11; i += 1) {
        const angle = Math.PI + (i / 10) * Math.PI;
        const bloom = makeFlower(0.42 + (i % 3) * 0.07);
        bloom.position.set(Math.cos(angle) * 1.56, 0.25 + Math.sin(angle) * 1.56, 0.02);
        group.add(bloom);
      }
      addStem(group, -1.05, 0.05, 1.55, 0.52, -0.12);
      addStem(group, 1.12, 0.08, 1.72, 0.58, 0.12);
    }

    const chapters: THREE.Group[] = [];
    const chapterZ = [0, -9, -18, -27];
    chapterZ.forEach((z, index) => {
      const group = new THREE.Group();
      group.position.z = z;
      scene.add(group);
      chapters.push(group);

      if (index === 0) {
        addArch(group);
        [-2.2, 2.15].forEach((x, i) => addStem(group, x, 0.35, 1.2 + i * 0.18, 0.58, i ? 0.2 : -0.2));
      } else if (index === 1) {
        const ringOne = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.075, 16, 80), material('#c99983', 0.3, 0.22));
        ringOne.rotation.set(0.75, -0.28, 0.18);
        group.add(ringOne);
        const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.055, 16, 80), material('#d9c6a9', 0.33, 0.18));
        ringTwo.rotation.set(-0.32, 0.5, -0.58);
        ringTwo.position.set(0.42, -0.25, 0.2);
        group.add(ringTwo);
        const tinyFlower = makeFlower(0.72);
        tinyFlower.position.set(-1.7, -0.55, 0.1);
        group.add(tinyFlower);
        addStem(group, 1.65, -0.2, 1.5, 0.47, 0.14);
      } else if (index === 2) {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.88, 0.17, 48), material('#e0d4c2'));
        column.position.y = -0.95;
        group.add(column);
        const cakeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.59, 0.63, 0.63, 36), material('#f7f1e5', 0.53));
        cakeBase.position.y = -0.54;
        group.add(cakeBase);
        const cakeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.44, 0.43, 36), material('#fff9ee', 0.53));
        cakeTop.position.y = -0.02;
        group.add(cakeTop);
        for (let i = 0; i < 5; i += 1) {
          const bloom = makeFlower(0.31 + (i % 2) * 0.08);
          bloom.position.set((i - 2) * 0.31, 0.33 + (i % 2) * 0.13, 0.1);
          group.add(bloom);
        }
        addStem(group, -1.8, 0, 1.45, 0.48, -0.12);
        addStem(group, 1.75, 0.12, 1.63, 0.55, 0.18);
      } else {
        const sun = new THREE.Mesh(new THREE.SphereGeometry(1.18, 32, 24), material('#dfb09b', 0.76));
        sun.scale.set(1.18, 1.18, 0.12);
        sun.position.set(0, 0.45, -0.6);
        group.add(sun);
        for (let i = 0; i < 15; i += 1) {
          const a = (i / 15) * Math.PI * 2;
          const bloom = makeFlower(0.38 + (i % 3) * 0.09);
          bloom.position.set(Math.cos(a) * (1.3 + (i % 2) * 0.55), Math.sin(a) * (1.1 + (i % 3) * 0.25), 0.12);
          group.add(bloom);
        }
        addArch(group);
      }

      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.95, 0.15, 64), material('#ded8ca'));
      plinth.position.set(0, -1.68, -0.1);
      group.add(plinth);
      const groundRing = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.025, 8, 80), material('#b9b49f'));
      groundRing.rotation.x = Math.PI / 2;
      groundRing.position.y = -1.58;
      group.add(groundRing);
    });

    const particleCount = window.matchMedia('(max-width: 640px)').matches ? 28 : 110;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 10;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 7;
      particlePositions[i * 3 + 2] = -Math.random() * 34;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: '#c88e78', size: 0.045, transparent: true, opacity: 0.64, sizeAttenuation: true }));
    scene.add(particles);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let targetProgress = 0;
    let currentProgress = 0;
    let scrollFrame = 0;
    let renderRequest = 0;
    let isVisible = false;
    let lastRenderedAt = 0;
    const startedAt = performance.now();
    let previousFrameAt = startedAt;
    let frameInterval = window.innerWidth <= 640 ? 1000 / 30 : 1000 / 45;

    function scheduleRender() {
      if (!renderRequest) renderRequest = window.requestAnimationFrame(render);
    }

    function resize() {
      if (!canvas || !renderer) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;
      frameInterval = width <= 640 ? 1000 / 30 : 1000 / 45;
      const pixelRatio = Math.min(window.devicePixelRatio, width <= 640 ? 1.2 : 1.5);
      if (renderer.getPixelRatio() !== pixelRatio) renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const horizontalFov = THREE.MathUtils.degToRad(68);
      const verticalFov = 2 * Math.atan(Math.tan(horizontalFov / 2) / camera.aspect);
      camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(verticalFov), 38, 84);
      camera.updateProjectionMatrix();
    }

    function measureScroll() {
      scrollFrame = 0;
      if (reducedMotion) return;
      const rect = worldSection.getBoundingClientRect();
      const distance = Math.max(1, worldSection.offsetHeight - window.innerHeight);
      targetProgress = THREE.MathUtils.clamp(-rect.top / distance, 0, 1);
      if (progressBar) progressBar.style.transform = `scaleY(${Math.max(0.04, targetProgress)})`;
    }

    function requestScrollMeasure() {
      if (reducedMotion) return;
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(measureScroll);
      scheduleRender();
    }

    function render() {
      renderRequest = 0;
      if (!isVisible || document.hidden) return;
      const now = performance.now();
      if (!reducedMotion && now - lastRenderedAt < frameInterval) {
        scheduleRender();
        return;
      }
      lastRenderedAt = now;
      const delta = Math.min((now - previousFrameAt) / 1000, 0.05);
      const elapsed = (now - startedAt) / 1000;
      previousFrameAt = now;
      currentProgress = THREE.MathUtils.damp(currentProgress, targetProgress, reducedMotion ? 0 : 5.5, delta);
      const travel = currentProgress * (chapterZ.length - 1);
      const sectionIndex = Math.min(Math.floor(travel), chapterZ.length - 1);
      const between = travel - sectionIndex;
      const next = Math.min(sectionIndex + 1, chapterZ.length - 1);
      const cameraZ = THREE.MathUtils.lerp(5.4 + chapterZ[sectionIndex], 5.4 + chapterZ[next], between);
      camera.position.z = cameraZ;
      camera.position.x = Math.sin(currentProgress * Math.PI * 2) * (window.innerWidth < 640 ? 0.28 : 0.55);
      camera.position.y = 0.28 + Math.sin(currentProgress * Math.PI * 4) * 0.12;
      camera.rotation.z = Math.sin(currentProgress * Math.PI * 2) * 0.016;
      if (reducedMotion) {
        camera.position.x = 0;
        camera.position.y = 0.28;
        camera.rotation.z = 0;
      }
      camera.lookAt(camera.position.x * 0.3, 0, cameraZ - 5.2);
      chapters.forEach((chapter, index) => {
        chapter.rotation.y = reducedMotion ? 0 : Math.sin(elapsed * 0.32 + index * 1.5) * 0.045;
        chapter.position.x = reducedMotion ? 0 : Math.sin(elapsed * 0.25 + index) * 0.035;
      });
      particles.rotation.y = reducedMotion ? 0 : elapsed * 0.008;
      renderer.render(scene, camera);
      if (!reducedMotion) scheduleRender();
    }

    new ResizeObserver(() => { resize(); scheduleRender(); }).observe(canvas);
    new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) scheduleRender();
    }).observe(worldSection);
    window.addEventListener('scroll', requestScrollMeasure, { passive: true });
    window.addEventListener('resize', () => { resize(); scheduleRender(); }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && isVisible) scheduleRender(); });
    resize();
    measureScroll();
    scheduleRender();
  } catch (error) {
    console.warn('El jardín 3D no pudo iniciarse en este dispositivo.', error);
    canvas.classList.add('world-fallback');
  }
}
