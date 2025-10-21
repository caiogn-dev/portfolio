"use client";

import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import type { ThreeElements } from "@react-three/fiber";

type PlayerState = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  v?: number;
  updatedAt: number;
};

type OtherPlayerCarProps = ThreeElements["group"] & {
  player: PlayerState;
};

type GLTFResult = GLTF & { scene: THREE.Group };

export default function OtherPlayerCar({ player, ...props }: OtherPlayerCarProps) {
  const { scene } = useGLTF("/models/car_compressed.glb") as GLTFResult;
  const ref = useRef<any>(null);

  // Update position and rotation based on player state
  // This will run every frame, but only update if player state changes
  // For smoother movement, you might want to interpolate between states
  if (ref.current) {
    ref.current.setTranslation(new THREE.Vector3(player.x, player.y, player.z), true);
    ref.current.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(player.rx, player.ry, player.rz)), true);
  }

  return (
    <RigidBody
      ref={ref}
      colliders="cuboid"
      type="kinematicPosition"
      position={[player.x, player.y, player.z]}
      rotation={[player.rx, player.ry, player.rz]}
      {...props}
    >
      <primitive object={scene.clone()} scale={0.5} rotation={[0, Math.PI, 0]} />
    </RigidBody>
  );
}

useGLTF.preload("/models/car_compressed.glb");
