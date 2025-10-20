// src/store/usePortal.ts
import { create } from "zustand";

export type Portal = {
  slug: string;
  title: string;
  tags?: string[];
  thumb?: string;
  url?: string; // <- ADICIONEI
};

type PortalState = {
  active: Portal | null;
  lastEnter: number;
  // aceita objeto direto OU função (como você usa no onExit)
  setActive: (next: Portal | ((curr: Portal | null) => Portal | null)) => void;
  setLastEnter: (t: number) => void;
};

export const usePortal = create<PortalState>()((set) => ({
  active: null,
  lastEnter: 0,
  setActive: (next) =>
    set((state) => {
      if (typeof next === "function") {
        return { active: (next as (c: Portal | null) => Portal | null)(state.active) };
      }
      return { active: next };
    }),
  setLastEnter: (t) => set({ lastEnter: t }),
}));
