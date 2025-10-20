"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useCarStore } from "./Car"; // mantém como está no seu Car.tsx
import { usePortal } from "@/store/usePortal";
import { useRouter } from "next/navigation";

export default function HUD() {
  const speed = useCarStore((s) => s.speedKmh);
  const active = usePortal((s) => s.active);
  const setLastEnter = usePortal((s) => s.setLastEnter);
  const lastEnter = usePortal((s) => s.lastEnter);
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // handler de teclas: Enter = push; Shift+Enter = modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!active) return;

      // Shift+Enter => modal com iframe (se tiver URL)
      if (e.key === "Enter" && e.shiftKey) {
        if (!active?.url) return;
        const now = performance.now();
        if (now - lastEnter < 400) return; // debounce
        setLastEnter(now);
        setModalOpen(true);
        return;
      }

      // Enter simples => navega
      if (e.key === "Enter" && !e.shiftKey) {
        const now = performance.now();
        if (now - lastEnter < 400) return; // debounce
        setLastEnter(now);
        router.push(`/projects/${active.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, lastEnter, setLastEnter, router]);

  // fechar modal com ESC
  useEffect(() => {
    if (!modalOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [modalOpen]);

  // clicar fora fecha
  const onOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setModalOpen(false);
  }, []);

  const hasActive = !!active;

  const hudBox = useMemo(
    () => ({
      backdropFilter: "blur(8px)",
      background: "rgba(8, 6, 18, 0.6)",
      border: "1px solid #00e5ff44",
      borderRadius: 10,
      boxShadow: "0 0 30px #00e5ff33",
      color: "#eaf9ff",
      fontFamily: "Inter, ui-sans-serif, system-ui",
    }),
    []
  );

  return (
    <>
      {/* Speed box */}
      <div
        style={{
          position: "fixed",
          left: 16,
          bottom: 16,
          padding: "8px 12px",
          ...hudBox,
          fontSize: 14,
          zIndex: 20,
        }}
      >
        Velocidade: <b>{Math.round(speed)}</b> km/h
      </div>

      {/* Card de interação do portal ativo */}
      {hasActive && (
        <div
          role="dialog"
          aria-label={`Projeto ${active?.title}`}
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            display: "flex",
            gap: 12,
            padding: 12,
            ...hudBox,
            zIndex: 30,
          }}
        >
          {/* thumb */}
          {active?.thumb ? (
            <img
              src={active.thumb}
              alt={`Thumb do projeto ${active.title}`}
              style={{
                width: 96,
                height: 72,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #ff00cc55",
                boxShadow: "0 0 25px #ff00cc55",
              }}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              aria-hidden
              style={{
                width: 96,
                height: 72,
                borderRadius: 8,
                border: "1px dashed #444",
                display: "grid",
                placeItems: "center",
                color: "#ccc",
                fontSize: 12,
              }}
            >
              sem thumb
            </div>
          )}

          {/* texto + ações */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                title={active?.title}
              >
                {active?.title}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 999,
                  background: "#0b1322",
                  border: "1px solid #00e5ff44",
                }}
              >
                Perto
              </span>
            </div>

            {/* tags */}
            {active?.tags && active.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {active.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: "#160b1f",
                      border: "1px solid #ff00cc55",
                      color: "#ffdfff",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* botoes */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => router.push(`/projects/${active?.slug}`)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #ff00cc88",
                  background:
                    "linear-gradient(180deg, rgba(255,0,204,0.35), rgba(255,0,204,0.15))",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                title="Abrir página do projeto (Enter)"
              >
                Abrir (Enter)
              </button>

              {active?.url && (
                <button
                  onClick={() => setModalOpen(true)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #00e5ff88",
                    background:
                      "linear-gradient(180deg, rgba(0,229,255,0.25), rgba(0,229,255,0.1))",
                    color: "#eaf9ff",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  title="Abrir site em modal (Shift+Enter)"
                >
                  Abrir no modal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL COM IFRAME */}
      {modalOpen && active?.url && (
        <>
          {/* Esconde qualquer UI do R3F enquanto o modal estiver aberto */}
          <style>{`
            .r3f-tooltip, .r3f-ui, [data-r3f-ui] { display: none !important; }
          `}</style>

          <div
            ref={overlayRef}
            onClick={onOverlayClick}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.70)",
              backdropFilter: "blur(2px)",
              zIndex: 1000, // << garante acima de tudo
              display: "grid",
              placeItems: "center",
            }}
            aria-modal="true"
            role="dialog"
            aria-label={`Visualização do site: ${active.title}`}
          >
            <div
              style={{
                width: "min(1200px, 96vw)",
                height: "min(85vh, 900px)",
                background: "#0b0d15",
                border: "1px solid #00e5ff55",
                borderRadius: 12,
                boxShadow: "0 20px 80px rgba(0,0,0,0.5)",
                overflow: "hidden",
                display: "grid",
                gridTemplateRows: "44px 1fr",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 10px",
                  background:
                    "linear-gradient(180deg, rgba(0,229,255,0.1), rgba(0,229,255,0))",
                  borderBottom: "1px solid #00e5ff33",
                  color: "#eaf9ff",
                  fontFamily: "Inter, ui-sans-serif, system-ui",
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      maxWidth: "70vw",
                    }}
                    title={active.title}
                  >
                    {active.title}
                  </span>
                  <span style={{ opacity: 0.7 }}>—</span>
                  <a
                    href={active.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#9ee8ff", textDecoration: "underline" }}
                    title="Abrir em nova aba"
                  >
                    {active.url}
                  </a>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid #00e5ff66",
                    background:
                      "linear-gradient(180deg, rgba(0,229,255,0.15), rgba(0,229,255,0.05))",
                    color: "#eaf9ff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  title="Fechar (Esc)"
                >
                  Fechar
                </button>
              </div>

              <iframe
                src={active.url}
                title={active.title}
                style={{ width: "100%", height: "100%", border: 0 }}
                allow="fullscreen; geolocation; microphone; camera; clipboard-read; clipboard-write; autoplay"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </>
      )}

    </>
  );
}
