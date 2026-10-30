"use client";

import * as React from "react";
import { subscribePaperBrand } from "@/lib/paper-brand";

/** Mounted once in the Paper layout: keeps the live accent in sync across
 *  tabs, manual changes, and light/dark flips (the pre-paint script in the
 *  root layout covers first paint). */
export function PaperBrandSync() {
  React.useEffect(() => subscribePaperBrand(), []);
  return null;
}
