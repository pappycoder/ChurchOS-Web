"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  AlertTriangle,
  CalendarDays,
  KanbanSquare,
  Phone,
  User,
  GripVertical,
} from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useVisitorsList,
  useUpdateVisitor,
  FOLLOW_UP_STATUSES,
  type Visitor,
  type FollowUpStatus,
} from "@/hooks/use-visitors";
import { useUsers } from "@/hooks/use-users";
import { usePermissions } from "@/hooks/use-permissions";

interface BoardColumn {
  key: string;
  label: string;
  statuses: FollowUpStatus[];
}

const BOARD_COLUMNS: BoardColumn[] = [
  { key: "new", label: "New", statuses: ["new"] },
  { key: "contacted", label: "Contacted", statuses: ["contacted"] },
  { key: "follow_up_scheduled", label: "Scheduled", statuses: ["follow_up_scheduled"] },
  { key: "interested", label: "Interested", statuses: ["interested"] },
  { key: "closed", label: "Converted / Dropped", statuses: ["converted", "dropped_off"] },
];

const COLUMN_ACCENT: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-purple-500",
  follow_up_scheduled: "bg-amber-500",
  interested: "bg-green-500",
  closed: "bg-emerald-600",
};

/** Resolves the status a card takes when dropped into a column. */
function statusForColumn(column: BoardColumn, current: FollowUpStatus): FollowUpStatus {
  // Merged terminal column keeps an existing dropped_off, everything else lands converted.
  if (column.key === "closed") {
    return current === "dropped_off" ? "dropped_off" : "converted";
  }
  return column.statuses[0];
}

