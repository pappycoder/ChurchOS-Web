"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  User,
  HandCoins,
  CalendarCheck,
  StickyNote,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useMember,
  useMemberGivingHistory,
  useMemberAttendanceHistory,
  useAddMemberNote,
  type MemberStatus,
} from "@/hooks/use-members";
import { useBranchesList } from "@/hooks/use-branches";
import { usePermissions } from "@/hooks/use-permissions";
import { MemberFormDialog } from "@/components/members/member-form-dialog";
import { DeleteMemberDialog } from "@/components/members/delete-member-dialog";

const STATUS_BADGE: Record<MemberStatus, { variant: "default" | "secondary" | "destructive" | "outline"; dot: string }> = {
  active: { variant: "default", dot: "bg-green-500" },
  inactive: { variant: "secondary", dot: "bg-gray-400" },
  suspended: { variant: "destructive", dot: "bg-red-500" },
  transferred: { variant: "outline", dot: "bg-blue-500" },
};

function DataRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex items-center gap-2 w-40 shrink-0 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium break-words min-w-0">{value || "-"}</span>
    </div>
  );
}

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = React.use(params);
  const router = useRouter();
  const { can } = usePermissions();
  const canUpdateMembers = can("members", "update");
  const canDeleteMembers = can("members", "delete");

  const { data: member, isLoading, error } = useMember(memberId);
  const givingQuery = useMemberGivingHistory(memberId);
  const attendanceQuery = useMemberAttendanceHistory(memberId);
  const branchesQuery = useBranchesList({ limit: 100 });
  const addNoteMutation = useAddMemberNote(memberId);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState("");

  // Optimistic display state so dialog edits reflect instantly.
  const [display, setDisplay] = React.useState<typeof member>(undefined);
  React.useEffect(() => {
    if (member) setDisplay(member);
  }, [member]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !display) {
    return (
      <div>
        <Button variant="ghost" onClick={() => router.push("/members")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Members
        </Button>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">Member not found.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const branchName = display.branchId
    ? branchesQuery.data?.data.find((b) => b.branchId === display.branchId)?.name
    : undefined;
  const statusBadge = STATUS_BADGE[display.status as MemberStatus] ?? STATUS_BADGE.inactive;
  const initials = `${display.firstName.charAt(0)}${display.lastName.charAt(0)}`.toUpperCase();

  const handleAddNote = () => {
    const note = noteDraft.trim();
    if (!note) return;
    addNoteMutation.mutate(note, {
      onSuccess: () => {
        setNoteDraft("");
      },
    });
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ms-2"
        onClick={() => router.push("/members")}
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Members
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {display.photoUrl && (
                <AvatarImage src={display.photoUrl} alt={`${display.firstName} ${display.lastName}`} />
              )}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold">
                  {display.firstName} {display.lastName}
                </h2>
                <Badge variant={statusBadge.variant}>
                  <span className={`mr-1 h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
                  {display.status.charAt(0).toUpperCase() + display.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {[
                  branchName,
                  `Member since ${format(new Date(display.memberSince), "MMM yyyy")}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          {(canUpdateMembers || canDeleteMembers) && (
            <div className="flex items-center gap-2">
              {canDeleteMembers && display.status !== "inactive" && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              )}
              {canUpdateMembers && (
                <Button onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Member
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <DataRow icon={<Mail className="h-4 w-4" />} label="Email" value={display.email} />
            <DataRow icon={<Phone className="h-4 w-4" />} label="Phone" value={display.phone} />
            <DataRow icon={<Phone className="h-4 w-4" />} label="WhatsApp" value={display.whatsappNumber} />
            <DataRow icon={<User className="h-4 w-4" />} label="Gender" value={display.gender ? display.gender.charAt(0).toUpperCase() + display.gender.slice(1) : undefined} />
            <DataRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Date of Birth"
              value={display.dateOfBirth ? format(new Date(display.dateOfBirth), "MMM d, yyyy") : undefined}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Location & Membership</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <DataRow icon={<MapPin className="h-4 w-4" />} label="Address" value={display.address} />
            <DataRow icon={<MapPin className="h-4 w-4" />} label="City" value={display.city} />
            <DataRow icon={<MapPin className="h-4 w-4" />} label="State" value={display.state} />
            <DataRow icon={<User className="h-4 w-4" />} label="Branch" value={branchName} />
            <DataRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Member Since"
              value={format(new Date(display.memberSince), "MMMM d, yyyy")}
            />
          </CardContent>
        </Card>
      </div>

      {/* Giving history */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            Giving History
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {givingQuery.data?.data.length ?? 0} record(s)
          </span>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {givingQuery.isLoading ? (
            <div className="px-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (givingQuery.data?.data.length ?? 0) === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">No giving records yet.</p>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(givingQuery.data?.data ?? []).slice(0, 5).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tx.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.currency} {Number(tx.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status === "success" ? "default" : "secondary"}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance history */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Attendance History
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {attendanceQuery.data?.data.length ?? 0} check-in(s)
          </span>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          {attendanceQuery.isLoading ? (
            <div className="px-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (attendanceQuery.data?.data.length ?? 0) === 0 ? (
            <p className="px-6 text-sm text-muted-foreground">No attendance records yet.</p>
          ) : (
            <div className="overflow-x-auto px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Checked In</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(attendanceQuery.data?.data ?? []).slice(0, 5).map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">{rec.serviceName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(rec.checkInAt), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {rec.source}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin notes */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {display.notes && (
            <p className="text-sm whitespace-pre-wrap rounded-lg border bg-muted/40 p-3">
              {display.notes}
            </p>
          )}
          {canUpdateMembers && (
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Add an admin note for this member..."
                rows={2}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!noteDraft.trim() || addNoteMutation.isPending}
                >
                  {addNoteMutation.isPending ? "Saving..." : "Add Note"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MemberFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditOpen(false);
        }}
        member={display}
        onSaved={(saved) => setDisplay(saved)}
      />
      <DeleteMemberDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        members={[display]}
        onDeleted={() => router.push("/members")}
      />
    </div>
  );
}
