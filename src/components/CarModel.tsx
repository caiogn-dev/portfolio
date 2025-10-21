import { useGLTF } from "@react-three/drei";

// Define as props, incluindo o controle da intensidade dos faróis
type CarModelProps = {
  headlightsOn?: boolean;
} & React.ComponentProps<"group">;

export default function CarModel({ headlightsOn = false, ...props }: CarModelProps) {
  const { nodes, materials } = useGLTF("/models/car_compressed.glb") as any;

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.body.geometry}
        material={materials.body}
      />
      {/* ... (outras meshes do carro) ... */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.windows.geometry}
        material={materials.window}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.wheels.geometry}
        material={materials.wheels}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.lights.geometry}
        material={materials.lights}
      />

      {/* Faróis */}
      <spotLight
        color="#00e5ff"
        angle={0.6}
        penumbra={0.8}
        distance={20}
        position={[0.35, 0.1, -1]}
        intensity={headlightsOn ? 10 : 0} // Controlado pelo estado
        castShadow
      />
      <spotLight
        color="#00e5ff"
        angle={0.6}
        penumbra={0.8}
        distance={20}
        position={[-0.35, 0.1, -1]}
        intensity={headlightsOn ? 10 : 0} // Controlado pelo estado
        castShadow
      />
    </group>
  );
}

useGLTF.preload("/models/car_compressed.glb");
