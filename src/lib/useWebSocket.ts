"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

// MUDE ISSO para a URL do seu servidor quando fizer o deploy
const WS_URL = "wss://websocket-api-s05v.onrender.com";

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

type Message =
  | { type: "join"; id: string; name: string }
  | { type: "state"; id: string; x: number; y: number; z: number; rx: number; ry: number; rz: number; v?: number }
  | { type: "snapshot"; players: Players }
  | { type: "playerJoined"; player: PlayerState }
  | { type: "playerLeft"; id: string }
  | { type: "update"; player: PlayerState };

// Função para obter/criar um ID de jogador persistente
const getPlayerId = (): string => {
  if (typeof window === 'undefined') {
    return uuidv4(); // Fallback para ambientes não-navegador
  }
  let pid = localStorage.getItem("playerId");
  if (!pid) {
    pid = uuidv4();
    localStorage.setItem("playerId", pid);
  }
  return pid;
};

export const useWebSocket = (playerName: string = "anon") => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Players>({});
  // Usa o ID persistente
  const playerId = useRef<string>(getPlayerId());

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
      sendMessage({ type: "join", id: playerId.current, name: playerName });
    };

    ws.current.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
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
          if (message.player.id !== playerId.current) {
            setPlayers((prev) => ({ ...prev, [message.player.id]: message.player }));
          }
          break;
        default:
          console.warn("Unknown message type", message);
      }
    };

    ws.current.onclose = (event) => {
      console.warn("WebSocket disconnected:", event.code, event.reason);
      setIsConnected(false);
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