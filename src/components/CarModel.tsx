import { useGLTF } from "@react-three/drei";

type CarModelProps = {
  headlightsOn?: boolean;
} & React.ComponentProps<"group">;

export default function CarModel({ headlightsOn = false, ...props }: CarModelProps) {
  // O 'as any' é mantido porque não conhecemos a estrutura exata do seu GLB.
  const { nodes, materials } = useGLTF("/models/car_compressed.glb") as any;

  return (
    <group {...props} dispose={null}>
      {/* CORREÇÃO: Adicionamos uma verificação.
        Se 'nodes.body' existir, a malha será renderizada. Senão, será ignorada.
        Faça isso para todas as partes do seu modelo.
      */}
      {nodes.body && (
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.body.geometry}
          material={materials.body}
        />
      )}
      {nodes.windows && (
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.windows.geometry}
          material={materials.window}
        />
      )}
      {nodes.wheels && (
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.wheels.geometry}
          material={materials.wheels}
        />
      )}
      {nodes.lights && (
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.lights.geometry}
          material={materials.lights}
        />
      )}

      {/* Faróis */}
      <spotLight
        color="#00e5ff"
        angle={0.6}
        penumbra={0.8}
        distance={20}
        position={[0.35, 0.1, -1]}
        intensity={headlightsOn ? 10 : 0}
        castShadow
      />
      <spotLight
        color="#00e5ff"
        angle={0.6}
        penumbra={0.8}
        distance={20}
        position={[-0.35, 0.1, -1]}
        intensity={headlightsOn ? 10 : 0}
        castShadow
      />
    </group>
  );
}

useGLTF.preload("/models/car_compressed.glb");

