// src/app/projects/[slug]/page.tsx
import type { Metadata } from "next";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Projeto: ${params.slug}` };
}

export default function ProjectPage({ params }: Props) {
  const { slug } = params;
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Projeto: {slug}</h1>
      <p className="opacity-80">Conteúdo do projeto aqui.</p>
    </main>
  );
}
