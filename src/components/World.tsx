"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Grid } from "@react-three/drei";

export default function World() {
  const matNeonMagenta = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#151227",
        emissive: new THREE.Color("#ff00cc"),
        emissiveIntensity: 1.35, // ↓ menos estouro
        metalness: 0.1,
        roughness: 0.5,
      }),
    []
  );

  const asphalt = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0b0c15",
        metalness: 0.0,
        roughness: 1.0,
      }),
    []
  );

  return (
    <>
      {/* chão base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <primitive attach="material" object={asphalt} />
      </mesh>

      {/* faixa de estrada escura */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 10]} />
        <meshStandardMaterial color="#090a12" />
      </mesh>

      {/* faixa central neon (magenta) */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 0.18]} />
        <primitive attach="material" object={matNeonMagenta} />
      </mesh>

      {/* grid Tron mais fino e nítido */}
      <Grid
        position={[0, 0.011, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        infiniteGrid
        cellSize={2}
        cellThickness={0.35}   // ↓ mais fino
        sectionSize={20}
        sectionThickness={0.7} // ↓ mais fino
        fadeDistance={70}
        fadeStrength={1}
        cellColor={"#00e5ff"}
        sectionColor={"#00b7ff"}
      />

      {/* colisor do chão */}
      <RigidBody type="fixed">
        <CuboidCollider args={[100, 0.25, 100]} position={[0, -0.125, 0]} />
      </RigidBody>

      {/* underglow suave global */}
      <pointLight position={[0, 2, 0]} intensity={0.3} distance={40} color={"#00e5ff"} />
    </>
  );
}
