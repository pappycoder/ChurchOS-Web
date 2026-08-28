"use client";

import * as React from "react";
import { format } from "date-fns";
import { parseISO } from "date-fns";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/pastoral/confirm-delete-dialog";
import { TableCard } from "@/components/shared/table-card";
import { toast } from "sonner";
import { CategoryFormDialog } from "@/components/assets/category-form-dialog";
import {
  useAssetCategories,
  useDeleteAssetCategory,
  type AssetCategory,
} from "@/hooks/use-assets";

export default function AssetCategoriesPage() {
  const { can } = usePermissions();
  const canCreate = can("assets", "create");
  const canUpdate = can("assets", "update");
  const canDelete = can("assets", "delete");

  const { data: categories, isLoading, error } = useAssetCategories();
  const deleteMutation = useDeleteAssetCategory();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [editCategory, setEditCategory] = React.useState<AssetCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AssetCategory | null>(null);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  const allCategories = React.useMemo(() => categories ?? [], [categories]);
  const pagedCategories = React.useMemo(
    () => allCategories.slice((page - 1) * perPage, page * perPage),
    [allCategories, page, perPage]
  );

  const canManage = canCreate || canUpdate || canDelete;

  return (
    <div>
      <PageHeader
        title="Asset Categories"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Operations", href: "/assets" },
          { label: "Categories" },
        ]}
        action={
          canCreate ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          ) : undefined
        }
      />

      <TableCard
        title={
          <span className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Categories
          </span>
        }
        itemName="categories"
        page={page}
        perPage={perPage}
        total={allCategories.length}
        onPageChange={setPage}
        onPerPageChange={(size) => {
          setPerPage(size);
          setPage(1);
        }}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-destructive">Failed to load categories.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={canManage ? 4 : 3}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : allCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManage ? 4 : 3} className="h-32 text-center">
                    <p className="text-muted-foreground">
                      No categories yet. Add one to group your assets.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                pagedCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description ? (
                        <span className="max-w-md truncate block">{category.description}</span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          return format(parseISO(category.createdAt), "dd MMM yyyy");
                        } catch {
                          return category.createdAt;
                        }
                      })()}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Edit"
                              onClick={() => setEditCategory(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete"
                              onClick={() => setDeleteTarget(category)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableCard>

      <CategoryFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSaved={() => setCreateDialogOpen(false)}
      />
      <CategoryFormDialog
        open={!!editCategory}
        onOpenChange={(open) => {
          if (!open) setEditCategory(null);
        }}
        category={editCategory}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Category"
        description={`This will permanently delete the category "${deleteTarget?.name}". Assets in it will need reassignment.`}
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success("Category deleted successfully");
              setDeleteTarget(null);
            },
            onError: (err) => {
              toast.error("Failed to delete category", {
                description: err?.message || "Please try again.",
              });
            },
          });
        }}
      />
    </div>
  );
}