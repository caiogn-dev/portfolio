import { useGLTF } from "@react-three/drei";
import { RigidBody, RapierRigidBody, vec3 } from "@react-three/rapier";
import React, { useRef, useEffect } from "react";
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
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (rigidBodyRef.current) {
      const { x, y, z, rx, ry, rz } = player;
      console.log("Updating other player car:", player);
      const body = rigidBodyRef.current;
      body.setNextKinematicTranslation(vec3({ x, y, z }));
      body.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)));
    }
  }, [player]);

  return (
    <RigidBody
      // @ts-ignore
      ref={rigidBodyRef}
      colliders="cuboid"
      // @ts-ignore
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
