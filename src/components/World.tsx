import { RigidBody, CuboidCollider } from "@react-three/rapier";

export default function World() {
  return (
    <>
      {/* Chão */}
      <RigidBody type="fixed" colliders="cuboid" friction={1.5} restitution={0.2}>
        <mesh receiveShadow>
          <boxGeometry args={[200, 0.2, 200]} />
          <meshStandardMaterial color="#303030" />
        </mesh>
      </RigidBody>

      {/* Paredes Invisíveis */}
      <CuboidCollider position={[0, 5, 100]} args={[100, 5, 1]} />
      <CuboidCollider position={[0, 5, -100]} args={[100, 5, 1]} />
      <CuboidCollider position={[100, 5, 0]} args={[1, 5, 100]} />
      <CuboidCollider position={[-100, 5, 0]} args={[1, 5, 100]} />

      {/* Rampa 1 */}
      <RigidBody type="fixed" position={[-15, 0, 0]} rotation={[0, 0, -0.2]}>
        <CuboidCollider args={[10, 0.2, 5]} />
      </RigidBody>

      {/* Rampa 2 */}
      <RigidBody type="fixed" position={[20, 0, 10]} rotation={[0, -Math.PI / 4, 0.3]}>
        <CuboidCollider args={[8, 0.2, 3]} />
      </RigidBody>
    </>
  );
}
