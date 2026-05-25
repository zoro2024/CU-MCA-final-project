// Animated 3D background using three.js — a slowly rotating wireframe
// icosahedron with a particle field. Purely decorative; pointer-events: none.
import * as THREE from "three";

export function mountBackground(target) {
  const el = target || document.getElementById("bg-3d");
  if (!el) return () => {};

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 100);
  camera.position.z = 7;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = "position:fixed;inset:0;width:100%;height:100%;";

  // Glowing wireframe icosahedron
  const geo = new THREE.IcosahedronGeometry(2.6, 1);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x6ee7ff, wireframe: true, transparent: true, opacity: 0.18,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.6, 0),
    new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true, transparent: true, opacity: 0.22 })
  );
  scene.add(inner);

  // Particle field
  const count = 700;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 18;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.025, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // Mouse parallax
  const mouse = { x: 0, y: 0 };
  const onMove = (e) => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 0.6;
  };
  window.addEventListener("mousemove", onMove);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", onResize);

  let raf = 0;
  const clock = new THREE.Clock();
  const animate = () => {
    const t = clock.getElapsedTime();
    mesh.rotation.x = t * 0.12;
    mesh.rotation.y = t * 0.18;
    inner.rotation.x = -t * 0.22;
    inner.rotation.y = t * 0.3;
    points.rotation.y = t * 0.02;
    camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 1.0 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  };
  animate();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
    geo.dispose(); mat.dispose();
    pGeo.dispose(); pMat.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  };
}
