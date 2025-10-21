"use client";

import { Suspense, useMemo, useState, useCallback, useEffect, useRef } from "react";
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

export default function Experience() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  const isLowPower = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return ((navigator as any).hardwareConcurrency || 4) < 4;
  }, []);

  const enableShadows = true;

  useEffect(() => {
    const mobileCheck =
      /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
    setIsMobile(mobileCheck);
  }, []);

  const handleOpenSite = useCallback((project: Project) => {
    setCurrentProject(project);
    setModalOpen(true);
  }, []);

  // Simula teclas
  const simulateKey = useCallback((key: string, down: boolean) => {
    const event = new KeyboardEvent(down ? "keydown" : "keyup", {
      key,
      code: key,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, []);

  // --- JOYSTICK ANALÓGICO ---
  useEffect(() => {
    if (!isMobile) return;

    const joystick = joystickRef.current;
    const knob = knobRef.current;
    if (!joystick || !knob) return;

    let active = false;
    let center = { x: 0, y: 0 };

    const handleStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const rect = joystick.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      active = true;
    };

    const handleMove = (e: TouchEvent) => {
      if (!active) return;
      const touch = e.touches[0];
      const dx = touch.clientX - center.x;
      const dy = touch.clientY - center.y;
      const distance = Math.min(Math.hypot(dx, dy), 40);
      const angle = Math.atan2(dy, dx);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      knob.style.transform = `translate(${x}px, ${y}px)`;

      // Direções simuladas
      const up = dy < -10;
      const down = dy > 10;
      const left = dx < -10;
      const right = dx > 10;

      simulateKey("KeyW", up);
      simulateKey("KeyS", down);
      simulateKey("KeyA", left);
      simulateKey("KeyD", right);
    };

    const handleEnd = () => {
      active = false;
      knob.style.transform = "translate(0px, 0px)";
      ["KeyW", "KeyS", "KeyA", "KeyD"].forEach((k) => simulateKey(k, false));
    };

    joystick.addEventListener("touchstart", handleStart);
    joystick.addEventListener("touchmove", handleMove);
    joystick.addEventListener("touchend", handleEnd);
    joystick.addEventListener("touchcancel", handleEnd);

    return () => {
      joystick.removeEventListener("touchstart", handleStart);
      joystick.removeEventListener("touchmove", handleMove);
      joystick.removeEventListener("touchend", handleEnd);
      joystick.removeEventListener("touchcancel", handleEnd);
    };
  }, [isMobile, simulateKey]);

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

          {/* ✅ Mobile joystick + acelerador */}
          {isMobile && (
            <div className="fixed inset-0 z-[100] pointer-events-none select-none">
              {/* Joystick circular */}
              <div
                ref={joystickRef}
                className="absolute bottom-8 left-6 w-32 h-32 bg-white/10 rounded-full backdrop-blur-md pointer-events-auto flex items-center justify-center shadow-lg"
              >
                <div
                  ref={knobRef}
                  className="w-16 h-16 bg-white/40 rounded-full shadow-inner transition-transform duration-75"
                />
              </div>

              {/* Botão acelerador */}
              <div className="absolute bottom-12 right-8 pointer-events-auto">
                <button
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white text-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center"
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
