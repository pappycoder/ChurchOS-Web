"use client";
import { DetailManagementMenu } from "@/components/shared/detail-management-menu";
import {
  PeopleWorkspace,
  PeopleAvatar,
  PeopleArchivedBadge,
} from "@/components/members/people-presentation";
import { confirmDiscardChanges } from "@/hooks/use-unsaved-changes";

import { ErrorState } from "@/components/shared/error-state";

import * as React from "react";
import { PermissionLink as Link } from "@/components/shared/permission-link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Crown,
  UserPlus,
  UserMinus,
  Archive,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TableCard } from "@/components/shared/table-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useFamily,
  useArchiveFamily,
  useRestoreArchiveFamily,
  useDeleteFamily,
  type FamilyMemberInfo,
} from "@/hooks/use-families";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";
import { FamilyFormDialog } from "@/components/families/family-form-dialog";
import { DeleteFamilyDialog } from "@/components/families/delete-family-dialog";
import { AddFamilyMemberDialog } from "@/components/families/add-family-member-dialog";
import { RemoveFamilyMemberDialog } from "@/components/families/remove-family-member-dialog";

export default function FamilyDetailPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = React.use(params);
  const router = useRouter();
  const managementRef = React.useRef<HTMLButtonElement>(null);
  const { can } = usePermissions();
  const canUpdateFamilies = can("families", "update");
  const canDeleteFamilies = can("families", "delete");

  const { data: family, isLoading, error } = useFamily(familyId);
  const archiveMutation = useArchiveFamily();
  const restoreArchiveMutation = useRestoreArchiveFamily();
  const purgeMutation = useDeleteFamily();

  const [editOpen, setEditOpen] = React.useState(false);
  const restoreEditFocus = React.useRef(false);
  React.useEffect(() => {
    // Saving invalidates the family cache and can briefly remount the header.
    if (!editOpen && !isLoading && restoreEditFocus.current && managementRef.current) {
      managementRef.current.focus();
      restoreEditFocus.current = false;
    }
  }, [editOpen, isLoading]);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] =
    React.useState<FamilyMemberInfo | null>(null);
  const [archiveAction, setArchiveAction] =
    React.useState<ArchiveDialogKind | null>(null);

  // Optimistic display state so dialog edits reflect instantly.
  const [display, setDisplay] = React.useState<typeof family>(undefined);
  React.useEffect(() => {
    if (family) setDisplay(family);
  }, [family]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !display) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirmDiscardChanges()) router.push("/members/families");
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Families
        </Button>
        <ErrorState />
      </div>
    );
  }

  const head = display.members.find((m) => m.isHead);

  return (
    <PeopleWorkspace>
      <Button
        variant="ghost"
        onClick={() => {
          if (confirmDiscardChanges()) router.push("/members/families");
        }}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Families
      </Button>

      {/* Header card */}
      <Card data-people-profile className="overflow-hidden py-0">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-5">
          <div className="flex items-center gap-4 min-w-0">
            <PeopleAvatar
              id={display.familyId}
              name={display.name}
              className="size-14 rounded-2xl"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold tracking-tight [overflow-wrap:anywhere]">
                  {display.name}
                </h1>
                <Badge variant="secondary">
                  {display.members.length} member(s)
                </Badge>
                {head && (
                  <Badge variant="outline">
                    <Crown className="mr-1 h-3 w-3" />
                    Head: {head.firstName} {head.lastName}
                  </Badge>
                )}
                {display.archivedAt && <PeopleArchivedBadge />}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Created {format(new Date(display.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DetailManagementMenu
              label="Family management"
              triggerRef={managementRef}
              actions={[
                ...(display.archivedAt
                  ? [
                      ...(canUpdateFamilies
                        ? [
                            {
                              label: "Restore",
                              icon: RotateCcw,
                              onSelect: () => setArchiveAction("restore"),
                            },
                          ]
                        : []),
                      ...(canDeleteFamilies
                        ? [
                            {
                              label: "Delete Forever",
                              icon: Trash2,
                              destructive: true,
                              onSelect: () => setArchiveAction("purge"),
                            },
                          ]
                        : []),
                    ]
                  : [
                      ...(canUpdateFamilies
                        ? [
                            {
                              label: "Edit Family",
                              icon: Pencil,
                              onSelect: () => setEditOpen(true),
                            },
                            {
                              label: "Archive",
                              icon: Archive,
                              onSelect: () => setArchiveAction("archive"),
                            },
                          ]
                        : []),
                      ...(canDeleteFamilies
                        ? [
                            {
                              label: "Delete",
                              icon: Trash2,
                              destructive: true,
                              onSelect: () => setDeleteOpen(true),
                            },
                          ]
                        : []),
                    ]),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Family members */}
      <TableCard
        title="Family Members"
        description="Member records linked to this family."
        action={
          canUpdateFamilies && (
            <Button size="sm" onClick={() => setAddMemberOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )
        }
      >
        {display.members.length === 0 ? (
          <div className="py-8">
            <p className="text-center text-muted-foreground">
              No members have been linked to this family yet.
            </p>
            {canUpdateFamilies && (
              <div className="flex justify-center mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddMemberOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 pb-5 [&_th]:py-3.5 [&_td]:py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Role</TableHead>
                  {canUpdateFamilies && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {display.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Link
                        href={`/members/${member.memberId}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <PeopleAvatar
                          id={member.memberId}
                          name={`${member.firstName} ${member.lastName}`}
                        />
                        <span className="font-medium group-hover:underline truncate">
                          {member.firstName} {member.lastName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {member.relationship}
                    </TableCell>
                    <TableCell>
                      {member.isHead ? (
                        <Badge variant="default">
                          <Crown className="mr-1 h-3 w-3" />
                          Head
                        </Badge>
                      ) : (
                        <Badge variant="outline">Member</Badge>
                      )}
                    </TableCell>
                    {canUpdateFamilies && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRemoveTarget(member)}
                        >
                          <UserMinus className="h-4 w-4 mr-1.5" />
                          Remove
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TableCard>

      <FamilyFormDialog
        returnFocusRef={managementRef}
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) restoreEditFocus.current = true;
          setEditOpen(open);
        }}
        family={display}
      />
      <DeleteFamilyDialog
        returnFocusRef={managementRef}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        families={display ? [display] : []}
        onDeleted={() => router.push("/members/families")}
      />
      <AddFamilyMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        family={display}
      />
      <RemoveFamilyMemberDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        familyId={familyId}
        familyName={display.name}
        member={removeTarget}
      />
      <ArchiveConfirmDialog
        returnFocusRef={managementRef}
        open={!!archiveAction}
        onOpenChange={(open) => !open && setArchiveAction(null)}
        kind={archiveAction ?? "archive"}
        entityLabel="family"
        targetName={display.name}
        targetId={display.familyId}
        mutation={
          archiveAction === "archive"
            ? archiveMutation
            : archiveAction === "restore"
              ? restoreArchiveMutation
              : purgeMutation
        }
      />
    </PeopleWorkspace>
  );
}
