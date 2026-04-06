"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { useCategories } from "@/lib/hooks/use-categories";
import { Category } from "@/lib/types";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { CategoryDetailSheet } from "@/components/categories/category-detail-sheet";
import { deleteCategory } from "@/lib/services/categories.service";

export default function CategoriesPage() {
  const { user } = useAuth();
  const { categories, loading } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);

  async function handleConfirmDelete() {
    if (!user || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCategory(user.uid, deleteTarget.id);
      toast.success("Category deleted successfully");
      setDeleteTarget(null);
      setFormOpen(false);
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  }

  const expenseCategories = categories.filter(
    (c) => c.transactionType === "Expense"
  );
  const incomeCategories = categories.filter(
    (c) => c.transactionType === "Income"
  );

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setFormOpen(true);
  }

  function handleAdd() {
    setEditingCategory(undefined);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setEditingCategory(undefined);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
      </div>

      {loading ? (
        <CategoriesSkeleton />
      ) : (
        <div className="grid gap-8 md:grid-cols-2">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Expense Categories
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdd()}
              >
                <PlusIcon data-icon="inline-start" />
                Add
              </Button>
            </div>
            <CategoryList
              categories={expenseCategories}
              onEdit={setDetailCategory}
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Income Categories
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdd()}
              >
                <PlusIcon data-icon="inline-start" />
                Add
              </Button>
            </div>
            <CategoryList
              categories={incomeCategories}
              onEdit={setDetailCategory}
            />
          </section>
        </div>
      )}

      <CategoryForm
        open={formOpen}
        onOpenChange={handleFormClose}
        category={editingCategory}
        onDelete={(cat) => {
          setFormOpen(false);
          setDeleteTarget(cat);
        }}
        key={editingCategory?.id ?? "new"}
      />

      <ConfirmActionDialog
        open={!!deleteTarget}
        title="Delete Category"
        description="Are you sure you want to delete this category?"
        warningText="Transactions using this category will lose their category assignment."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <CategoryDetailSheet
        category={detailCategory}
        open={!!detailCategory}
        onOpenChange={(open) => { if (!open) setDetailCategory(null); }}
        onEdit={handleEdit}
      />
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {[1, 2].map((col) => (
        <div key={col} className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-7 w-16 rounded-lg" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
