import type { ReactNode } from "react";

export const metadata = {
  title: "Demo – VM Soccer Sucker 26",
  description: "Guided simulation of VM Soccer Sucker 26. Nothing is saved for real.",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Always-visible simulation banner */}
      <div className="sticky top-0 z-50 bg-amber-400 text-pitch-dark text-center py-2 px-4">
        <span className="font-bebas text-lg tracking-widest">🎭 SIMULERING</span>
        <span className="text-sm font-semibold ml-2">— Guided Tour · Inget sparas på riktigt</span>
      </div>
      {children}
    </>
  );
}
