"use client";
import { useEffect, useRef, useCallback } from "react";

interface MobileControlsProps {
  simulateKey: (key: string, down: boolean) => void;
}

export default function MobileControls({ simulateKey }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);

  // Sistema do joystick
  useEffect(() => {
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
      const distance = Math.min(Math.hypot(dx, dy), 70);
      const angle = Math.atan2(dy, dx);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      knob.style.transform = `translate(${x}px, ${y}px)`;

      const up = dy < -20;
      const down = dy > 20;
      const left = dx < -20;
      const right = dx > 20;

      simulateKey("KeyW", up);
      simulateKey("KeyS", down);
      simulateKey("KeyA", left);
      simulateKey("KeyD", right);
    };

    const handleEnd = () => {
      active = false;
      knob.style.transform = "translate(0, 0)";
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
  }, [simulateKey]);

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none select-none"
      style={{
        touchAction: "none",
        background: "transparent",
      }}
    >
      {/* Joystick grande à esquerda */}
      <div
        ref={joystickRef}
        className="absolute bottom-[6vh] left-[5vw] w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] rounded-full bg-white/10 border border-white/30 backdrop-blur-xl shadow-[0_0_25px_rgba(255,255,255,0.2)] pointer-events-auto flex items-center justify-center"
      >
        <div
          ref={knobRef}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-white/70 to-white/40 rounded-full shadow-inner transition-transform duration-75"
        />
      </div>

      {/* Botão de aceleração à direita */}
      <div className="absolute bottom-[8vh] right-[7vw] pointer-events-auto">
        <button
          className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white text-3xl font-bold shadow-[0_0_30px_rgba(0,255,100,0.6)] active:scale-95 transition-transform flex items-center justify-center"
          onTouchStart={() => simulateKey("ShiftLeft", true)}
          onTouchEnd={() => simulateKey("ShiftLeft", false)}
        >
          ⚡
        </button>
      </div>
    </div>
  );
}
