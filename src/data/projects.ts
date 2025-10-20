// src/data/projects.ts
import type { Vector3Tuple } from "three";

export type Project = {
  slug: string;
  title: string;
  position: Vector3Tuple;
  thumb: string;
  tags?: string[];
  url?: string; // <- site para abrir no modal
};

export const projects: Project[] = [
  {
    slug: "coffee-break",
    title: "Simulador Coffee Break",
    position: [0, 0, 0],
    thumb: "/imgs/thumbs/coffee.jpg",
    tags: ["Next.js", "Forms"],
    url: "https://ivonethbanqueteria.com.br",
  },
  // ...
];
