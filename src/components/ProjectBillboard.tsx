"use client";

import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Html, Text } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { usePortal } from "@/store/usePortal";

type Props = {
  slug: string;
  title: string;
  position?: [number, number, number];
  tags?: string[];
  thumb?: string;   // /thumbs/xxx.jpg
  url?: string;     // opcional (para CTA/Modal)
  onOpenSite?: () => void;
};

export default function ProjectBillboard({
  slug,
  title,
  position = [0, 0, 0],
  tags = [],
  thumb,
  url,
  onOpenSite,
}: Props) {
  const setActive = usePortal((s) => s.setActive);
  const group = useRef<THREE.Group>(null!);
  const hover = useRef(false);
  const basePos = useMemo<[number, number, number]>(() => position, [position]);

  // estado "perto" e animações suaves
  const [near, setNear] = useState(false);
  const dfRef = useRef<number>(12);       // distanceFactor atual
  const [dfState, setDfState] = useState<number>(12); // usado no Html (react prop)

  // materiais sutis
  const matPost = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#141222",
        emissive: new THREE.Color("#00e5ff"),
        emissiveIntensity: 0.35,
        metalness: 0.25,
        roughness: 0.55,
      }),
    []
  );

  // animação contínua
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();

    // flutuação leve
    const yFloat = 0.05 * Math.sin(t * 1.4 + basePos[0] * 0.3);
    group.current.position.x = basePos[0];
    group.current.position.y = (basePos[1] ?? 0) + yFloat;

    // quando "perto", jogamos o bloco mais para trás no Z
    const targetZ = (basePos[2] ?? 0) + (near ? -2.0 : 0.0);
    group.current.position.z = THREE.MathUtils.lerp(
      group.current.position.z || basePos[2] || 0,
      targetZ,
      0.08
    );

    // brilho sutil ao passar o mouse
    matPost.emissiveIntensity = 0.35 * (hover.current ? 1.25 : 1);

    // distanceFactor: menor => maior na tela, porém nítido
    const targetDf = near ? 6 : 12;
    const nextDf = THREE.MathUtils.lerp(dfRef.current, targetDf, 0.12);
    if (Math.abs(nextDf - dfRef.current) > 0.002) {
      dfRef.current = nextDf;
      // Atualiza o estado só quando muda perceptivelmente (evita re-render em todo frame)
      setDfState(nextDf);
    }
  });

  // ativa portal no store (para HUD)
  const onEnter = () => {
    setNear(true);
    setActive({ slug, title, tags, thumb, url });
  };
  const onExit = () => {
    setNear(false);
    setActive((curr) => {
      if (curr && curr.slug === slug) return null;
      return curr;
    });
  };

  useEffect(() => {
    return () => {
      matPost.dispose();
    };
  }, [matPost]);

  // Dimensões: thumbnail REAL no estado normal; levemente maior no expandido
  // (o "grande na tela" vem do distanceFactor, não de CSS scale, para manter nitidez)
  const compact = { w: 240, h: 140 }; // bem thumbnail
  const expanded = { w: 340, h: 190 }; // um pouco maior, mas o "boom" vem do df
  const W = near ? expanded.w : compact.w;
  const H = near ? expanded.h : compact.h;

  // Estilos comuns
  const cardBase: React.CSSProperties = {
    width: W,
    height: H,
    // não usamos CSS scale para evitar borrado
    transformOrigin: "center",
    transition:
      "width 220ms ease, height 220ms ease, box-shadow 220ms ease, border-color 220ms ease, background 200ms ease",
    background: near
      ? "linear-gradient(180deg, rgba(0,229,255,0.10), rgba(0,229,255,0.04))"
      : "rgba(7, 8, 15, 0.78)",
    border: "1px solid",
    borderColor: near ? "#00e5ff99" : "#00e5ff44",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: near
      ? "0 26px 96px rgba(0,229,255,0.28), 0 0 0 1px rgba(0,229,255,0.12) inset"
      : "0 12px 40px rgba(0,229,255,0.16)",
    backdropFilter: "blur(6px)",
    display: "grid",
    gridTemplateRows: "1fr 42px",
    cursor: near && url ? "pointer" : "default",
    imageRendering: "auto",
    willChange: "transform, width, height",
  };

  const titleCompact: React.CSSProperties = {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 10,
    color: "white",
    fontWeight: 800,
    fontSize: 16,
    textShadow: "0 2px 16px rgba(0,0,0,0.6)",
    letterSpacing: 0.2,
    lineHeight: 1.1,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  };

  return (
    <group ref={group} position={position}>
      {/* mastro */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 16]} />
        <primitive object={matPost} attach="material" />
      </mesh>

      {/* label flutuante sutil (fora do card) */}
      <Text
        position={[0, 2.1, 0]}
        fontSize={0.26}
        color="#cfeaff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#00e5ff"
      >
        {title}
      </Text>

      {/* sensor de proximidade */}
      <RigidBody type="fixed">
        <CuboidCollider
          args={[2.6, 1.6, 2.6]}
          position={[0, 1.4, 0]}
          sensor
          onIntersectionEnter={onEnter}
          onIntersectionExit={onExit}
        />
      </RigidBody>

      {/* CARD HTML (thumbnail + título). 
          Usamos distanceFactor animado para aumentar "no para-brisa" com nitidez. */}
      <Html
        position={[0, 1.8, 0]}
        center
        transform
        distanceFactor={dfState}
        style={{ pointerEvents: "auto" }}
      >
        <div
          onPointerEnter={() => (hover.current = true)}
          onPointerLeave={() => (hover.current = false)}
          onClick={() => url && near && onOpenSite?.()}
          style={cardBase}
          className="r3f-ui"
        >
          {/* THUMBNAIL PURA (sem iframe) */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              background: thumb
                ? "transparent"
                : "linear-gradient(45deg, #15182a, #0d1020)",
            }}
          >
            {thumb ? (
              <img
                src={thumb}
                alt={title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "translateZ(0)", // evita blur subpixel
                  filter: near ? "none" : "grayscale(8%) brightness(0.96)",
                  transition: "filter 180ms ease",
                }}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  color: "#9ec9ff",
                  fontSize: 12,
                  opacity: 0.8,
                }}
              >
                sem thumbnail
              </div>
            )}

            {/* Título sobreposto no modo compacto */}
            {!near && <div style={titleCompact} title={title}>{title}</div>}

            {/* Gradiente de legibilidade no compacto */}
            {!near && (
              <div
                style={{
                  position: "absolute",
                  inset: "auto 0 0 0",
                  height: 72,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(3,7,18,0.85) 65%, rgba(3,7,18,0.95) 100%)",
                }}
              />
            )}
          </div>

          {/* FAIXA INFERIOR — limpa e legível quando expandido */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "8px 10px",
              borderTop: "1px solid rgba(0,229,255,0.22)",
              background:
                "linear-gradient(180deg, rgba(0,229,255,0.08), rgba(0,229,255,0))",
              color: "#eaf9ff",
              fontFamily: "Inter, ui-sans-serif, system-ui",
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: near ? 16 : 13,
                letterSpacing: 0.2,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                maxWidth: "65%",
              }}
              title={title}
            >
              {title}
            </span>

            <div style={{ display: "flex", gap: 8 }}>
              {/* Chips (até 3) — só quando expandido */}
              {near && tags?.length
                ? tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      style={{
                        fontSize: 10,
                        padding: "4px 8px",
                        borderRadius: 999,
                        background: "#0e1122",
                        border: "1px solid #00e5ff44",
                        color: "#cfeaff",
                        letterSpacing: 0.2,
                      }}
                    >
                      {t}
                    </span>
                  ))
                : null}

              {/* CTA discreto */}
              {near && url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSite?.();
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #00e5ff88",
                    background:
                      "linear-gradient(180deg, rgba(0,229,255,0.25), rgba(0,229,255,0.1))",
                    color: "#eaf9ff",
                    fontWeight: 800,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  title="Abrir preview em modal"
                >
                  Modal
                </button>
              )}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
