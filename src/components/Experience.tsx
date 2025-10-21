"use client";

import { Suspense, useMemo, useState, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  KeyboardControls,
  Environment,
  Html,
  Loader,
  AdaptiveDpr,
  Preload,
} from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";
import World from "./World";
import Car from "./Car";
import ProjectBillboard from "./ProjectBillboard";
import SiteModal from "./SiteModal";
import HUD from "./HUD";
import { projects, type Project } from "@/data/projects";
import { useWebSocket } from "@/lib/useWebSocket";
import OtherPlayerCar from "./OtherPlayerCar";
import { Joystick } from "react-joystick-component";

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

export default function Experience() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { players, playerId } = useWebSocket();
  const [isMobile, setIsMobile] = useState(false);

  const localPlayer = players[playerId] as Player | undefined;

  const isLowPower = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return (navigator.hardwareConcurrency || 4) < 4;
  }, []);

  const enableShadows = true;

  // Detecção de dispositivo móvel
  useEffect(() => {
    const mobileCheck =
      /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    setIsMobile(mobileCheck);

    if (mobileCheck) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    };
  }, []);

  const handleOpenSite = useCallback((project: Project) => {
    setCurrentProject(project);
    setModalOpen(true);
  }, []);

  // Simula eventos de teclado para o joystick
  const simulateKey = useCallback((key: string, down: boolean) => {
    const eventName = down ? "keydown" : "keyup";
    const event = new KeyboardEvent(eventName, {
      key,
      code: key.startsWith("Key") ? key : `Key${key.toUpperCase()}`,
      bubbles: true,
    });
    window.dispatchEvent(event);
  }, []);
  
  // Handlers do Joystick
  const handleMove = (data: any) => {
    const { x, y } = data;
    simulateKey("KeyW", y > 0.3);
    simulateKey("KeyS", y < -0.3);
    simulateKey("KeyA", x < -0.3);
    simulateKey("KeyD", x > 0.3);
  };
  const handleStop = () => ["KeyW", "KeyS", "KeyA", "KeyD"].forEach((k) => simulateKey(k, false));

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        touchAction: "none",
      }}
    >
      {!modalOpen ? (
        <KeyboardControls
          map={[
            { name: "forward", keys: ["ArrowUp", "KeyW"] },
            { name: "backward", keys: ["ArrowDown", "KeyS"] },
            { name: "left", keys: ["ArrowLeft", "KeyA"] },
            { name: "right", keys: ["ArrowRight", "KeyD"] },
            { name: "boost", keys: ["ShiftLeft", "ShiftRight"] },
            { name: "interact", keys: ["Enter"] },
          ]}
        >
          <Canvas
            dpr={isLowPower ? [1, 1.25] : [1, 2]}
            gl={{
              antialias: !isLowPower,
              powerPreference: "high-performance",
              alpha: false,
            }}
            camera={{ position: [0, 6, 14], fov: 50 }}
            shadows={enableShadows}
            style={{ pointerEvents: modalOpen ? "none" : "auto" }}
          >
            <color attach="background" args={["#07080f"]} />
            <fog attach="fog" args={["#07080f", 25, 140]} />
            <Environment files="/hdris/studio_small_08_4k.exr" background={false} />
            <ambientLight intensity={0.15} />
            <directionalLight
              position={[10, 15, 10]}
              intensity={0.6}
              castShadow={enableShadows}
              shadow-mapSize={[1024, 1024]}
              shadow-camera-far={60}
              shadow-bias={-0.0005}
            />
            <AdaptiveDpr />
            <Suspense fallback={<Html center>carregando neon…</Html>}>
              <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60} updateLoop="independent" interpolate>
                <World />

                {localPlayer && (
                   <Car
                     initialPosition={[localPlayer.x, localPlayer.y + 0.5, localPlayer.z]}
                     initialRotation={[localPlayer.rx, localPlayer.ry, localPlayer.rz]}
                   />
                )}

                {Object.values(players)
                  .filter((p) => p.id !== playerId)
                  .map((p) => (
                    <OtherPlayerCar key={p.id} player={p as Player} />
                  ))}

                {projects.map((p) => (
                  <ProjectBillboard
                    key={p.slug}
                    slug={p.slug}
                    title={p.title}
                    position={p.position}
                    tags={p.tags}
                    thumb={p.thumb}
                    url={p.url}
                    onOpenSite={() => handleOpenSite(p)}
                  />
                ))}
              </Physics>

              <Preload all />

              {!isLowPower && (
                <EffectComposer multisampling={0}>
                  <SMAA />
                  <Bloom intensity={0.46} mipmapBlur luminanceThreshold={0.78} luminanceSmoothing={0.2} />
                  <ChromaticAberration offset={[0.0009, 0.0009]} />
                  <Vignette eskil={false} offset={0.12} darkness={0.6} />
                </EffectComposer>
              )}
            </Suspense>
          </Canvas>

          <Loader />
          <HUD />

          {/* Interface do Joystick para dispositivos móveis */}
          {isMobile && (
            <div className="fixed inset-0 z-[9999] pointer-events-none select-none" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "3vh 4vw", boxSizing: "border-box" }}>
              <div style={{ pointerEvents: "auto", width: 160, height: 160 }}>
                <Joystick
                  size={140}
                  baseColor="rgba(255,255,255,0.15)"
                  stickColor="rgba(255,255,255,0.9)"
                  move={handleMove}
                  stop={handleStop}
                />
              </div>
              <div style={{ pointerEvents: "auto", width: 140, height: 140 }}>
                <button
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #00ff88 0%, #007f44 100%)",
                    boxShadow: "0 0 25px rgba(0, 255, 136, 0.6)",
                    border: "3px solid rgba(255,255,255,0.3)",
                    color: "white",
                    fontSize: "2rem",
                  }}
                  onTouchStart={() => simulateKey("ShiftLeft", true)}
                  onTouchEnd={() => simulateKey("ShiftLeft", false)}
                >⚡</button>
              </div>
            </div>
          )}
        </KeyboardControls>
      ) : (
        <div className="w-full h-full bg-[#07080f]" />
      )}

      <SiteModal
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setCurrentProject(null);
        }}
        title={currentProject?.title}
        url={currentProject?.url}
      />
    </div>
  );
}

