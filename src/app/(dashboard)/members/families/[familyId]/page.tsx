"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Crown,
  UserPlus,
  UserMinus,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useFamily } from "@/hooks/use-families";
import type { FamilyMemberInfo } from "@/hooks/use-families";
import { usePermissions } from "@/hooks/use-permissions";
import { FamilyFormDialog } from "@/components/families/family-form-dialog";
import { DeleteFamilyDialog } from "@/components/families/delete-family-dialog";
import { AddFamilyMemberDialog } from "@/components/families/add-family-member-dialog";
import { RemoveFamilyMemberDialog } from "@/components/families/remove-family-member-dialog";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return `${first}${last}`.toUpperCase() || "?";
}

export default function FamilyDetailPage({
  params,
}: {
  params: Promise<{ familyId: string }>;
}) {
  const { familyId } = React.use(params);
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdateFamilies = can("families", "update");
  const canDeleteFamilies = can("families", "delete");

  const { data: family, isLoading, error } = useFamily(familyId);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] =
    React.useState<FamilyMemberInfo | null>(null);

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
        <Button variant="ghost" onClick={() => router.push("/members/families")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Families
        </Button>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">Family not found.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const initials = getInitials(display.name);
  const head = display.members.find((m) => m.isHead);

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.push("/members/families")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Families
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-5">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold truncate">{display.name}</h1>
                <Badge variant="secondary">{display.members.length} member(s)</Badge>
                {head && (
                  <Badge variant="outline">
                    <Crown className="mr-1 h-3 w-3" />
                    Head: {head.firstName} {head.lastName}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Created {format(new Date(display.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          {(canUpdateFamilies || canDeleteFamilies) && (
            <div className="flex items-center gap-2 shrink-0">
              {canUpdateFamilies && (
                <Button variant="outline" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {canDeleteFamilies && (
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
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
                <Button variant="outline" size="sm" onClick={() => setAddMemberOpen(true)}>
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
                    {canUpdateFamilies && <TableHead className="text-right">Actions</TableHead>}
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
                          <Avatar size="sm">
                            <AvatarFallback>
                              {getInitials(`${member.firstName} ${member.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
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
        open={editOpen}
        onOpenChange={setEditOpen}
        family={display}
      />
      <DeleteFamilyDialog
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
    </div>
  );
}
