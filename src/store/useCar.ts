import { create } from 'zustand';

type CarState = {
  speed: number;
  setSpeed: (speed: number) => void;
};

// Store central para o estado do carro (velocidade)
export const useCarStore = create<CarState>((set) => ({
  speed: 0,
  setSpeed: (speed) => set({ speed }),
}));
