"use client";
import { useRecordMeetingRoster } from "@/hooks/use-admin";
import {
  MemberAttendanceRoster,
  type RosterMember,
} from "@/components/attendance/member-attendance-roster";
export function MeetingAttendanceRoster({
  type,
  id,
  members,
  meetingDate,
  status,
  notes,
  loading,
  error,
  onRetry,
  onBusyChange,
}: {
  type: "department" | "cell_group";
  id: string;
  members: RosterMember[];
  meetingDate: string;
  status: string;
  notes?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const mutation = useRecordMeetingRoster(type, id);
  return (
    <MemberAttendanceRoster
      key={`${id}:${meetingDate}`}
      members={members}
      onBusyChange={onBusyChange}
      loading={loading}
      error={error}
      onRetry={onRetry}
      disabled={!meetingDate}
      onSubmit={(memberIds) =>
        mutation.mutateAsync({
          memberIds,
          meetingDate,
          status,
          notes: notes?.trim() || undefined,
        })
      }
    />
  );
}
