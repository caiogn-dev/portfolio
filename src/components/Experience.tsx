"use client";

import { Suspense, useMemo, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Environment, Html, Loader, AdaptiveDpr, Preload } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { EffectComposer, Bloom, ChromaticAberration, Vignette, SMAA } from "@react-three/postprocessing";
import World from "./World";
import Car from "./Car";
import ProjectBillboard from "./ProjectBillboard";
import SiteModal from "./SiteModal";
import HUD from "./HUD";
import { projects, type Project } from "@/data/projects";

export default function Experience() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const isLowPower = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return ((navigator as any).hardwareConcurrency || 4) < 4;
  }, []);

  const enableShadows = true;

  const handleOpenSite = useCallback((project: Project) => {
    setCurrentProject(project);
    setModalOpen(true);
  }, []);

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
            gl={{ antialias: !isLowPower, powerPreference: "high-performance", alpha: false }}
            camera={{ position: [0, 6, 14], fov: 50 }}
            shadows={enableShadows}
            style={{ pointerEvents: modalOpen ? "none" : "auto" }}
          >
            <color attach="background" args={["#07080f"]} />
            <fog attach="fog" args={["#07080f", 25, 140]} />

            {/* Se não tiver o arquivo no /public/hdris, troque por preset="studio" */}
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
              <Physics
                gravity={[0, -9.81, 0]}
                timeStep={1 / 60}          // ✅ step fixo (60Hz)
                updateLoop="independent"   // ✅ física independente do render
                interpolate                // ✅ interpola visualmente entre steps
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
                <Bloom intensity={0.46} mipmapBlur luminanceThreshold={0.78} luminanceSmoothing={0.2} />
                <ChromaticAberration offset={[0.0009, 0.0009]} />
                <Vignette eskil={false} offset={0.12} darkness={0.6} />
              </EffectComposer>
            </Suspense>
          </Canvas>

          <Loader />
          <HUD />
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
