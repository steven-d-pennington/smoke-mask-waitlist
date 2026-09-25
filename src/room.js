import * as THREE from 'three';
import { works, station, clampStop } from './catalog.js';

// One renderer, a bounded camera route and on-demand frames. No autoplay loop.
export async function createRoom(host, initialIndex = 0, onFailure = () => {}, onFrame = () => {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ddd8c9');
  scene.fog = new THREE.Fog('#ddd8c9', 17, 55);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 110);
  const ambient = new THREE.HemisphereLight('#fffcf0', '#66604e', 2.3);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff4d9', 2.1);
  sun.position.set(-4, 9, 4);
  scene.add(sun);
  const plaster = new THREE.MeshStandardMaterial({ color: '#d7d0ba', roughness: 1 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#ac9e81', roughness: .95 });
  const brass = new THREE.MeshStandardMaterial({ color: '#74603d', metalness: .55, roughness: .45 });
  const timber = new THREE.MeshStandardMaterial({ color: '#3b352b', roughness: .7 });
  const mat = new THREE.MeshStandardMaterial({ color: '#eee8d6', roughness: 1 });
  const length = works.length * 9 + 15;
  const meshes = [];
  function box(width, height, depth, material, x, y, z, group = scene) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    group.add(mesh); meshes.push(mesh);
    return mesh;
  }
  box(16, .15, length, floorMaterial, 0, -.08, -length / 2 + 8);
  box(.2, 6, length, plaster, -7, 3, -length / 2 + 8);
  box(.2, 6, length, plaster, 7, 3, -length / 2 + 8);
  const lineMaterial = new THREE.MeshBasicMaterial({ color: '#968a71' });
  for (let x = -7; x <= 7; x += 1.15) box(.008, .006, length, lineMaterial, x, .002, -length / 2 + 8);
  for (let z = 8; z > -length + 8; z -= 4) box(14, .006, .008, lineMaterial, 0, .003, z);
  const rail = new THREE.MeshStandardMaterial({ color: '#c2b69a', roughness: .8 });
  // The final stop is a studio reception space, not another artwork.
  const reception = new THREE.MeshStandardMaterial({ color: '#263e33', roughness: 1 });
  box(13.8, 5.8, .2, reception, 0, 2.9, -works.length * 9 - .7);
  box(6.3, .15, 1.5, timber, 0, .86, -works.length * 9 + 1.4);
  box(.12, .8, 1.2, brass, -2.7, .4, -works.length * 9 + 1.4);
  box(.12, .8, 1.2, brass, 2.7, .4, -works.length * 9 + 1.4);
  const loader = new THREE.TextureLoader();
  let disposed = false;
  let frame = 0;
  let enabled = true;
  let index = THREE.MathUtils.clamp(initialIndex, 0, works.length);
  let progress = index;
  let destinationProgress = index;
  let lastTime = 0;
  const target = new THREE.Vector3();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function view(stop) {
    const lower = Math.floor(stop), upper = Math.min(works.length, lower + 1);
    const t = stop - lower;
    const smooth = t * t * (3 - 2 * t);
    const routeStation = i => i === works.length ? { x: 0, y: 2.35, z: -i * 9 } : station(i);
    const a = routeStation(lower), b = routeStation(upper);
    const x = THREE.MathUtils.lerp(a.x, b.x, smooth);
    const z = THREE.MathUtils.lerp(a.z, b.z, t);
    const narrow = host.clientWidth < 600;
    // The camera stays in the clear central aisle while looking toward each work.
    return { position: new THREE.Vector3(x * .23, 2.45, z + (narrow ? 10.3 : 6.6)),
      target: new THREE.Vector3(x, 2.25, z) };
  }
  function requestFrame() {
    if (!disposed && enabled && !frame) frame = requestAnimationFrame(render);
  }
  function render(now) {
    frame = 0;
    if (disposed || !enabled) return;
    const dt = Math.min(.05, (now - (lastTime || now - 16)) / 1000);
    lastTime = now;
    progress = reduced.matches ? Math.round(destinationProgress) : THREE.MathUtils.damp(progress, destinationProgress, 14, dt);
    if (Math.abs(progress - destinationProgress) < .0002) progress = destinationProgress;
    const current = view(progress);
    camera.position.copy(current.position); target.copy(current.target);
    camera.lookAt(target);
    renderer.render(scene, camera);
    onFrame(progress, camera.position.toArray());
    if (Math.abs(progress - destinationProgress) > .00001) requestFrame();
  }
  const texturePromises = [];
  works.forEach((work, i) => {
    const s = station(i);
    const group = new THREE.Group();
    group.position.set(s.x, s.y, s.z);
    group.userData.workIndex = i;
    scene.add(group);
    const imageHeight = work.ratio > 1 ? 2.15 : 2.55;
    const imageWidth = imageHeight * work.ratio;
    const outerWidth = imageWidth + .58;
    const outerHeight = imageHeight + .58;
    // Sculptural freestanding walls keep the path open as the collection expands.
    box(outerWidth + .48, 4.65, .19, plaster, 0, -.025, -.21, group);
    box(outerWidth + .52, .09, .65, timber, s.x, .065, s.z - .16);
    box(outerWidth, outerHeight, .11, timber, 0, 0, -.04, group);
    box(outerWidth - .065, outerHeight - .065, .12, brass, 0, 0, -.025, group);
    box(outerWidth - .1, outerHeight - .1, .125, mat, 0, 0, 0, group);
    if (work.src) {
      const promise = loader.loadAsync(new URL(`../${work.src}`, import.meta.url).href).then(texture => {
        if (disposed) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
        const rotated = work.rotation === 90;
        const geometry = new THREE.PlaneGeometry(rotated ? imageHeight : imageWidth, rotated ? imageWidth : imageHeight);
        const image = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
        if (rotated) image.rotation.z = -Math.PI / 2;
        image.position.z = .077;
        group.add(image); meshes.push(image);
        requestFrame();
      });
      texturePromises.push(promise);
    } else {
      // Deliberately plain architectural placeholders, not invented artwork.
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = Math.round(640 / work.ratio);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#e9e5da'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#b9b5a8'; ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      ctx.beginPath(); ctx.moveTo(cx - 22, cy - 34); ctx.lineTo(cx + 22, cy - 34);
      ctx.moveTo(cx, cy - 56); ctx.lineTo(cx, cy - 12); ctx.stroke();
      ctx.fillStyle = '#615f55'; ctx.textAlign = 'center'; ctx.font = '18px sans-serif';
      ctx.fillText('FUTURE WORK', cx, cy + 30); ctx.font = '13px sans-serif';
      ctx.fillText('LAYOUT PLACEHOLDER', cx, cy + 60);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
      const placeholder = new THREE.Mesh(new THREE.PlaneGeometry(imageWidth, imageHeight), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
      placeholder.position.z = .077; group.add(placeholder); meshes.push(placeholder);
    }
    // Wall labels, overhead rails and soft light establish a gallery scale.
    box(.55, .18, .015, mat, outerWidth / 2 - .28, -outerHeight / 2 - .24, -.09, group);
    box(12, .08, .14, rail, 0, 5.1, s.z + 1.3);
    box(2, .025, .13, new THREE.MeshBasicMaterial({ color: '#fff6da' }), s.x, 5.04, s.z + 1.3);
  });
  const initial = view(index);
  camera.position.copy(initial.position); target.copy(initial.target);
  function resize() {
    if (disposed || !host.clientWidth || !host.clientHeight) return;
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    const current = view(progress);
    camera.position.copy(current.position); target.copy(current.target);
    requestFrame();
  }
  const observer = new ResizeObserver(resize); observer.observe(host);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); onFailure();
  });
  resize();
  try { await Promise.all(texturePromises); }
  catch (error) { dispose(); throw error; }
  function dispose() {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect();
    for (const mesh of meshes) {
      mesh.geometry.dispose(); mesh.material.map?.dispose(); mesh.material.dispose();
    }
    renderer.dispose(); renderer.domElement.remove();
  }
  return {
    goTo(next) {
      destinationProgress = THREE.MathUtils.clamp(Number(next) || 0, 0, works.length);
      requestFrame();
    },
    pick(clientX, clientY) {
      const rect = host.getBoundingClientRect();
      const pointer = new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
      const ray = new THREE.Raycaster(); ray.setFromCamera(pointer, camera);
      for (const hit of ray.intersectObjects(scene.children, true)) {
        let node = hit.object;
        while (node) {
          if (node.userData.workIndex !== undefined) return node.userData.workIndex;
          node = node.parent;
        }
        // An opaque room surface in front blocks selecting a hidden work.
        return null;
      }
      return null;
    },
    setEnabled(value) { enabled = value; if (!value) { cancelAnimationFrame(frame); frame = 0; } else requestFrame(); },
    dispose,
  };
}
