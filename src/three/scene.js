import * as THREE from 'three';
import { createRocket } from './objects/rocket.js';

const isMobile = window.innerWidth < 768;

export const canvas = document.querySelector('#webgl');
export const scene = new THREE.Scene();

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 3;
scene.add(camera);

export const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

const geometry = new THREE.TorusGeometry(1.3, 0.4, isMobile ? 8 : 16, isMobile ? 40 : 100);
export const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
export const torus = new THREE.Mesh(geometry, material);

export const rocket = createRocket();

const light = new THREE.PointLight(0xffffff, 100);
light.position.set(5, 5, 5);
scene.add(light);

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);

export function startRenderLoop() {
  function tick() {
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}