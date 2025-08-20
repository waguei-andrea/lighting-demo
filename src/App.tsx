import { useEffect, useRef } from "react";
import * as THREE from "three";
// examples path needs explicit .js extension
// types shim provided in src/types/three-extras.d.ts
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const initW = mount.clientWidth || window.innerWidth;
    const initH = mount.clientHeight || window.innerHeight;
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // --- Scene / Camera / Controls ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);

    const camera = new THREE.PerspectiveCamera(50, initW / initH, 0.1, 100);
    camera.position.set(5, 4, 6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- Room constants (meters) ---
    const ROOM_W = 8;
    const ROOM_D = 8;
    const ROOM_H = 3;

    // Floor (receives shadows)
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_W, ROOM_D),
      new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.9,
        metalness: 0.0
      })
    );
    floor.rotation.x = -Math.PI / 2;
    (floor as THREE.Mesh).receiveShadow = true;
    scene.add(floor);

    // Low boundary walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const t = 0.02, h = 0.4;
    const walls = new THREE.Group();
    const north = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, h, t), wallMat);
    north.position.set(0, h / 2, -ROOM_D / 2);
    const south = new THREE.Mesh(new THREE.BoxGeometry(ROOM_W, h, t), wallMat);
    south.position.set(0, h / 2, ROOM_D / 2);
    const east  = new THREE.Mesh(new THREE.BoxGeometry(t, h, ROOM_D), wallMat);
    east.position.set(ROOM_W / 2, h / 2, 0);
    const west  = new THREE.Mesh(new THREE.BoxGeometry(t, h, ROOM_D), wallMat);
    west.position.set(-ROOM_W / 2, h / 2, 0);
    walls.add(north, south, east, west);
    scene.add(walls);

    // Boxes
    const floorBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.0, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.6 })
    );
    floorBox.position.set(-1.5, 0.5, -0.5);
    floorBox.castShadow = true;
    floorBox.receiveShadow = true;
    scene.add(floorBox);

    const ceilBox = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
    );
    ceilBox.position.set(1.2, ROOM_H - 0.25, 0.2); // close to ceiling
    ceilBox.castShadow = true;
    ceilBox.receiveShadow = true;
    scene.add(ceilBox);

    // Spotlight (casts shadows)
    const spot = new THREE.SpotLight(0xffdd88, 2.0, 0, Math.PI / 5, 0.25, 1.2);
    spot.position.set(0, ROOM_H - 0.05, 0);
    spot.target.position.set(0, 0, 0);
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    spot.shadow.bias = -0.00015;
    scene.add(spot);
    scene.add(spot.target);

    // Lamp head marker
    const lampHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xfff1b8,
        emissive: 0x3b2f00,
        emissiveIntensity: 0.6,
        roughness: 0.3
      })
    );
    lampHead.position.copy(spot.position);
    scene.add(lampHead);

    // Ambient
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    // Grid
    const grid = new THREE.GridHelper(ROOM_W, ROOM_W, 0x334155, 0x1f2937);
    grid.position.y = 0.001;
    scene.add(grid);

    // --- Animation ---
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      floorBox.rotation.y = 0.2 * Math.sin(t * 0.5);
      ceilBox.rotation.y = -0.25 * Math.sin(t * 0.6);

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    // --- Resize ---
    const onResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.clear();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}
    >
      <div style={{ position: "absolute", left: 12, bottom: 12, color: "#cbd5e1", font: "12px/1.4 system-ui", opacity: 0.9 }}>
        Drag to orbit • Scroll to zoom
      </div>
    </div>
  );
}
