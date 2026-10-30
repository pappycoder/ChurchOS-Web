"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, Plus, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/paper/section";
import { StatCard, Tag } from "@/components/paper/stat";
import { EmptyState, FilterChip } from "@/components/paper/primitives";
import { StaggerGroup, StaggerItem } from "@/components/paper/motion/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateRoleDialog } from "@/components/roles/create-role-dialog";
import { useCurrentProfile } from "@/hooks/use-profile";
import {
  useRolesSummary,
  useAllPermissions,
  ROLE_ORDER,
  sortRolesByOrder,
  getRoleLabel,
  type RoleWithPermissions,
} from "@/hooks/use-roles";
import { number } from "@/lib/paper/format";

export default function AdminRolesPage() {
  const router = useRouter();
  const { data: profile } = useCurrentProfile();
  const canCreateRole = !!profile?.role?.some((r) => r === "church_admin" || r === "super_admin");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [onlyCustom, setOnlyCustom] = React.useState(false);

  const roles = useRolesSummary();
  const permissions = useAllPermissions();
  const all = React.useMemo(() => roles.data?.roles ?? [], [roles.data]);
  const rows = React.useMemo(() => {
    const ordered = sortRolesByOrder(all);
    return onlyCustom ? ordered.filter((r) => r.isChurchOwned || r.isCustomized) : ordered;
  }, [all, onlyCustom]);
  const totalPermissions = permissions.data?.length ?? 0;

  const statusBadge = (role: RoleWithPermissions) => {
    if (role.roleName === "super_admin") return <Tag tone="neutral" dot>Locked</Tag>;
    if (role.isChurchOwned) return <Tag tone="sky" dot>Custom</Tag>;
    if (role.isCustomized) return <Tag tone="gold" dot>Customized</Tag>;
    return <Tag tone="moss" dot>Default</Tag>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Roles"
        title="What each role can reach."
        description="Permissions are the walls; roles are the rooms. Open a role to edit its matrix."
        actions={
          <>
            <Button asChild variant="outline" className="h-9 gap-1.5 rounded-full border-line bg-card text-xs">
              <Link href="/admin/team">
                <ShieldCheck className="size-3.5" /> Team
              </Link>
            </Button>
            {canCreateRole ? (
              <Button className="h-9 gap-1.5 rounded-full text-xs" onClick={() => setCreateOpen(true)}>
                <Plus className="size-3.5" /> Add role
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Roles" value={all.length} tone="brand" icon={<KeyRound className="size-4" />} />
        <StatCard label="Custom to this church" value={all.filter((r) => r.isChurchOwned).length} tone="sky" />
        <StatCard label="Tweaked templates" value={all.filter((r) => r.isCustomized).length} tone="gold" />
        <StatCard label="Permissions available" value={totalPermissions} tone="moss" deltaLabel="across all surfaces" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={!onlyCustom} onClick={() => setOnlyCustom(false)}>All roles</FilterChip>
        <FilterChip active={onlyCustom} onClick={() => setOnlyCustom(true)}>Custom & tweaked</FilterChip>
      </div>

      {roles.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<KeyRound />} title="No roles to show" description="Every workspace starts with the built-in set — custom ones appear here once created." />
      ) : (
        <StaggerGroup className="paper-card divide-y divide-line/70 overflow-hidden rounded-2xl">
          {rows.map((role) => {
            const label = role.label || getRoleLabel(role.roleName);
            const inOrder = ROLE_ORDER.includes(role.roleName as (typeof ROLE_ORDER)[number]);
            return (
              <StaggerItem key={role.roleName}>
                <button
                  type="button"
                  onClick={() => router.push(`/admin/permissions/${role.roleName}`)}
                  className="group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    {role.roleName === "super_admin" || role.roleName === "church_admin" ? <Lock className="size-3.5" /> : <SlidersHorizontal className="size-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-xs font-semibold">{label}</span>
                      {statusBadge(role)}
                      {!inOrder ? <Tag tone="neutral">new-style</Tag> : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-ink-faint">{role.description || "No description yet."}</span>
                  </span>
                  <span className="num hidden shrink-0 text-right text-[11px] text-ink-soft sm:block">
                    {number(role.permissions.length)}
                    <span className="text-ink-faint"> / {number(totalPermissions || role.permissions.length)}</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-brand opacity-0 transition-opacity group-hover:opacity-100">
                    {role.roleName === "super_admin" ? "View" : "Edit matrix"}
                  </span>
                </button>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}

      <div className="rounded-2xl border border-dashed border-line p-5 text-[11px] leading-relaxed text-ink-soft">
        <p className="mb-1 font-display text-xs font-semibold text-ink">How editing works</p>
        Template roles are additive — ticks grant extras for this church; global defaults can&apos;t be revoked from here.
        Church-owned roles edit their own full set, revocations included. The matrix editor opens in the classic
        surface while the Paper version matures.
      </div>

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(name) => router.push(`/admin/permissions/${name}`)} />
    </div>
  );
}
