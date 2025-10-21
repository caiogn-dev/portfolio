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
import { Joystick } from "react-joystick-component";
import { v4 as uuidv4 } from "uuid";
import NetworkCar from "./NetworkCar"; // componente para carros remotos

export default function Experience() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // --- network state ---
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(uuidv4());
  const [remotePlayers, setRemotePlayers] = useState<Record<string, any>>({});
  const sendStateRef = useRef<(s: any) => void>(() => {});

  const isLowPower = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return ((navigator as any).hardwareConcurrency || 4) < 4;
  }, []);

  const enableShadows = true;

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

  // Simula teclas
  const simulateKey = useCallback((key: string, down: boolean) => {
    const event = new KeyboardEvent(down ? "keydown" : "keyup", {
      key,
      code: key,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }, []);

  // WEBSOCKET SETUP
  useEffect(() => {
    // mude a URL para o host do seu servidor
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("ws open");
      // enviar join
      ws.send(JSON.stringify({ type: "join", id: clientIdRef.current, name: "player" }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "snapshot") {
          // msg.players => objeto de players
          const others = { ...msg.players };
          delete others[clientIdRef.current];
          setRemotePlayers(others);
        } else if (msg.type === "playerJoined") {
          const p = msg.player;
          if (p.id !== clientIdRef.current) {
            setRemotePlayers((prev) => ({ ...prev, [p.id]: p }));
          }
        } else if (msg.type === "update") {
          const p = msg.player;
          if (p.id === clientIdRef.current) return;
          setRemotePlayers((prev) => ({ ...prev, [p.id]: p }));
        } else if (msg.type === "playerLeft") {
          const id = msg.id;
          setRemotePlayers((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }
      } catch (err) {
        console.warn("ws parse err", err);
      }
    };

    ws.onclose = () => console.log("ws closed");
    ws.onerror = (e) => console.warn("ws err", e);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  // função usada para enviar estado -- throttle/interval
  useEffect(() => {
    let sendInterval: number | null = null;
    // função que enviará o state (troque por sua fonte de posição)
    sendStateRef.current = (state) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: "state", ...state, id: clientIdRef.current }));
    };

    // Exemplo: se você quiser enviar automaticamente a cada 100ms, defina interval
    // Mas só inicie o interval quando ws estiver aberto
    sendInterval = window.setInterval(() => {
      // quem fornece state local? -> o Car deve chamar sendStateRef.current({x,y,z,rx,ry,rz, v})
      // Aqui não temos acesso direto - o ideal é ter o Car chamando a função.
      // Exemplo de fallback: nada automático aqui.
    }, 100);

    return () => {
      if (sendInterval) window.clearInterval(sendInterval);
    };
  }, []);

  // JOYSTICK handlers (mesmo de antes)
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

  // Função que o Car local deve chamar periodicamente para atualizar a rede
  // Por exemplo, passe essa função como prop para <Car onNetworkUpdate={...} />
  const onLocalState = useCallback((state: { x:number,y:number,z:number, rx:number,ry:number,rz:number, v?:number }) => {
    // envia direto
    sendStateRef.current(state);
  }, []);

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
                {/* Passe onNetworkUpdate para o Car local (implementação do Car precisa chamar isso) */}
                <Car onNetworkUpdate={onLocalState} />

                {/* Renderiza carros remotos */}
                {Object.values(remotePlayers).map((p: any) => {
                  // não renderiza o próprio player
                  if (p.id === clientIdRef.current) return null;
                  return <NetworkCar key={p.id} id={p.id} state={p} />;
                })}

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

          {/* MOBILE controls */}
          {isMobile && (
            <div className="fixed inset-0 z-[9999] pointer-events-none select-none"
                 style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", padding:"3vh 4vw", boxSizing:"border-box" }}>
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
