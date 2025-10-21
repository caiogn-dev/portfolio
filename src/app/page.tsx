import dynamic from "next/dynamic";
import { Suspense } from "react";

const ExperienceClient = dynamic(
  () => import("@/components/ExperienceClient"),
  { ssr: false }
);

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ExperienceClient />
    </Suspense>
  );
}
