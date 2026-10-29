"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";

const loadFeatures = () => import("./workspace-motion-features").then(module => module.default);

/** No route key: navigation must not remount editors or reset retained views. */
export function WorkspaceMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ duration: 0.18, ease: "easeOut" }}>
    <LazyMotion features={loadFeatures} strict>
      <m.div className="workspace-content" initial={false} animate={{ opacity: 1 }}>{children}</m.div>
    </LazyMotion>
  </MotionConfig>;
}
