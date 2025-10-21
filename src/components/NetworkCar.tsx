// NetworkCar.tsx
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function NetworkCar({ id, state }: { id: string, state: any }) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const targetRef = useRef({ x: state.x, y: state.y, z: state.z, rx: state.rx || 0, ry: state.ry || 0, rz: state.rz || 0 });

  useEffect(() => {
    // update target on incoming network update
    targetRef.current = { x: state.x, y: state.y, z: state.z, rx: state.rx || 0, ry: state.ry || 0, rz: state.rz || 0 };
  }, [state.x, state.y, state.z, state.rx, state.ry, state.rz]);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Lerping para suavizar
    mesh.position.x += (targetRef.current.x - mesh.position.x) * Math.min(10 * dt, 1);
    mesh.position.y += (targetRef.current.y - mesh.position.y) * Math.min(10 * dt, 1);
    mesh.position.z += (targetRef.current.z - mesh.position.z) * Math.min(10 * dt, 1);

    // Rotations - simples lerp
    mesh.rotation.y += (targetRef.current.ry - mesh.rotation.y) * Math.min(6 * dt, 1);
  });

  return (
    <mesh ref={meshRef} position={[state.x, state.y, state.z]}>
      <boxGeometry args={[1, 0.6, 2]} />
      <meshStandardMaterial color={"#ff0055"} />
    </mesh>
  );
}
