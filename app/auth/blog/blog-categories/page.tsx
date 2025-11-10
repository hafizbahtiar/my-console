"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID, BLOG_CATEGORIES_COLLECTION_ID } from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  CategoriesTable,
  CreateCategoryDialog,
  EditCategoryDialog,
  DeleteCategoryDialog,
  calculatePostCounts,
  generateSlug,
  generateUniqueSlug,
  type BlogCategory,
} from "@/components/app/auth/blog/blog-categories";

export default function BlogCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, loading: translationLoading } = useTranslation();
  const router = useRouter();

  // State
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [allCategories, setAllCategories] = useState<BlogCategory[]>([]); // Store all categories for pagination
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BlogCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    isActive: true,
    sortOrder: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to finish loading before proceeding
      if (authLoading) {
        return;
      }

      // If auth finished loading and no user, don't redirect, just set loading to false
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        await loadCategories();
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(t('blog_categories_page.failed_to_load'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, currentPage, pageSize, t]);

  const loadCategories = async () => {
    try {
      setIsRefreshing(true);
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_CATEGORIES_COLLECTION_ID
      });

      // Load categories without stored postCount
      const categoriesData = response.rows.map((row: any) => ({
        ...row,
        // postCount will be calculated dynamically
      }));

      // Calculate post counts using relationships
      const categoriesWithCounts = await calculatePostCounts(categoriesData as BlogCategory[]);

      // Sort by sortOrder, then by creation date
      const sortedCategories = categoriesWithCounts.sort((a: BlogCategory, b: BlogCategory) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
      });

      setAllCategories(sortedCategories);

      // Apply pagination
      const paginationParams = createPaginationParams(currentPage, pageSize);
      const paginatedCategories = sortedCategories.slice(
        paginationParams.offset || 0,
        (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
      );

      setCategories(paginatedCategories);
      setError(null);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError(t('blog_categories_page.failed_to_load'));
      toast.error(t('blog_categories_page.failed_to_load'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error(t('blog_categories_page.category_name_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure slug is unique before creating
      const baseSlug = generateSlug(formData.name);
      const uniqueSlug = generateUniqueSlug(baseSlug, allCategories);

      const newCategory = {
        name: formData.name.trim(),
        slug: uniqueSlug,
        description: formData.description.trim(),
        color: formData.color,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };

      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_CATEGORIES_COLLECTION_ID,
        rowId: `category_${Date.now()}`,
        data: newCategory,
      });

      // Log audit event
      await auditLogger.log({
        action: 'BLOG_CATEGORY_CREATED',
        resource: 'blog_categories',
        resourceId: `category_${Date.now()}`,
        userId: user?.$id || '',
        metadata: {
          categoryName: newCategory.name,
          categorySlug: uniqueSlug,
          description: `Created blog category: ${newCategory.name}`
        }
      });

      toast.success(t('blog_categories_page.category_created_success'));
      setCreateDialogOpen(false);
      resetForm();
      await loadCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      toast.error(t('blog_categories_page.category_name_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure slug is unique before updating (exclude current category)
      const baseSlug = generateSlug(formData.name);
      const uniqueSlug = generateUniqueSlug(baseSlug, allCategories, selectedCategory.$id);

      const updatedCategory = {
        name: formData.name.trim(),
        slug: uniqueSlug,
        description: formData.description.trim(),
        color: formData.color,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      };

      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_CATEGORIES_COLLECTION_ID,
        rowId: selectedCategory.$id,
        data: updatedCategory,
      });

      // Log audit event
      await auditLogger.log({
        action: 'BLOG_CATEGORY_UPDATED',
        resource: 'blog_categories',
        resourceId: selectedCategory.$id,
        userId: user?.$id || '',
        oldValues: {
          name: selectedCategory.name,
          slug: selectedCategory.slug,
          description: selectedCategory.description,
          color: selectedCategory.color,
          isActive: selectedCategory.isActive,
          sortOrder: selectedCategory.sortOrder,
        },
        newValues: updatedCategory,
        metadata: {
          categoryName: updatedCategory.name,
          categorySlug: uniqueSlug,
          description: `Updated blog category: ${updatedCategory.name}`
        }
      });

      toast.success(t('blog_categories_page.category_updated_success'));
      setEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
      await loadCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_CATEGORIES_COLLECTION_ID,
        rowId: categoryToDelete.$id,
      });

      // Log audit event
      await auditLogger.log({
        action: 'BLOG_CATEGORY_DELETED',
        resource: 'blog_categories',
        resourceId: categoryToDelete.$id,
        userId: user?.$id || '',
        metadata: {
          categoryName: categoryToDelete.name,
          categorySlug: categoryToDelete.slug,
          description: `Deleted blog category: ${categoryToDelete.name}`
        }
      });

      toast.success(t('blog_categories_page.category_deleted_success'));
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error(t('error'));
    }
  };

  const openEditDialog = (category: BlogCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: BlogCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6',
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleNameChange = (name: string) => {
    const baseSlug = generateSlug(name);
    const uniqueSlug = generateUniqueSlug(baseSlug, allCategories, selectedCategory?.$id);
    setFormData(prev => ({
      ...prev,
      name,
      slug: uniqueSlug,
    }));
  };

  const handleFormDataChange = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Show skeleton while translations or data is loading
  if (translationLoading || isLoading || authLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between mb-4 sm:mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
            <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Skeleton className="h-10 w-full sm:w-24" />
            <Skeleton className="h-10 w-full sm:w-32" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
        <Alert>
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between mb-4 sm:mb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
            {t('blog_categories_page.title')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base" suppressHydrationWarning>
            {t('blog_categories_page.description')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCategories}
            disabled={isRefreshing}
            className="w-full sm:w-auto shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="truncate" suppressHydrationWarning>{t('refresh')}</span>
          </Button>
          <CreateCategoryDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNameChange={handleNameChange}
            onSubmit={handleCreateCategory}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <CategoriesTable
        categories={categories}
        allCategories={allCategories}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
      />

      <EditCategoryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onNameChange={handleNameChange}
        onSubmit={handleEditCategory}
        isSubmitting={isSubmitting}
      />

      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        category={categoryToDelete}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
