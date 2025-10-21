"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import CarModel from "./CarModel";

type Player = {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    rx: number;
    ry: number;
    rz: number;
    updatedAt: number;
};

export default function OtherPlayerCar({ player }: { player: Player }) {
    const bodyRef = useRef<RapierRigidBody>(null);

    useFrame(() => {
        if (!bodyRef.current) return;

        // Posição e rotação alvo vindas do servidor
        const targetPos = new THREE.Vector3(player.x, player.y, player.z);
        const targetRot = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(player.rx, player.ry, player.rz)
        );

        // Move suavemente o corpo físico para a posição de rede
        bodyRef.current.setNextKinematicTranslation(targetPos);
        bodyRef.current.setNextKinematicRotation(targetRot);
    });

    return (
        <RigidBody
            ref={bodyRef}
            type="kinematicPosition" // Controlado por código, mas participa das colisões
            colliders="cuboid"
            restitution={0.8} // Mesma elasticidade do carro local
            friction={0.8}
        >
            <CarModel scale={0.5} position={[0, -0.3, 0]} rotation={[0, Math.PI, 0]} />
        </RigidBody>
    );
}
