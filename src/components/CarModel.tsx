"use client";

import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";
import type * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

// props = tudo que um <group> do R3F aceita + url opcional
type CarModelProps = ThreeElements["group"] & {
  url?: string;
};

type GLTFResult = GLTF & { scene: THREE.Group };

export default function CarModel({ url = "/models/car.glb", ...props }: CarModelProps) {
  const { scene } = useGLTF(url) as GLTFResult;

  return (
    <group {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/car.glb");
