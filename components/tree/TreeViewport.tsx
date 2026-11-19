"use client";

import dynamic from "next/dynamic";
import type { TreeCanvasProps } from "./TreeCanvas";

const DynamicTreeCanvas = dynamic(() => import("./TreeCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#090D0B] text-[#F5F2EB]">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[#D4A359]/25 animate-ping" />
        <div className="h-9 w-9 rounded-full border-2 border-[#D4A359]/20 border-t-[#D4A359] animate-spin" />
      </div>
      <p className="mt-5 font-editorial text-2xl tracking-wide text-[#F5F2EB]">
        Roots &amp; Echoes
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#D4A359]/75">
        Awakening the Living Archive
      </p>
    </div>
  ),
});

export function TreeViewport(props: TreeCanvasProps) {
  return <DynamicTreeCanvas {...props} />;
}
