"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { tablesDB, teams, DATABASE_ID, BLOG_TAGS_COLLECTION_ID } from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  TagsTable,
  CreateTagDialog,
  EditTagDialog,
  DeleteTagDialog,
  generateSlug,
  generateUniqueSlug,
  type BlogTag,
} from "@/components/app/auth/blog/blog-tags";

export default function BlogTagsPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, loading: translationLoading } = useTranslation();
  const router = useRouter();

  // All hooks must be called unconditionally at the top level
  // State for Super Admin access control
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);

  // Main component state - must be called before any conditional returns
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [allTags, setAllTags] = useState<BlogTag[]>([]); // Store all tags for pagination
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
  const [tagToDelete, setTagToDelete] = useState<BlogTag | null>(null);
  const [selectedTag, setSelectedTag] = useState<BlogTag | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#6B7280',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper functions - must be defined before useEffect hooks that call them
  const loadTags = async () => {
    try {
      setIsRefreshing(true);
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_TAGS_COLLECTION_ID
      });

      // Sort by creation date (newest first)
      const sortedTags = response.rows
        .map((row: any) => ({
          ...row,
          postCount: row.postCount || 0,
        }))
        .sort((a: BlogTag, b: BlogTag) => {
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
        });

      setAllTags(sortedTags);

      // Apply pagination
      const paginationParams = createPaginationParams(currentPage, pageSize);
      const paginatedTags = sortedTags.slice(
        paginationParams.offset || 0,
        (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
      );

      setTags(paginatedTags);
      setError(null);
    } catch (error) {
      console.error('Failed to load tags:', error);
      setError(t('blog_tags_page.failed_to_load'));
      toast.error(t('blog_tags_page.failed_to_load'));
      throw error; // Re-throw to be handled by caller
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check Super Admin access - must be called before conditional returns
  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      // Wait for auth to finish loading before checking
      if (authLoading) {
        return;
      }

      // If auth finished loading and no user, redirect
      if (!user) {
        router.push('/auth/dashboard');
        setIsLoadingAccess(false);
        return;
      }

      try {
        // Get user's teams - this returns teams the current user is a member of
        const userTeams = await teams.list({});
        const hasSuperAdminAccess = userTeams.teams?.some((team: any) => team.name === 'Super Admin');

        if (!hasSuperAdminAccess) {
          // User is not a Super Admin, don't redirect, just set access to false
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(true);
        }
      } catch (error) {
        console.error('Failed to check Super Admin access:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsLoadingAccess(false);
        setAccessChecked(true);
      }
    };

    checkSuperAdminAccess();
  }, [user, authLoading, t]);

  // Load data on component mount - must be called before conditional returns
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to finish loading and access check to complete
      if (authLoading || isLoadingAccess || !isSuperAdmin) {
        return;
      }

      if (!user) {
        return; // Will be handled by access check
      }

      try {
        await loadTags();
      } catch (error) {
        console.error('Failed to load data:', error);
        setError(t('blog_tags_page.failed_to_load'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, isLoadingAccess, isSuperAdmin, currentPage, pageSize, t]);

  // Show skeleton while checking access or loading translations
  if (translationLoading || !accessChecked) {
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

  // Show access denied message instead of redirecting
  if (accessChecked && !isSuperAdmin) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('blog_tags_page.access_denied')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  const handleCreateTag = async () => {
    if (!formData.name.trim()) {
      toast.error(t('blog_tags_page.tag_name_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure slug is unique before creating
      const baseSlug = generateSlug(formData.name);
      const uniqueSlug = generateUniqueSlug(baseSlug, allTags);

      const newTag = {
        name: formData.name.trim(),
        slug: uniqueSlug,
        color: formData.color,
        postCount: 0,
        isActive: formData.isActive,
      };

      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_TAGS_COLLECTION_ID,
        rowId: `tag_${Date.now()}`,
        data: newTag,
      });

      // Log audit event
      await auditLogger.log({
        action: 'BLOG_TAG_CREATED',
        resource: 'blog_tags',
        resourceId: `tag_${Date.now()}`,
        userId: user?.$id || '',
        metadata: {
          tagName: newTag.name,
          tagSlug: uniqueSlug,
          description: `Created blog tag: ${newTag.name}`
        }
      });

      toast.success(t('blog_tags_page.tag_created_success'));
      setCreateDialogOpen(false);
      resetForm();
      await loadTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTag = async () => {
    if (!selectedTag || !formData.name.trim()) {
      toast.error(t('blog_tags_page.tag_name_required'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure slug is unique before updating (exclude current tag)
      const baseSlug = generateSlug(formData.name);
      const uniqueSlug = generateUniqueSlug(baseSlug, allTags, selectedTag.$id);

      const updatedTag = {
        name: formData.name.trim(),
        slug: uniqueSlug,
        color: formData.color,
        isActive: formData.isActive,
      };

      await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_TAGS_COLLECTION_ID,
        rowId: selectedTag.$id,
        data: updatedTag,
      });

      // Log audit event
      await auditLogger.log({
        action: 'BLOG_TAG_UPDATED',
        resource: 'blog_tags',
        resourceId: selectedTag.$id,
        userId: user?.$id || '',
        oldValues: {
          name: selectedTag.name,
          slug: selectedTag.slug,
          color: selectedTag.color,
          isActive: selectedTag.isActive,
        },
        newValues: updatedTag,
        metadata: {
          tagName: updatedTag.name,
          tagSlug: uniqueSlug,
          description: `Updated blog tag: ${updatedTag.name}`
        }
      });

      toast.success(t('blog_tags_page.tag_updated_success'));
      setEditDialogOpen(false);
      setSelectedTag(null);
      resetForm();
      await loadTags();
    } catch (error) {
      console.error('Failed to update tag:', error);
      toast.error(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_TAGS_COLLECTION_ID,
        rowId: tagToDelete.$id,
      });

      // Log audit event
      await auditLogger.log({
        action: 'BLOG_TAG_DELETED',
        resource: 'blog_tags',
        resourceId: tagToDelete.$id,
        userId: user?.$id || '',
        metadata: {
          tagName: tagToDelete.name,
          tagSlug: tagToDelete.slug,
          postCount: tagToDelete.postCount,
          description: `Deleted blog tag: ${tagToDelete.name}`
        }
      });

      toast.success(t('blog_tags_page.tag_deleted_success'));
      setDeleteDialogOpen(false);
      setTagToDelete(null);
      await loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast.error(t('error'));
    }
  };

  const openEditDialog = (tag: BlogTag) => {
    setSelectedTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      isActive: tag.isActive,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (tag: BlogTag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      color: '#6B7280',
      isActive: true,
    });
  };

  const handleNameChange = (name: string) => {
    const baseSlug = generateSlug(name);
    const uniqueSlug = generateUniqueSlug(baseSlug, allTags, selectedTag?.$id);
    setFormData(prev => ({
      ...prev,
      name,
      slug: uniqueSlug,
    }));
  };

  const handleFormDataChange = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  if (isLoading) {
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
            {t('blog_tags_page.title')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base" suppressHydrationWarning>
            {t('blog_tags_page.description')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTags}
            disabled={isRefreshing}
            className="w-full sm:w-auto shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="truncate" suppressHydrationWarning>{t('refresh')}</span>
          </Button>
          <CreateTagDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNameChange={handleNameChange}
            onSubmit={handleCreateTag}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <TagsTable
        tags={tags}
        allTags={allTags}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onCreate={() => setCreateDialogOpen(true)}
        isLoading={isLoading}
      />

      <EditTagDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onNameChange={handleNameChange}
        onSubmit={handleEditTag}
        isSubmitting={isSubmitting}
      />

      <DeleteTagDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        tag={tagToDelete}
        onConfirm={handleDeleteTag}
      />
    </div>
  );
}