function daysSinceVisitLabel(visitor: Visitor): string {
  const days = Math.floor(
    (Date.now() - new Date(visitor.firstVisitDate).getTime()) / 86_400_000
  );
  if (days <= 0) return "First visit today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/** Pure presentational card body shared by board cards and the drag overlay. */
function CardBody({
  visitor,
  handle,
  footer,
  className = "",
}: {
  visitor: Visitor & { assigneeName?: string };
  /** Rendered at the end of the header row (the grip handle on live cards). */
  handle?: React.ReactNode;
  /** Rendered below the contact lines (the status dropdown on live cards). */
  footer?: React.ReactNode;
  className?: string;
}) {
  const isConverted =
    !!visitor.convertedMemberId ||
    visitor.followUpStatus === ("converted" as FollowUpStatus);
  return (
    <div
      className={`rounded-md border p-2.5 space-y-2 bg-background ${className}`}
    >
      <div className="flex items-start gap-1.5">
        <Avatar size="sm" className="shrink-0">
          <AvatarFallback className="text-xs">{`${visitor.firstName.charAt(0)}${(visitor.lastName ?? "").charAt(0)}`.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate leading-tight">
            {visitor.firstName}
            {visitor.lastName ? ` ${visitor.lastName}` : ""}
            {isConverted && (
              <Badge variant="secondary" className="ml-1.5 px-1 py-0 text-[10px]">
                Converted
              </Badge>
            )}
          </p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <CalendarDays className="h-3 w-3" />
            {format(new Date(visitor.firstVisitDate), "MMM d")} ·{" "}
            {daysSinceVisitLabel(visitor)}
          </p>
        </div>
        {handle}
      </div>
      {(visitor.phone || visitor.email) && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
          <Phone className="h-3 w-3 shrink-0" />
          {visitor.phone || visitor.email}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
        <User className="h-3 w-3 shrink-0" />
        {visitor.assigneeName ?? "Unassigned"}
      </p>
      {footer}
    </div>
  );
}

export default function FollowUpBoardPage() {
  const { can } = usePermissions();
  const canUpdateVisitors = can("visitors", "update");

  const { data, isLoading, error } = useVisitorsList({ limit: 200 });
  const usersQuery = useUsers({ limit: 100, status: "active" });

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");

  // Debounce the client-side filter.
  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Local display state so moves (dropdown or drag) are instant and revert on failure.
  const [visitors, setVisitors] = React.useState<Visitor[] | null>(null);
  React.useEffect(() => {
    if (data?.data) setVisitors(data.data);
  }, [data]);

  const updateMutation = useUpdateVisitor("");
  const [movingId, setMovingId] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const assigneeNames = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const u of usersQuery.data?.data ?? []) {
      map.set(u.profileId, `${u.firstName} ${u.lastName}`);
    }
    return map;
  }, [usersQuery.data]);

  // Small activation distance so card clicks and the status select still work;
  // PointerSensor covers mouse + touch + pen.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const moveVisitorToStatus = React.useCallback(
    (visitor: Visitor, nextStatus: FollowUpStatus) => {
      if (nextStatus === visitor.followUpStatus) return;

      setMovingId(visitor.id);
      // Optimistic move across the board.
      setVisitors(
        (prev) =>
          prev?.map((v) =>
            v.id === visitor.id ? { ...v, followUpStatus: nextStatus } : v
          ) ?? null
      );
      updateMutation.mutate(
        { followUpStatus: nextStatus },
        {
          onError: (err) => {
            // Re-sync from server cache on failure.
            if (data?.data) setVisitors(data.data);
            toast.error(`Failed to move ${visitor.firstName}`, {
              description: err?.message || "Please try again.",
            });
          },
          onSettled: () => setMovingId(null),
        }
      );
    },
    [updateMutation, data]
  );

  const handleSelectChange = (visitor: Visitor, status: string) => {
    moveVisitorToStatus(visitor, status as FollowUpStatus);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const column = BOARD_COLUMNS.find((c) => c.key === String(over.id));
    const visitor = (visitors ?? []).find((v) => v.id === String(active.id));
    if (!column || !visitor) return;
    moveVisitorToStatus(visitor, statusForColumn(column, visitor.followUpStatus));
  };

  const filtered = React.useMemo(() => {
    const rows = visitors ?? [];
    if (!search) return rows;
    return rows.filter((v) =>
      [v.firstName, v.lastName ?? "", v.email ?? "", v.phone ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [visitors, search]);

  const withAssignee = (rows: Visitor[]): Visitor[] =>
    rows.map((v) => ({
      ...v,
      assigneeName: v.assignedToId ? assigneeNames.get(v.assignedToId) : undefined,
    }));

  const activeVisitor =
    (activeId && (visitors ?? []).find((v) => v.id === activeId)) || null;

  if (error) {
    return (
      <div>
        <PageHeader
          title="Follow-Up"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Visitors", href: "/visitors" },
            { label: "Follow-Up" },
          ]}
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive">Failed to load the board.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Follow-Up"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Visitors", href: "/visitors" },
          { label: "Follow-Up" },
        ]}
        action={
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Filter by name, email, phone..."
            className="w-full sm:w-64"
          />
        }
      />

      <p className="text-sm text-muted-foreground">
        Track every visitor through the follow-up pipeline.
        {canUpdateVisitors &&
          " Drag cards by the grip handle between columns, or use each card's dropdown."}
      </p>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (visitors ?? []).length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="h-12 w-12" />}
          title="No visitors to follow up"
          description="Register visitors and they will appear here automatically."
        />
      ) : (
        <DndContext
          sensors={canUpdateVisitors ? sensors : []}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5 items-start">
            {BOARD_COLUMNS.map((column) => (
              <BoardColumnView
                key={column.key}
                column={column}
                cards={withAssignee(
                  filtered.filter((v) =>
                    column.statuses.includes(v.followUpStatus)
                  )
                )}
                dragActive={!!activeId}
                canUpdate={canUpdateVisitors}
                movingId={movingId}
                onSelectChange={handleSelectChange}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 180 }}>
            {activeVisitor ? (
              <CardBody
                visitor={withAssignee([activeVisitor])[0]}
                className="shadow-lg ring-2 ring-primary/40 rotate-2 cursor-grabbing"
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

/** Droppable column container. */
function BoardColumnView({
  column,
  cards,
  dragActive,
  canUpdate,
  movingId,
  onSelectChange,
}: {
  column: BoardColumn;
  cards: Visitor[];
  dragActive: boolean;
  canUpdate: boolean;
  movingId: string | null;
  onSelectChange: (visitor: Visitor, status: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
    disabled: !canUpdate,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border bg-card transition-colors ${
        isOver && dragActive
          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
          : ""
      }`}
    >
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 rounded-full shrink-0 ${COLUMN_ACCENT[column.key]}`} />
          <span className="text-sm font-semibold truncate">{column.label}</span>
        </div>
        <Badge variant="secondary">{cards.length}</Badge>
      </div>
      <div className="space-y-2 p-2 min-h-[80px] max-h-[60vh] overflow-y-auto">
        {cards.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No visitors</p>
        ) : (
          cards.map((visitor) => (
            <VisitorCardView
              key={visitor.id}
              visitor={visitor}
              canUpdate={canUpdate}
              isMoving={movingId === visitor.id}
              onSelectChange={onSelectChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

/** Draggable card — only the grip handle starts drags. */
function VisitorCardView({
  visitor,
  canUpdate,
  isMoving,
  onSelectChange,
}: {
  visitor: Visitor & { assigneeName?: string };
  canUpdate: boolean;
  isMoving: boolean;
  onSelectChange: (visitor: Visitor, status: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: visitor.id,
    disabled: !canUpdate || isMoving,
  });

  return (
    <div ref={setNodeRef}>
      <CardBody
        visitor={visitor}
        className={
          isDragging ? "opacity-30 border-dashed" : isMoving ? "opacity-60" : ""
        }
        handle={
          canUpdate ? (
            <span
              {...attributes}
              {...listeners}
              title="Drag to another column"
              aria-label={`Move ${visitor.firstName} to another column`}
              className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground shrink-0 -mr-0.5 -mt-0.5 p-1 rounded hover:bg-muted"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          ) : undefined
        }
        footer={
          canUpdate ? (
            <Select
              value={visitor.followUpStatus}
              onValueChange={(status) => onSelectChange(visitor, status)}
              disabled={isMoving}
            >
              <SelectTrigger className="w-full h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLLOW_UP_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
      />
    </div>
  );
}
