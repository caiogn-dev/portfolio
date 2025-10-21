"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import { create } from "zustand";
import CarModel from "./CarModel";
import { useWebSocket } from "@/lib/useWebSocket";

type CarState = { speedKmh: number; setSpeed: (v: number) => void };
export const useCarStore = create<CarState>((set) => ({
  speedKmh: 0,
  setSpeed: (v) => set({ speedKmh: v }),
}));

// damping helper
function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));
}

// --- NetworkCar (outros jogadores)
export type NetworkCarProps = {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  id: string;
};

export function NetworkCar({ position, rotation }: NetworkCarProps) {
  const meshRef = useRef<any>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.lerp(position, 1 - Math.exp(-12 * delta));
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, rotation.x, 1 - Math.exp(-12 * delta));
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, rotation.y, 1 - Math.exp(-12 * delta));
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, rotation.z, 1 - Math.exp(-12 * delta));
  });

  return (
    <group ref={meshRef}>
      <CarModel scale={0.5} rotation={[0, Math.PI, 0]} position={[0, -0.3, 0]} />
    </group>
  );
}

// --- Carro local
export default function Car({ isLocal = true }: { isLocal?: boolean }) {
  const ref = useRef<any>(null);
  const [, getKeys] = useKeyboardControls();
  const [dir] = useState(() => new THREE.Vector3());
  const setSpeed = useCarStore((s) => s.setSpeed);
  const { sendPlayerState, playerId } = useWebSocket();

  const steerRef = useRef(0);
  const throttleRef = useRef(0);
  const lastHudRef = useRef(0);
  const lookRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const body = ref.current;
    if (!body || !isLocal) return;

    const { forward, backward, left, right, boost } = getKeys();
    const steerTarget = left ? 1 : right ? -1 : 0;
    const throttleTarget = forward ? 1 : backward ? -1 : 0;

    steerRef.current = damp(steerRef.current, steerTarget, 12, delta);
    throttleRef.current = damp(throttleRef.current, throttleTarget, 14, delta);

    const accelFwd = boost ? 26 : 12;
    const accelRev = 12;
    const brake = 30;
    const maxFwdK = boost ? 75 : 50;
    const maxRevK = 28;
    const steerBase = 2.0;
    const idleFriction = 0.986;

    const r = body.rotation();
    const quat = new THREE.Quaternion(r.x, r.y, r.z, r.w).normalize();
    dir.set(0, 0, -1).applyQuaternion(quat).normalize();

    const lv = body.linvel();
    const vel = new THREE.Vector3(lv.x, lv.y, lv.z);
    const speedMs = vel.length();
    const vForward = vel.dot(dir);

    const wantFwd = throttleRef.current > 0.15;
    const wantRev = throttleRef.current < -0.15;

    if (wantFwd) {
      if (vForward < 0) body.applyImpulse({ x: dir.x * brake * delta, y: 0, z: dir.z * brake * delta }, true);
      else body.applyImpulse({ x: dir.x * accelFwd * delta, y: 0, z: dir.z * accelFwd * delta }, true);
    } else if (wantRev) {
      if (vForward > 0) body.applyImpulse({ x: -dir.x * brake * delta, y: 0, z: -dir.z * brake * delta }, true);
      else body.applyImpulse({ x: -dir.x * accelRev * delta, y: 0, z: -dir.z * accelRev * delta }, true);
    } else {
      body.setLinvel({ x: vel.x * idleFriction, y: vel.y, z: vel.z * idleFriction }, true);
    }

    // Limites de velocidade
    const maxFwd = maxFwdK / 3.6;
    const maxRev = maxRevK / 3.6;
    if (vForward > maxFwd) {
      const excess = vForward - maxFwd;
      const corr = dir.clone().multiplyScalar(excess);
      const newVel = vel.clone().sub(corr);
      body.setLinvel({ x: newVel.x, y: newVel.y, z: newVel.z }, true);
    } else if (vForward < -maxRev) {
      const excess = Math.abs(vForward) - maxRev;
      const corr = dir.clone().multiplyScalar(-excess);
      const newVel = vel.clone().sub(corr);
      body.setLinvel({ x: newVel.x, y: newVel.y, z: newVel.z }, true);
    }

    const movingSign = vForward >= 0 ? 1 : -1;
    const steerScale = THREE.MathUtils.clamp(Math.abs(vForward) / 8, 0.3, 1.2);
    const steerNow = steerRef.current * steerBase * steerScale * movingSign;
    if (Math.abs(steerNow) > 0.001) body.applyTorqueImpulse({ x: 0, y: steerNow * delta, z: 0 }, true);

    const av = body.angvel();
    body.setAngvel({ x: av.x * 0.92, y: av.y * 0.98, z: av.z * 0.92 }, true);

    const tr = body.translation();
    if (tr.y < -5) {
      body.setTranslation({ x: 0, y: 0.6, z: 0 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    const now = performance.now();
    if (now - lastHudRef.current > 80) {
      lastHudRef.current = now;
      setSpeed(speedMs * 3.6);

      // Send player state to WebSocket server
      const rotation = body.rotation();
      console.log("Sending player state:", { x: tr.x, y: tr.y, z: tr.z, rx: rotation.x, ry: rotation.y, rz: rotation.z, v: speedMs });
      sendPlayerState(tr.x, tr.y, tr.z, rotation.x, rotation.y, rotation.z, speedMs);
    }

    // Camera follow
    const target = new THREE.Vector3(tr.x, tr.y, tr.z);
    const behind = dir.clone().multiplyScalar(-7);
    const desired = target.clone().add(behind).add(new THREE.Vector3(0, 3, 0));
    const f = 1 - Math.exp(-8 * delta);
    state.camera.position.lerp(desired, f);
    lookRef.current.lerp(target, f);
    state.camera.lookAt(lookRef.current);
  });

  if (!isLocal) return null;

  return (
    <RigidBody
      ref={ref}
      mass={1.2}
      linearDamping={0.45}
      angularDamping={0.9}
      position={[0, 0.6, 0]}
      colliders="cuboid"
      restitution={0}
      friction={1}
    >
      <pointLight position={[0, -0.1, 0]} intensity={3} distance={6} color={"#00e5ff"} />
      <CarModel scale={0.5} position={[0, -0.3, 0]} rotation={[0, Math.PI, 0]} />
    </RigidBody>
  );
}
