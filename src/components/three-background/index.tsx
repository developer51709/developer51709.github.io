import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Three.js animated background — a slowly drifting field of glowing particles
 * with a subtle connecting "constellation" feel. Fixed position behind all
 * content, respects the active daisyUI theme via CSS variables, and pauses
 * when the tab is hidden to save battery.
 */
const ThreeBackground = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // Particle field
    const PARTICLE_COUNT = 350;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities: number[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      velocities.push(
        (Math.random() - 0.5) * 0.012,
        (Math.random() - 0.5) * 0.012,
        (Math.random() - 0.5) * 0.008,
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );

    const material = new THREE.PointsMaterial({
      size: 0.18,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Theme-aware color: read the CSS --color-primary variable from :root.
    const applyThemeColor = () => {
      const styles = getComputedStyle(document.documentElement);
      const primary =
        styles.getPropertyValue('--color-primary').trim() || '#8888ff';
      try {
        material.color.set(primary);
      } catch {
        material.color.set('#8888ff');
      }
    };
    applyThemeColor();

    // Re-read the theme color whenever the data-theme attribute changes.
    const observer = new MutationObserver(applyThemeColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Subtle pointer parallax
    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (e: PointerEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let running = true;

    const onVisibility = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(animate);
    };
    document.addEventListener('visibilitychange', onVisibility);

    const animate = () => {
      if (!running) return;

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3] += velocities[i * 3];
        pos[i * 3 + 1] += velocities[i * 3 + 1];
        pos[i * 3 + 2] += velocities[i * 3 + 2];

        // Wrap around edges
        if (pos[i * 3] > 30) pos[i * 3] = -30;
        if (pos[i * 3] < -30) pos[i * 3] = 30;
        if (pos[i * 3 + 1] > 20) pos[i * 3 + 1] = -20;
        if (pos[i * 3 + 1] < -20) pos[i * 3 + 1] = 20;
        if (pos[i * 3 + 2] > 20) pos[i * 3 + 2] = -20;
        if (pos[i * 3 + 2] < -20) pos[i * 3 + 2] = 20;
      }
      geometry.attributes.position.needsUpdate = true;

      camera.position.x += (targetX * 2 - camera.position.x) * 0.02;
      camera.position.y += (-targetY * 2 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      if (!prefersReducedMotion) {
        raf = requestAnimationFrame(animate);
      }
    };

    if (!prefersReducedMotion) {
      raf = requestAnimationFrame(animate);
    } else {
      renderer.render(scene, camera);
    }

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none opacity-70"
    />
  );
};

export default ThreeBackground;
