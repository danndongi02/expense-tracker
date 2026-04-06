"use client";

import { Category } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
}

export function CategoryList({ categories, onEdit }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No categories yet. Add one to get started.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <Card
          key={category.id}
          size="sm"
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => onEdit(category)}
        >
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{category.name}</p>
                {category.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {category.description}
                  </p>
                )}
              </div>
              <Badge
                variant={
                  category.status === "Active" ? "secondary" : "outline"
                }
              >
                {category.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
