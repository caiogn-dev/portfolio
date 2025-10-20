"use client";

import dynamic from "next/dynamic";

// agora o dynamic com ssr:false está em um Client Component (permitido)
const Experience = dynamic(() => import("./Experience"), { ssr: false });

export default function ExperienceClient() {
  return <Experience />;
}
