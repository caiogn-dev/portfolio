"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

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
      sendMessage({ type: "join", id: playerId.current, name: playerName });
    };

    ws.current.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      console.log("WebSocket message received:", message);
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
          setPlayers((prev) => ({ ...prev, [message.player.id]: message.player }));
          break;
        default:
          console.warn("Unknown message type", message);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log("Attempting to reconnect WebSocket...");
        if (ws.current && ws.current.readyState === WebSocket.CLOSED) {
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
