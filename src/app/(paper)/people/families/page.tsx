"use client";

import * as React from "react";
import Link from "next/link";
import {
  Crown,
  Home,
  Plus,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { fetchAllPages, listUrl } from "@/lib/export-all";
import type { ExportColumn } from "@/lib/export-utils";
import { PageHeader } from "@/components/paper/section";
import { StatCard, Tag } from "@/components/paper/stat";
import {
  AvatarStack,
  DataList,
  EmptyState,
  FieldRow,
  FilterChip,
  PersonAvatar,
  SearchField,
} from "@/components/paper/primitives";
import { StaggerGroup, StaggerItem } from "@/components/paper/motion/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportDropdown } from "@/components/shared/export-dropdown";
import { FamilyFormDialog } from "@/components/families/family-form-dialog";
import { DeleteFamilyDialog } from "@/components/families/delete-family-dialog";
import { useInspector } from "@/components/paper/shell/inspector-provider";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentProfile } from "@/hooks/use-profile";
import {
  useFamiliesList,
  useArchiveFamily,
  useRestoreArchiveFamily,
  type Family,
} from "@/hooks/use-families";

const PAGE_SIZE = 15;

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "name", label: "Family" },
  { key: "head", label: "Head of Household" },
  { key: "members", label: "Members" },
  { key: "created", label: "Created" },
];

function toExportRows(families: Family[]): Record<string, unknown>[] {
  return families.map((family) => {
    const head = family.members.find((m) => m.isHead);
    return {
      name: family.name,
      head: head ? `${head.firstName} ${head.lastName}` : "",
      members: family.members.map((m) => `${m.firstName} ${m.lastName}`).join("; "),
      created: family.createdAt?.slice(0, 10) ?? "",
    };
  });
}

