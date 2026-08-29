"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  useBranch,
  useArchiveBranch,
  useRestoreArchiveBranch,
  useDeleteBranch,
  type Branch,
} from "@/hooks/use-branches";
import { usePermissions } from "@/hooks/use-permissions";
import { ArchiveConfirmDialog, type ArchiveDialogKind } from "@/components/shared/archive-confirm-dialog";
import { BranchFormDialog } from "@/components/branches/branch-form-dialog";
import { DeleteBranchDialog } from "@/components/branches/delete-branch-dialog";

function DataRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div className="mt-0.5 text-muted-foreground">
        {icon ?? <Building2 className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm font-medium break-words">{value || "-"}</p>
      </div>
    </div>
  );
}

export default function BranchDetailPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = React.use(params);
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdateBranches = can("branches", "update");
  const canDeleteBranches = can("branches", "delete");
  const { data: branch, isLoading, error } = useBranch(branchId);
  const archiveMutation = useArchiveBranch();
  const restoreArchiveMutation = useRestoreArchiveBranch();
  const purgeMutation = useDeleteBranch();

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [archiveAction, setArchiveAction] = React.useState<ArchiveDialogKind | null>(null);
  const [savedBranch, setSavedBranch] = React.useState<Branch | null>(null);

  const display = savedBranch ?? branch ?? null;

  if (error) {
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/branches">Branches</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Not Found</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Branch not found.</p>
          <Button variant="outline" onClick={() => router.push("/admin/branches")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Branches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/branches")} aria-label="Back to branches">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/settings">Church Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/branches">Branches</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isLoading ? "Loading..." : display?.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 rounded-xl border">
                {display?.photoUrl && (
                  <AvatarImage src={display.photoUrl} alt={display.name} className="rounded-xl object-cover" />
                )}
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-medium">
                  <Building2 className="h-7 w-7" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold">{display?.name}</h2>
                  {display?.isHeadquarters && (
                    <Badge variant="secondary">Headquarters</Badge>
                  )}
                  {display?.archivedAt && (
                    <Badge variant="destructive">
                      <Archive className="mr-1 h-3 w-3" />
                      Archived
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {[display?.city, display?.state].filter(Boolean).join(", ") ||
                    "No location set"}
                </p>
              </div>
            </div>
            {(canUpdateBranches || canDeleteBranches) && display && (
              <div className="flex items-center gap-2">
                {display.archivedAt ? (
                  <>
                    {canUpdateBranches && (
                      <Button
                        variant="outline"
                        onClick={() => setArchiveAction("restore")}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    )}
                    {canDeleteBranches && (
                      <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setArchiveAction("purge")}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Forever
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {canDeleteBranches && (
                      <>
                        <Button
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteOpen(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setArchiveAction("archive")}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </Button>
                      </>
                    )}
                    {canUpdateBranches && (
                      <Button onClick={() => setEditOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Branch
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-2">Contact Information</h3>
              <DataRow icon={<Phone className="h-4 w-4" />} label="Phone" value={display?.phone} />
              <DataRow icon={<Mail className="h-4 w-4" />} label="Email" value={display?.email} />
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-2">Location</h3>
              <DataRow icon={<MapPin className="h-4 w-4" />} label="Address" value={display?.address} />
              <DataRow icon={<MapPin className="h-4 w-4" />} label="City" value={display?.city} />
              <DataRow icon={<MapPin className="h-4 w-4" />} label="State" value={display?.state} />
              <DataRow icon={<MapPin className="h-4 w-4" />} label="Country" value={display?.country} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-2">Membership</h3>
              <DataRow
                icon={<Users className="h-4 w-4" />}
                label="Members Assigned"
                value={`${display?.memberCount ?? 0} member${(display?.memberCount ?? 0) === 1 ? "" : "s"}`}
              />
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-sm font-semibold mb-2">Record Details</h3>
              <DataRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Created"
                value={display ? format(new Date(display.createdAt), "MMM d, yyyy 'at' h:mm a") : undefined}
              />
              <DataRow
                icon={<CalendarDays className="h-4 w-4" />}
                label="Last Updated"
                value={display ? format(new Date(display.updatedAt), "MMM d, yyyy 'at' h:mm a") : undefined}
              />
            </div>
          </div>
        </>
      )}

      {display && (
        <BranchFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setSavedBranch(null);
          }}
          branch={display}
          onSaved={(updated) => setSavedBranch(updated)}
        />
      )}

      {display && (
        <DeleteBranchDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          branches={[display]}
          onDeleted={() => router.push("/admin/branches")}
        />
      )}

      <ArchiveConfirmDialog
        open={!!archiveAction}
        onOpenChange={(open) => !open && setArchiveAction(null)}
        kind={archiveAction ?? "archive"}
        entityLabel="branch"
        targetName={display?.name ?? null}
        targetId={display?.branchId ?? ""}
        mutation={
          archiveAction === "archive"
            ? archiveMutation
            : archiveAction === "restore"
              ? restoreArchiveMutation
              : purgeMutation
        }
        onConfirmed={
          archiveAction === "purge" ? () => router.push("/admin/branches") : undefined
        }
      />
    </div>
  );
}
