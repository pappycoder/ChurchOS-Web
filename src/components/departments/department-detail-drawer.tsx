"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Building2, UserPlus, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberCombobox } from "@/components/members/member-combobox";
import { useDepartment, useAddDepartmentMember, useRemoveDepartmentMember } from "@/hooks/use-admin";
import { usePermissions } from "@/hooks/use-permissions";

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

interface DepartmentDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentId: string;
}

export function DepartmentDetailDrawer({
  open,
  onOpenChange,
  departmentId,
}: DepartmentDetailDrawerProps) {
  const { can } = usePermissions();
  const canUpdate = can("departments", "update");
  const { data: department, isLoading, error } = useDepartment(departmentId);
  const addMember = useAddDepartmentMember(departmentId);
  const removeMember = useRemoveDepartmentMember(departmentId);

  const [memberId, setMemberId] = React.useState("");
  const [selectedMemberName, setSelectedMemberName] = React.useState("");
  const [role, setRole] = React.useState("member");

  React.useEffect(() => {
    if (open) {
      setMemberId("");
      setSelectedMemberName("");
      setRole("member");
    }
  }, [open]);

  const handleAdd = () => {
    if (!memberId) return;
    addMember.mutate(
      { memberId, role: role || "member" },
      {
        onSuccess: () => {
          toast.success("Member added to department");
          setMemberId("");
          setSelectedMemberName("");
          setRole("member");
        },
        onError: (err) => {
          toast.error("Failed to add member", {
            description: err?.message || "Please try again.",
          });
        },
      }
    );
  };

  const handleRemove = (memberIdToRemove: string) => {
    removeMember.mutate(memberIdToRemove, {
      onSuccess: () => toast.success("Member removed from department"),
      onError: (err) => {
        toast.error("Failed to remove member", {
          description: err?.message || "Please try again.",
        });
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isLoading ? "Department" : department?.name}
          </SheetTitle>
        </SheetHeader>

        {error ? (
          <p className="text-sm text-red-600">Failed to load department.</p>
        ) : isLoading || !department ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section>
              <p className="text-sm font-medium mb-2">Details</p>
              <div className="rounded-lg border px-4 py-1">
                <InfoRow label="Description" value={department.description || "—"} />
                <InfoRow label="Members" value={department.memberCount} />
                <InfoRow label="Created" value={formatDate(department.createdAt)} />
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Members ({department.memberCount})</p>
              </div>
              <div className="rounded-lg border divide-y">
                {department.members.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No members assigned yet.
                  </p>
                ) : (
                  department.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                      </div>
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={removeMember.isPending}
                          onClick={() => handleRemove(m.memberId)}
                          aria-label={`Remove ${m.firstName} ${m.lastName}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {canUpdate && (
                <div className="mt-4 space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Add Member
                  </p>
                  <MemberCombobox
                    value={memberId}
                    onChange={(id, member) => {
                      setMemberId(id);
                      setSelectedMemberName(
                        member ? `${member.firstName} ${member.lastName}` : ""
                      );
                    }}
                    selectedName={selectedMemberName}
                    excludeIds={department.members.map((m) => m.memberId)}
                    placeholder="Select a member..."
                  />
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="leader">Leader</SelectItem>
                      <SelectItem value="assistant_leader">Assistant Leader</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={handleAdd} disabled={!memberId || addMember.isPending}>
                    {addMember.isPending ? "Adding..." : "Add to Department"}
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}