export default function FamiliesPage() {
  const { open, close } = useInspector();
  const { can, ready } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const canUpdate = ready && can("families", "update");
  const canCreate = ready && can("families", "create");
  const canDelete = ready && can("families", "delete");
  const isHq = !!profile?.isAdminHq;

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [archivedView, setArchivedView] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Family | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Family[] | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = React.useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      archived: archivedView ? true : undefined,
    }),
    [page, search, archivedView],
  );

  const list = useFamiliesList(params);
  const archive = useArchiveFamily();
  const restoreArchive = useRestoreArchiveFamily();

  const families = list.data?.data ?? [];
  const total = list.data?.meta?.total ?? 0;
  const totalPages = Math.max(1, list.data?.meta?.totalPages ?? 1);
  const people = families.reduce((sum, f) => sum + f.members.length, 0);

  const peek = (family: Family) =>
    open({
      eyebrow: "Household",
      title: family.name,
      subtitle: `${family.members.length} ${family.members.length === 1 ? "person" : "people"}`,
      content: (
        <div className="space-y-5">
          <div>
            <p className="rule-label mb-2">Members</p>
            <div className="space-y-1.5">
              {family.members.map((member) => (
                <Link
                  key={member.id}
                  href={`/people/members/${member.memberId}`}
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-lg border border-line bg-card px-3 py-2 transition-colors hover:border-ink/20"
                >
                  <PersonAvatar name={`${member.firstName} ${member.lastName}`} size="xs" />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                    {member.firstName} {member.lastName}
                  </span>
                  {member.isHead ? (
                    <span className="flex items-center gap-1 text-[9px] text-gold">
                      <Crown className="size-2.5" /> head
                    </span>
                  ) : (
                    <span className="text-[9px] capitalize text-ink-faint">{member.relationship}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          <DataList>
            <FieldRow label="Created">{family.createdAt?.slice(0, 10) ?? "—"}</FieldRow>
            {family.archivedAt ? <FieldRow label="Archived">{family.archivedAt.slice(0, 10)}</FieldRow> : null}
          </DataList>
          {canUpdate ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-lg border-line text-xs"
                onClick={() => {
                  close();
                  setEditTarget(family);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-3.5 rotate-45" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 rounded-lg border-line text-xs"
                onClick={() =>
                  family.archivedAt
                    ? restoreArchive.mutate(family.familyId, { onSuccess: () => toast(`${family.name} restored.`) })
                    : archive.mutate(family.familyId, { onSuccess: () => toast(`${family.name} archived.`) })
                }
              >
                {family.archivedAt ? "Unarchive" : "Archive"}
              </Button>
            </div>
          ) : null}
          {canDelete && !family.archivedAt ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-lg border-line text-xs text-destructive"
              onClick={() => {
                close();
                setDeleteTarget([family]);
              }}
            >
              Delete household
            </Button>
          ) : null}
        </div>
      ),
    });

  const fetchAllExportRows = React.useCallback(async () => {
    const rows = await fetchAllPages<Family>((p) =>
      api.get(listUrl("/families", { ...params, page: p, limit: 100 })),
    );
    return toExportRows(rows);
  }, [params]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People · Families"
        title="Households, not just individuals."
        description="Care follows families — the whole story of who lives where and how they're doing."
        actions={
          <>
            <ExportDropdown
              tableId="families"
              columns={EXPORT_COLUMNS}
              data={toExportRows(families)}
              title="Families"
              filename="families-export"
              disabled={!families.length}
              fetchAllRows={canDelete || canUpdate ? fetchAllExportRows : undefined}
            />
            {canCreate ? (
              <Button className="h-9 gap-1.5 rounded-full text-xs" onClick={() => { setEditTarget(null); setFormOpen(true); }}>
                <UserRoundPlus className="size-3.5" /> New household
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Households" value={total} tone="terracotta" icon={<Home className="size-4" />} deltaLabel={archivedView ? "archived" : "matching filters"} />
        <StatCard label="People on this page" value={people} tone="moss" icon={<Users className="size-4" />} />
        <StatCard label="Average size" value={families.length ? Math.round((people / families.length) * 10) / 10 : 0} decimals={1} tone="sky" />
        <StatCard label="Page" value={page} suffix={` / ${totalPages}`} tone="gold" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchField value={searchInput} onChange={setSearchInput} placeholder="Search households…" className="w-full max-w-xs" />
        <FilterChip active={archivedView} onClick={() => { setArchivedView((v) => !v); setPage(1); }}>
          Archived
        </FilterChip>
        {isHq ? <span className="ml-auto text-[10px] text-ink-faint">Across all branches</span> : <span className="ml-auto text-[10px] text-ink-faint">{profile?.branch?.name ?? "Your branch"}</span>}
      </div>

      {list.isError ? (
        <EmptyState icon={<Home />} title="Couldn't load the households" description="The register didn't answer." action={<Button variant="outline" size="sm" className="rounded-full border-line text-xs" onClick={() => list.refetch()}>Retry</Button>} />
      ) : list.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : families.length === 0 ? (
        <EmptyState
          icon={<Home />}
          title="No households yet"
          description="Families link people who share a home — care and giving read better together."
          action={canCreate ? <Button size="sm" variant="outline" className="rounded-full border-line text-xs" onClick={() => { setEditTarget(null); setFormOpen(true); }}>Start one</Button> : undefined}
        />
      ) : (
        <StaggerGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => {
            const head = family.members.find((m) => m.isHead);
            return (
              <StaggerItem key={family.familyId}>
                <button type="button" onClick={() => peek(family)} className="paper-card lift w-full rounded-2xl p-4 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold">{family.name}</p>
                      {head ? (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-ink-faint">
                          <Crown className="size-3 shrink-0 text-gold" /> {head.firstName} {head.lastName}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-ink-faint">No head assigned</p>
                      )}
                    </div>
                    <AvatarStack people={family.members.map((m) => ({ name: `${m.firstName} ${m.lastName}` }))} size="xs" max={4} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-[11px]">
                    <span className="text-ink-soft">{family.members.length} people</span>
                    <span className="flex items-center gap-1.5 text-ink-faint">
                      {family.archivedAt ? <Tag tone="neutral">Archived</Tag> : null}
                      <span className="num">{family.createdAt?.slice(0, 10)}</span>
                    </span>
                  </div>
                </button>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}

      {families.length ? (
        <div className="paper-card flex items-center justify-between rounded-2xl px-5 py-2.5 text-[11px] text-ink-faint">
          <span>
            Showing <span className="num font-medium text-ink">{(page - 1) * PAGE_SIZE + 1}–{Math.min(total, page * PAGE_SIZE)}</span> of <span className="num font-medium text-ink">{total}</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border-line bg-card">Prev</Button>
            <span className="num">{page} / {totalPages}</span>
            <Button variant="outline" size="xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-full border-line bg-card">Next</Button>
          </div>
        </div>
      ) : null}

      <FamilyFormDialog open={formOpen} onOpenChange={setFormOpen} family={editTarget} />
      <DeleteFamilyDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)} families={deleteTarget ?? []} />
    </div>
  );
}
