"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

// MUDE ISSO para a URL do seu servidor quando fizer o deploy
const WS_URL = "https://websocket-api-s05v.onrender.com"; // ou "wss://seu-servidor.onrender.com"

type PlayerState = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  v?: number;
  updatedAt: number;
};

type Players = {
  [id: string]: PlayerState;
};

// Mensagem "join" simplificada
type Message =
  | { type: "join"; id: string; name: string; }
  | { type: "state"; id: string; x: number; y: number; z: number; rx: number; ry: number; rz: number; v?: number }
  | { type: "snapshot"; players: Players }
  | { type: "playerJoined"; player: PlayerState }
  | { type: "playerLeft"; id: string }
  | { type: "update"; player: PlayerState };

export const useWebSocket = (playerName: string = "anon") => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Players>({});
  const playerId = useRef<string>(uuidv4());

  const sendMessage = useCallback((message: Message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
      // Apenas envia o pedido para entrar. O servidor irá definir a posição.
      sendMessage({ type: "join", id: playerId.current, name: playerName });
    };

    ws.current.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      // O console.log foi removido para não poluir o console, mas você pode reativá-lo para debug.
      // console.log("WebSocket message received:", message);
      switch (message.type) {
        case "snapshot":
          setPlayers(message.players);
          break;
        case "playerJoined":
          setPlayers((prev) => ({ ...prev, [message.player.id]: message.player }));
          break;
        case "playerLeft":
          setPlayers((prev) => {
            const newPlayers = { ...prev };
            delete newPlayers[message.id];
            return newPlayers;
          });
          break;
        case "update":
          // Otimização: só atualiza se o jogador não for o local
          if (message.player.id !== playerId.current) {
            setPlayers((prev) => ({ ...prev, [message.player.id]: message.player }));
          }
          break;
        default:
          console.warn("Unknown message type", message);
      }
    };

    ws.current.onclose = (event) => {
      console.warn("WebSocket disconnected:", event.code, event.reason, event.wasClean);
      setIsConnected(false);
      // Lógica de reconexão pode ser melhorada, mas mantida por enquanto
      setTimeout(() => {
        console.log("Attempting to reconnect WebSocket...");
        if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
          // recria a conexão
           ws.current = new WebSocket(WS_URL);
        }
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      ws.current?.close();
    };

    return () => {
      ws.current?.close();
    };
  }, [playerName, sendMessage]);

  const sendPlayerState = useCallback(
    (x: number, y: number, z: number, rx: number, ry: number, rz: number, v?: number) => {
      sendMessage({ type: "state", id: playerId.current, x, y, z, rx, ry, rz, v });
    },
    [sendMessage]
  );

  return {
    isConnected,
    players,
    playerId: playerId.current,
    sendPlayerState,
  };
};