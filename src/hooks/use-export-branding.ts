"use client";

import { useQueryClient } from "@tanstack/react-query";
import { fetchCurrentProfile } from "@/hooks/use-profile";
import type { ChurchProfile } from "@/hooks/use-church";
import type { ExportBranding } from "@/lib/export-branding";

/** Reuses the current session's cache, with no church-settings permission requirement. */
export function useExportBranding() {
  const client = useQueryClient();
  return async (): Promise<ExportBranding | undefined> => {
    const profile = await client.fetchQuery({ queryKey: ["current-profile"], queryFn: fetchCurrentProfile, staleTime: 60_000 });
    if (!profile.church) return;
    const settings = client.getQueryData<ChurchProfile>(["church"]);
    const church = settings?.churchId === profile.churchId ? settings : profile.church;
    return { churchName: church.name, logoUrl: church.logoUrl };
  };
}
