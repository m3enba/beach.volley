import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { SETTINGS } from '../../types';

export class Court {
  constructor(scene: THREE.Scene, world: CANNON.World, groundMaterial: CANNON.Material) {
    // Ground
    const groundGeom = new THREE.PlaneGeometry(SETTINGS.courtWidth * 10, SETTINGS.courtLength * 10);
    const sandMat = new THREE.MeshStandardMaterial({ 
      color: 0xedc9af,
      roughness: 0.9,
      metalness: 0.0
    });
    const groundMesh = new THREE.Mesh(groundGeom, sandMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Ocean
    const oceanGeom = new THREE.PlaneGeometry(1000, 1000);
    const oceanMat = new THREE.MeshStandardMaterial({ color: 0x0077be, roughness: 0.1, metalness: 0.5 });
    const oceanMesh = new THREE.Mesh(oceanGeom, oceanMat);
    oceanMesh.rotation.x = -Math.PI / 2;
    oceanMesh.position.y = -0.5;
    scene.add(oceanMesh);

    // Palm Trees (Simple Low Poly)
    const createPalm = (x: number, z: number) => {
      const palm = new THREE.Group();
      const trunkGeom = new THREE.CylinderGeometry(0.2, 0.4, 6, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 3;
      palm.add(trunk);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
      for (let i = 0; i < 5; i++) {
        const leafGeom = new THREE.BoxGeometry(3, 0.1, 1);
        const leaf = new THREE.Mesh(leafGeom, leafMat);
        leaf.position.y = 6;
        leaf.rotation.y = (i / 5) * Math.PI * 2;
        leaf.rotation.z = 0.5;
        palm.add(leaf);
      }
      palm.position.set(x, 0, z);
      scene.add(palm);
    };

    createPalm(-15, -10);
    createPalm(15, -15);
    createPalm(-18, 12);
    createPalm(20, 8);

    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
      material: groundMaterial
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Boundary Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const lines = new THREE.Group();
    
    // Outer rectangle
    const rectGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-SETTINGS.courtWidth/2, 0.01, -SETTINGS.courtLength/2),
      new THREE.Vector3(SETTINGS.courtWidth/2, 0.01, -SETTINGS.courtLength/2),
      new THREE.Vector3(SETTINGS.courtWidth/2, 0.01, SETTINGS.courtLength/2),
      new THREE.Vector3(-SETTINGS.courtWidth/2, 0.01, SETTINGS.courtLength/2),
      new THREE.Vector3(-SETTINGS.courtWidth/2, 0.01, -SETTINGS.courtLength/2),
    ]);
    lines.add(new THREE.Line(rectGeom, lineMat));

    // Center line
    const centerGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-SETTINGS.courtWidth/2, 0.01, 0),
      new THREE.Vector3(SETTINGS.courtWidth/2, 0.01, 0),
    ]);
    lines.add(new THREE.Line(centerGeom, lineMat));
    scene.add(lines);

    // Net
    const netGeom = new THREE.BoxGeometry(SETTINGS.courtWidth + 1, 1, 0.05);
    const netMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5,
      wireframe: true 
    });
    const netMesh = new THREE.Mesh(netGeom, netMat);
    netMesh.position.y = SETTINGS.netHeight - 0.5;
    scene.add(netMesh);

    // Net Posts
    const postGeom = new THREE.CylinderGeometry(0.1, 0.1, 3);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const post1 = new THREE.Mesh(postGeom, postMat);
    post1.position.set(-SETTINGS.courtWidth/2 - 0.5, 1.5, 0);
    scene.add(post1);
    const post2 = new THREE.Mesh(postGeom, postMat);
    post2.position.set(SETTINGS.courtWidth/2 + 0.5, 1.5, 0);
    scene.add(post2);

    // Net Physics
    const netShape = new CANNON.Box(new CANNON.Vec3((SETTINGS.courtWidth + 1) / 2, 0.5, 0.05));
    const netBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: netShape,
      position: new CANNON.Vec3(0, SETTINGS.netHeight - 0.5, 0)
    });
    world.addBody(netBody);
  }
}
