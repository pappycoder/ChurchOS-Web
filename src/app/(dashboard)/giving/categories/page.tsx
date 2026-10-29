"use client";

import { ErrorState } from "@/components/shared/error-state";
import * as React from "react";
import { getToastErrorMessage, toast } from "@/lib/toast";
import {
  AlertTriangle,
  MoreVertical,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Archive,
  RotateCcw,
  XCircle,
} from "lucide-react";
import {
  GivingWorkspace,
  GivingHeader,
  GivingStatusBadge,
  GivingMoreFilters,
  GivingFormSection,
  givingWorkspaceClass,
} from "@/components/giving/giving-presentation";
import { EmptyState } from "@/components/shared/empty-state";
import { TableCard } from "@/components/shared/table-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGivingCategories,
  useCreateGivingCategory,
  useUpdateGivingCategory,
  useDeleteGivingCategory,
  useArchiveGivingCategory,
  useRestoreArchiveGivingCategory,
  type GivingCategory,
} from "@/hooks/use-giving";
import { usePermissions } from "@/hooks/use-permissions";
import {
  ArchivedFilter,
  type ArchivedFilterValue,
} from "@/components/shared/archived-filter";
import {
  ArchiveConfirmDialog,
  type ArchiveDialogKind,
} from "@/components/shared/archive-confirm-dialog";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  isRecurring: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function GivingCategoriesPage() {
  const { canAny } = usePermissions();
  const canCreate = canAny("giving:categories:create");
  const canUpdate = canAny("giving:categories:update");
  const canDelete = canAny("giving:categories:delete");
  const canManage = canCreate || canUpdate || canDelete;

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);
  const [archivedFilter, setArchivedFilter] =
    React.useState<ArchivedFilterValue>("all");
  const archivedView = archivedFilter === "archived";
  const [archiveTarget, setArchiveTarget] = React.useState<{
    kind: ArchiveDialogKind;
    category: GivingCategory;
  } | null>(null);

  const queryParams = React.useMemo(
    () => ({
      page,
      limit: perPage,
      archived: archivedView ? true : undefined,
    }),
    [page, perPage, archivedView],
  );

  const { data, isLoading, error } = useGivingCategories(queryParams);
  const createMutation = useCreateGivingCategory();
  const updateMutation = useUpdateGivingCategory();
  const deleteMutation = useDeleteGivingCategory();
  const archiveMutation = useArchiveGivingCategory();
  const restoreArchiveMutation = useRestoreArchiveGivingCategory();

  const categories = data?.data ?? [];
  const meta = data?.meta;

  const actionTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GivingCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<GivingCategory | null>(
    null,
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      isRecurring: false,
    },
  });

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset({
        name: editing?.name ?? "",
        description: editing?.description ?? "",
        isActive: editing?.isActive ?? true,
        isRecurring: editing?.isRecurring ?? false,
      });
    }
  }, [dialogOpen, editing, form]);

  const onSubmit = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      isActive: values.isActive,
      isRecurring: values.isRecurring,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          categoryId: editing.categoryId,
          input: payload,
        });
        toast.success("Category updated");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Category created");
      }
      setDialogOpen(false);
    } catch (error) {
      // Backend enforces church-wide name uniqueness and permissions.
      toast.error(
        editing ? "Failed to update category" : "Failed to create category",
        {
          description: getToastErrorMessage(error, "Please try again."),
        },
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.categoryId);
      toast.success(`${deleteTarget.name} deactivated`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(`Failed to delete ${deleteTarget.name}`, {
        description: getToastErrorMessage(err, "Please try again."),
      });
      setDeleteTarget(null);
    }
  };

  if (error) {
    return (
      <div>
        <GivingHeader
          title="Categories"
          description="Giving categories are shared across all branches in your church. Each name must be unique."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Giving", href: "/giving" },
            { label: "Categories" },
          ]}
        />
        <ErrorState title="Failed to load giving categories." />
      </div>
    );
  }

  return (
    <GivingWorkspace>
      <GivingHeader
        count={meta?.total}
        title="Categories"
        description="Giving categories are shared across all branches in your church. Each name must be unique."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Giving", href: "/giving" },
          { label: "Categories" },
        ]}
        action={
          canCreate && (
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          )
        }
      />

      <TableCard
        title="Giving Categories"
        itemName="categories"
        page={page}
        perPage={perPage}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <GivingMoreFilters count={Number(archivedView)}>
              <ArchivedFilter
                value={archivedFilter}
                onChange={(value) => {
                  setArchivedFilter(value);
                  setPage(1);
                }}
              />
            </GivingMoreFilters>
          </div>
        }
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<Tags className="h-12 w-12" />}
              title={
                archivedView ? "No archived categories" : "No categories yet"
              }
              description={
                archivedView
                  ? "Archive a category to move it here."
                  : canCreate
                    ? "Create categories like Tithe, Offering or Seed to classify gifts."
                    : "No giving categories have been configured."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Recurring</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.categoryId}>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[280px] truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell>
                      {category.isRecurring ? (
                        <Badge variant="outline">Recurring</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <GivingStatusBadge
                        status={category.isActive ? "active" : "inactive"}
                      />
                    </TableCell>
                    {canManage && !archivedView && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10"
                              onFocus={(event) => {
                                actionTriggerRef.current = event.currentTarget;
                              }}
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(category);
                                  setDialogOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canUpdate && !category.archivedAt && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setArchiveTarget({
                                    kind: "archive",
                                    category,
                                  })
                                }
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                            {canDelete && !category.archivedAt && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget(category)}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                    {canManage && archivedView && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10"
                              aria-label={`Manage category ${category.name}`}
                              onFocus={(event) => {
                                actionTriggerRef.current = event.currentTarget;
                              }}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  setArchiveTarget({
                                    kind: "restore",
                                    category,
                                  })
                                }
                              >
                                <RotateCcw className="size-4" />
                                Restore
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() =>
                                  setArchiveTarget({ kind: "purge", category })
                                }
                              >
                                <Trash2 className="size-4" />
                                Delete Forever
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TableCard>

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={`${givingWorkspaceClass} sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl`}
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              Categories classify gifts — Tithe, Offering, Seed, Overall Total…
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <GivingFormSection title="Category details">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Building Fund" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </GivingFormSection>
              <GivingFormSection title="Availability">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <FormLabel>Supports recurring giving</FormLabel>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <FormLabel>Active</FormLabel>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Inactive categories are hidden from new records.
                          </p>
                        </div>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </GivingFormSection>
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">
              Deactivate Category
            </DialogTitle>
            <DialogDescription className="text-center">
              Deactivate{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? It will be hidden from new records but its history stays intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive / Restore / Delete Forever confirmation */}
      <ArchiveConfirmDialog
        returnFocusRef={actionTriggerRef}
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        kind={archiveTarget?.kind ?? "archive"}
        entityLabel="category"
        targetName={archiveTarget?.category.name}
        targetId={archiveTarget?.category.categoryId ?? ""}
        mutation={
          archiveTarget?.kind === "restore"
            ? restoreArchiveMutation
            : archiveTarget?.kind === "archive"
              ? archiveMutation
              : deleteMutation
        }
      />
    </GivingWorkspace>
  );
}
