import React from "react";
import { cn } from "@/lib/utils";

const Skeleton = ({ className = "" }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/70 dark:bg-zinc-800/70",
        className
      )}
    />
  );
};

export { Skeleton };
