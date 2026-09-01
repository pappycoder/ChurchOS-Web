"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { fadeUp, staggerContainer } from "@/lib/auth-motion";
import { BrandLogo } from "@/components/shared/brand-logo";

interface AuthFormWrapperProps {
  heading: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthFormWrapper({
  heading,
  subtitle,
  children,
  footer,
}: AuthFormWrapperProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex h-full flex-col py-6"
    >
      {/* Logo at top */}
      <motion.div variants={fadeUp} className="mb-8 flex justify-center">
        <Link href="/" aria-label="ChurchOS home">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <BrandLogo emblemClassName="h-24" />
          </motion.div>
        </Link>
      </motion.div>

      {/* Form content in middle */}
      <div className="flex flex-1 flex-col justify-center">
        <motion.div variants={fadeUp} className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">{heading}</h2>
          <p className="mx-auto mt-1.5 text-sm text-muted-foreground">
            {subtitle}
          </p>
        </motion.div>
        <motion.div variants={fadeUp}>{children}</motion.div>
      </div>

      {/* Footer at bottom */}
      <motion.div variants={fadeUp} className="pt-8 pb-4 text-center">
        {footer ?? (
          <p className="text-sm text-muted-foreground">
            Copyright &copy; 2026 - ChurchOS
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
