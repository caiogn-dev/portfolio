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
import { Joystick } from "react-joystick-component";

export default function Experience() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const isLowPower = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return ((navigator as any).hardwareConcurrency || 4) < 4;
  }, []);

  const enableShadows = true;

  // Detecta mobile
  useEffect(() => {
    const mobileCheck =
      /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    setIsMobile(mobileCheck);
  }, []);

  const handleOpenSite = useCallback((project: Project) => {
    setCurrentProject(project);
    setModalOpen(true);
  }, []);

  // Função que simula eventos de teclado
  const simulateKey = useCallback((key: string, down: boolean) => {
    const event = new KeyboardEvent(down ? "keydown" : "keyup", {
      key,
      code: key,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, []);

  // --- Joystick handlers ---
  const handleMove = (data: any) => {
    const { x, y } = data;
    simulateKey("KeyW", y > 0.3);
    simulateKey("KeyS", y < -0.3);
    simulateKey("KeyA", x < -0.3);
    simulateKey("KeyD", x > 0.3);
  };

  const handleStop = () => {
    ["KeyW", "KeyS", "KeyA", "KeyD"].forEach((k) => simulateKey(k, false));
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
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

            <Environment
              files="/hdris/studio_small_08_4k.exr"
              background={false}
            />

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
              <Physics
                gravity={[0, -9.81, 0]}
                timeStep={1 / 60}
                updateLoop="independent"
                interpolate
              >
                <World />
                <Car />

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

              <EffectComposer multisampling={0}>
                <SMAA />
                <Bloom
                  intensity={0.46}
                  mipmapBlur
                  luminanceThreshold={0.78}
                  luminanceSmoothing={0.2}
                />
                <ChromaticAberration offset={[0.0009, 0.0009]} />
                <Vignette eskil={false} offset={0.12} darkness={0.6} />
              </EffectComposer>
            </Suspense>
          </Canvas>

          <Loader />
          <HUD />

          {/* ✅ Joystick + Acelerador (mobile) */}
          {isMobile && (
            <div className="fixed inset-0 z-[100] pointer-events-none select-none">
              {/* Joystick à esquerda */}
              <div className="absolute bottom-8 left-6 pointer-events-auto flex items-center justify-center">
                <Joystick
                  size={120}
                  baseColor="rgba(255,255,255,0.15)"
                  stickColor="rgba(255,255,255,0.9)"
                  move={handleMove}
                  stop={handleStop}
                />
              </div>

              {/* Botão de boost à direita */}
              <div className="absolute bottom-14 right-10 pointer-events-auto">
                <button
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white text-2xl shadow-2xl active:scale-95 transition-transform flex items-center justify-center"
                  onTouchStart={() => simulateKey("ShiftLeft", true)}
                  onTouchEnd={() => simulateKey("ShiftLeft", false)}
                >
                  ⚡
                </button>
              </div>
            </div>
          )}
        </KeyboardControls>
      ) : (
        <div className="w-full h-full bg-[#07080f]" />
      )}

      {/* Modal HTML sobreposto */}
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
