"use client";

import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { RapierRigidBody, RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useWebSocket } from "@/lib/useWebSocket";
import CarModel from "./CarModel";
import { useCarSounds } from "@/lib/useSound";
import { useCarStore } from "@/store/useCar";

type CarProps = {
  initialPosition: [number, number, number];
  initialRotation: [number, number, number];
};

export function Car({ initialPosition, initialRotation }: CarProps) {
  const carRef = useRef<RapierRigidBody>(null);
  const { sendPlayerState } = useWebSocket();
  const [sub, getKeys] = useKeyboardControls();
  const { camera } = useThree();
  const { startEngine, updateEngineSound, playCollision, playHorn } = useCarSounds();
  const [headlightsOn, setHeadlightsOn] = useState(false);

  const setSpeed = useCarStore((state) => state.setSpeed);

  useEffect(() => {
    startEngine();
  }, [startEngine]);
  
  useEffect(() => {
    const unsubHorn = sub(
      (state) => state.horn,
      (pressed) => pressed && playHorn()
    );

    const unsubHeadlights = sub(
      (state) => state.headlights,
      (pressed) => pressed && setHeadlightsOn((prev) => !prev)
    );

    return () => {
      unsubHorn();
      unsubHeadlights();
    };
  }, [sub, playHorn]);


  useFrame((state, delta) => {
    if (!carRef.current) return;

    const { forward, backward, left, right, boost } = getKeys();

    const impulse = new THREE.Vector3();
    const torque = new THREE.Vector3();
    const impulseStrength = (boost ? 15 : 8) * delta;
    const torqueStrength = 4 * delta;

    if (forward) impulse.z -= impulseStrength;
    if (backward) impulse.z += impulseStrength;
    if (left) torque.y += torqueStrength;
    if (right) torque.y -= torqueStrength;

    const rapierRotation = carRef.current.rotation();
    const threeQuaternion = new THREE.Quaternion(
        rapierRotation.x,
        rapierRotation.y,
        rapierRotation.z,
        rapierRotation.w
    );
    impulse.applyQuaternion(threeQuaternion);

    carRef.current.applyImpulse(impulse, true);
    carRef.current.applyTorqueImpulse(torque, true);

    // CORREÇÃO DO ERRO 'fov'
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = boost ? 65 : 50;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 5);
      camera.updateProjectionMatrix();
    }

    const bodyPosition = carRef.current.translation();
    
    if (bodyPosition.y < -5) {
      carRef.current.setTranslation({ x: initialPosition[0], y: initialPosition[1], z: initialPosition[2] }, true);
      carRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      carRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
    
    const cameraPosition = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    
    const targetCameraPosition = new THREE.Vector3(bodyPosition.x, bodyPosition.y + 5, bodyPosition.z + 8);
    cameraPosition.lerp(targetCameraPosition, delta * 2.0);

    camera.position.copy(cameraPosition);
    camera.lookAt(bodyPosition.x, bodyPosition.y, bodyPosition.z);

    const linvel = carRef.current.linvel();
    const speedKmh = new THREE.Vector3(linvel.x, linvel.y, linvel.z).length() * 3.6;
    
    setSpeed(speedKmh);
    updateEngineSound(speedKmh);
    
    const pos = carRef.current.translation();
    const rot = carRef.current.rotation();
    const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w));
    sendPlayerState(pos.x, pos.y, pos.z, euler.x, euler.y, euler.z);
  });

  return (
    <RigidBody
      ref={carRef}
      colliders="cuboid"
      position={initialPosition}
      rotation={initialRotation}
      canSleep={false}
      restitution={0.8}
      friction={0.8}
      linearDamping={0.5}
      angularDamping={0.5}
      onCollisionEnter={playCollision}
    >
      <CarModel headlightsOn={headlightsOn} scale={0.5} position={[0, -0.3, 0]} rotation={[0, Math.PI, 0]} />
    </RigidBody>
  );
}