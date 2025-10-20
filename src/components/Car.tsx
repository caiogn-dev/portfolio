"use client";

import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import { create } from "zustand";
import CarModel from "./CarModel";
type CarState = { speedKmh: number; setSpeed: (v: number) => void };
export const useCarStore = create<CarState>((set) => ({
  speedKmh: 0,
  setSpeed: (v) => set({ speedKmh: v }),
}));

export default function Car() {
  const ref = useRef<any>(null);
  const [, getKeys] = useKeyboardControls();
  const [dir] = useState(() => new THREE.Vector3());
  const setSpeed = useCarStore((s) => s.setSpeed);

  useFrame((state, delta) => {
    const body = ref.current;
    if (!body) return;

    const { forward, backward, left, right, boost } = getKeys();

    // --- parâmetros arcade estáveis ---
    const accelFwd = boost ? 26 : 12;  // força pra frente
    const accelRev = 12;               // força pra ré
    const brake    = 30;               // força de freio
    const maxFwdK = boost ? 75 : 50;   // km/h
    const maxRevK = 28;                // km/h
    const steerBase = 2.0;             // torque de direção
    const idleFriction = 0.986;
    const angDamping = 0.95;
    // ----------------------------------

    // orientação do carro
    const r = body.rotation();
    const quat = new THREE.Quaternion(r.x, r.y, r.z, r.w).normalize();
    dir.set(0, 0, -1).applyQuaternion(quat).normalize();

    // velocidade atual
    const lv = body.linvel();
    const vel = new THREE.Vector3(lv.x, lv.y, lv.z);
    const speed = vel.length(); // m/s
    const vForward = vel.dot(dir); // componente na frente (+) ou ré (-)

    // lógica de entrada: freia antes de inverter
    if (forward && !backward) {
      // se está indo pra trás, freia até parar; depois acelera
      if (vForward < 0) {
        body.applyImpulse(
          { x: dir.x * brake * delta, y: 0, z: dir.z * brake * delta },
          true
        );
      } else {
        body.applyImpulse(
          { x: dir.x * accelFwd * delta, y: 0, z: dir.z * accelFwd * delta },
          true
        );
      }
    } else if (backward && !forward) {
      // se está indo pra frente, freia até parar; depois ré
      if (vForward > 0) {
        body.applyImpulse(
          { x: -dir.x * brake * delta, y: 0, z: -dir.z * brake * delta },
          true
        );
      } else {
        body.applyImpulse(
          { x: -dir.x * accelRev * delta, y: 0, z: -dir.z * accelRev * delta },
          true
        );
      }
    } else {
      // rolando sem acelerar
      body.setLinvel({ x: vel.x * idleFriction, y: vel.y, z: vel.z * idleFriction }, true);
    }

    // limites de velocidade (separado p/ frente e ré)
    const maxFwd = maxFwdK / 3.6, maxRev = maxRevK / 3.6;
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

    // direção: escala com |vForward| e inverte em ré
    const movingSign = vForward >= 0 ? 1 : -1;
    const steerScale = THREE.MathUtils.clamp(Math.abs(vForward) / 8, 0.3, 1.2);
    if (left)  body.applyTorqueImpulse({ x: 0, y:  steerBase * steerScale * movingSign * delta, z: 0 }, true);
    if (right) body.applyTorqueImpulse({ x: 0, y: -steerBase * steerScale * movingSign * delta, z: 0 }, true);

    // segura rotação
    const av = body.angvel();
    body.setAngvel({ x: av.x * angDamping, y: av.y * 0.98, z: av.z * angDamping }, true);

    // anti-queda
    const tr = body.translation();
    if (tr.y < -5) {
      body.setTranslation({ x: 0, y: 0.6, z: 0 }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }

    // HUD
    useCarStore.getState().setSpeed(speed * 3.6);

    // câmera follow
    const target = new THREE.Vector3(tr.x, tr.y, tr.z);
    const behind = dir.clone().multiplyScalar(-7);
    const desired = target.clone().add(behind).add(new THREE.Vector3(0, 3, 0));
    if (Number.isFinite(desired.x) && Number.isFinite(desired.y) && Number.isFinite(desired.z)) {
      state.camera.position.lerp(desired, 0.12);
      state.camera.lookAt(target);
    }
  });

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
