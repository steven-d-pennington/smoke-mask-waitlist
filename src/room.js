import * as THREE from 'three';
import { works, station, clampStop } from './catalog.js';

// One renderer, a bounded camera route and on-demand frames. No autoplay loop.
export async function createRoom(host, initialIndex = 0, onFailure = () => {}) {
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
  const loader = new THREE.TextureLoader();
  let disposed = false;
  let frame = 0;
  let enabled = true;
  let index = clampStop(initialIndex);
  let animation = null;
  const target = new THREE.Vector3();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function view(stop) {
    const s = station(stop);
    const narrow = host.clientWidth < 600;
    return { position: new THREE.Vector3(s.x + (narrow ? .15 : 1.0), 2.55, s.z + (narrow ? 7.8 : 6.4)),
      target: new THREE.Vector3(s.x, 2.25, s.z) };
  }
  function requestFrame() {
    if (!disposed && enabled && !frame) frame = requestAnimationFrame(render);
  }
  function render(now) {
    frame = 0;
    if (disposed || !enabled) return;
    if (animation) {
      const p = Math.min(1, (now - animation.start) / 1250);
      const ease = p * p * (3 - 2 * p);
      camera.position.lerpVectors(animation.from, animation.to.position, ease);
      // A small rise makes travel read as a walkthrough, with no perpetual motion.
      camera.position.y += Math.sin(p * Math.PI) * .3;
      target.lerpVectors(animation.lookFrom, animation.to.target, ease);
      if (p === 1) animation = null;
    }
    camera.lookAt(target);
    renderer.render(scene, camera);
    if (animation) requestFrame();
  }
  const texturePromises = [];
  works.forEach((work, i) => {
    const s = station(i);
    const group = new THREE.Group();
    group.position.set(s.x, s.y, s.z);
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
    const current = view(index);
    camera.position.copy(current.position); target.copy(current.target); animation = null;
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
    goTo(next, instant = false) {
      index = clampStop(next);
      const destination = view(index);
      if (instant || reduced.matches) { camera.position.copy(destination.position); target.copy(destination.target); animation = null; }
      else animation = { from: camera.position.clone(), lookFrom: target.clone(), to: destination, start: performance.now() };
      requestFrame();
    },
    setEnabled(value) { enabled = value; if (!value) { cancelAnimationFrame(frame); frame = 0; } else requestFrame(); },
    dispose,
  };
}
