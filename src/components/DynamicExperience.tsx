"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const ExperienceClientWrapper = dynamic(
  () => import("./ExperienceClientWrapper"),
  { ssr: false }
);

export default function DynamicExperience() {
  return (
    <Suspense fallback={null}>
      <ExperienceClientWrapper />
    </Suspense>
  );
}
