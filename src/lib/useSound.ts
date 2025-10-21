import { Howl } from 'howler';
import { useCallback, useRef } from 'react';

// Este hook gerencia os sons do carro
export const useCarSounds = () => {
  const sounds = useRef({
    // Som do motor, configurado para loop
    engine: new Howl({
      src: ['/sounds/engine.mp3'],
      loop: true,
      volume: 0.4,
      html5: true, // Essencial para controle de 'rate'
    }),
    // Som de colisão
    collision: new Howl({
      src: ['/sounds/collision.mp3'],
      volume: 0.7,
    }),
    // Som da buzina
    horn: new Howl({
      src: ['/sounds/horn.mp3'],
      volume: 0.6,
    }),
  }).current;

  // Inicia o som do motor (deve ser chamado uma vez)
  const startEngine = useCallback(() => {
    if (!sounds.engine.playing()) {
      sounds.engine.play();
    }
  }, [sounds.engine]);

  // Atualiza o tom (pitch) do motor com base na velocidade
  const updateEngineSound = useCallback((speedKmh: number) => {
    const minRate = 0.6;
    const maxRate = 1.8;
    // Mapeia a velocidade (0-75 km/h) para o pitch (0.6-1.8)
    const rate = minRate + (speedKmh / 75) * (maxRate - minRate);
    sounds.engine.rate(Math.max(minRate, rate)); // Garante que o pitch não seja menor que o mínimo
  }, [sounds.engine]);

  // Toca o som de colisão
  const playCollision = useCallback(() => {
    sounds.collision.play();
  }, [sounds.collision]);

  // Toca o som da buzina
  const playHorn = useCallback(() => {
    if (!sounds.horn.playing()) {
      sounds.horn.play();
    }
  }, [sounds.horn]);

  return { startEngine, updateEngineSound, playCollision, playHorn };
};
