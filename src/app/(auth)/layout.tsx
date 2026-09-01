"use client";

import "./auth.css";

import { motion, useReducedMotion } from "motion/react";
import { Users, BarChart3, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  const features = [
    {
      Icon: Users,
      title: "Connect Members",
      desc: "Build stronger community bonds",
    },
    {
      Icon: BarChart3,
      title: "Track Growth",
      desc: "Real-time insights and analytics",
    },
    {
      Icon: Sparkles,
      title: "Streamline Operations",
      desc: "Automate ministry workflows",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="w-full overflow-hidden h-screen">
        <div className="flex w-full h-full">
          {/* Left: Premium Illustration Panel */}
          <div className="hidden lg:flex lg:w-5/12">
            <div className="auth-left-panel relative flex items-center justify-center overflow-hidden h-full w-full">
              {/* Floating gradient blobs */}
              {!reduceMotion && (
                <>
                  <motion.div
                    className="auth-blob auth-blob-1"
                    aria-hidden
                    animate={{ y: [0, -28, 0], x: [0, 12, 0] }}
                    transition={{
                      duration: 14,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="auth-blob auth-blob-2"
                    aria-hidden
                    animate={{ y: [0, 22, 0], x: [0, -14, 0] }}
                    transition={{
                      duration: 18,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="auth-blob auth-blob-3"
                    aria-hidden
                    animate={{ y: [0, -16, 0], x: [0, 10, 0] }}
                    transition={{
                      duration: 12,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </>
              )}

              {/* Content card */}
              <motion.div
                className="relative z-[2] w-full px-10 py-10"
                initial={reduceMotion ? false : { opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="auth-glass-card w-full">
                  {/* Large, prominent logo */}
                  <div className="mb-10 flex justify-center">
                    <motion.div
                      animate={!reduceMotion ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <BrandLogo tone="light" emblemClassName="h-28" />
                    </motion.div>
                  </div>

                  {/* Main heading */}
                  <h1
                    className="text-white font-bold text-center mb-6"
                    style={{ fontSize: "44px", lineHeight: 1.2 }}
                  >
                    Empower Your Church
                  </h1>

                  {/* Modern decorative elements with animated icons */}
                  <div className="my-10 space-y-6">
                    {features.map((item, idx) => {
                      const { Icon } = item;
                      return (
                        <motion.div
                          key={idx}
                          className="flex items-center gap-4 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all"
                          initial={reduceMotion ? {} : { opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 + 0.3 }}
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {item.title}
                            </p>
                            <p className="text-white/70 text-xs">{item.desc}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Tagline */}
                  <p
                    className="text-white/90 font-medium text-center mt-8"
                    style={{ fontSize: "16px" }}
                  >
                    Serving 500+ churches worldwide 🌍
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right: Form Panel */}
          <div className="w-full lg:w-7/12">
            <div className="flex justify-center items-center h-screen overflow-auto">
              <div className="w-full md:w-[58%] h-screen flex flex-col justify-between p-4 pb-0 mx-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
