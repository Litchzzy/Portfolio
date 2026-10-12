import * as THREE from 'three';

export function createRocket() {
  const rocket = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  rocket.add(body);

  const noseGeo = new THREE.ConeGeometry(0.15, 0.4, 16);
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.position.y = 0.7;
  rocket.add(nose);

  rocket.position.set(1.2, -2, 0); // off to the side, below view (launch pad position)

  return rocket;
}