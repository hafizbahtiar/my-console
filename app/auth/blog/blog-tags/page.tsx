"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/custom/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB, teams, DATABASE_ID, BLOG_TAGS_COLLECTION_ID } from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE, getTotalPages } from "@/lib/pagination";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface BlogTag {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  slug: string;
  color: string;
  postCount: number;
  isActive: boolean;
}

export default function BlogTagsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // All hooks must be called unconditionally at the top level
  // State for Super Admin access control
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoadingAccess, setIsLoadingAccess] = useState(true);

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
      setError("Error");
      toast.error("Error");
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
          // User is not a Super Admin, redirect to dashboard
          toast.error("Access denied. Super Admin access required.");
          router.push('/auth/dashboard');
          setIsLoadingAccess(false);
          return;
        }

        setIsSuperAdmin(true);
      } catch (error) {
        console.error('Failed to check Super Admin access:', error);
        toast.error("Failed to verify access");
        router.push('/auth/dashboard');
      } finally {
        setIsLoadingAccess(false);
      }
    };

    checkSuperAdminAccess();
  }, [user, authLoading, router]);

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
        setError('Failed to load blog tags');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, isLoadingAccess, isSuperAdmin, router, currentPage, pageSize]);

  // Show loading while checking access
  if (isLoadingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if not Super Admin (redirect will happen)
  if (!isSuperAdmin) {
    return null;
  }


  const handleCreateTag = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure slug is unique before creating
      const baseSlug = generateSlug(formData.name);
      const uniqueSlug = generateUniqueSlug(baseSlug);

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

      toast.success("Tag created successfully");
      setCreateDialogOpen(false);
      resetForm();
      await loadTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error("Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTag = async () => {
    if (!selectedTag || !formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure slug is unique before updating (exclude current tag)
      const baseSlug = generateSlug(formData.name);
      const uniqueSlug = generateUniqueSlug(baseSlug, selectedTag.$id);

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

      toast.success("Tag updated successfully");
      setEditDialogOpen(false);
      setSelectedTag(null);
      resetForm();
      await loadTags();
    } catch (error) {
      console.error('Failed to update tag:', error);
      toast.error("Error");
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

      toast.success("Tag deleted successfully");
      setDeleteDialogOpen(false);
      setTagToDelete(null);
      await loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast.error("Error");
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

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const generateUniqueSlug = (baseSlug: string, excludeId?: string): string => {
    let uniqueSlug = baseSlug;
    let counter = 1;

    // Check if slug exists in current tags (excluding the one being edited)
    while (tags.some(tag =>
      tag.slug === uniqueSlug && tag.$id !== excludeId
    )) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  };

  const handleNameChange = (name: string) => {
    const baseSlug = generateSlug(name);
    const uniqueSlug = generateUniqueSlug(baseSlug, selectedTag?.$id);
    setFormData(prev => ({
      ...prev,
      name,
      slug: uniqueSlug,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
        <Alert>
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between mb-4 sm:mb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Blog Tags</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage blog post tags
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={loadTags}
            disabled={isRefreshing}
            className="w-full sm:w-auto shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="truncate">Refresh</span>
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto shrink-0">
                <Plus className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Add Tag</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="p-4 sm:p-6">
              <DialogHeader className="px-0 sm:px-0">
                <DialogTitle className="text-lg sm:text-xl">Create Tag</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Create a new blog tag
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs sm:text-sm">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter tag name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-xs sm:text-sm">
                    Slug
                  </Label>
                  <div className="space-y-1">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                      className="w-full"
                    />
                    {formData.slug && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        URL: /blog/tag/{formData.slug}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-xs sm:text-sm">
                    Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-8 sm:w-16 sm:h-10 p-1 border rounded shrink-0"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#6B7280"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                  />
                  <Label htmlFor="isActive" className="text-xs sm:text-sm font-normal cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleCreateTag} disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" /> : null}
                  <span className="truncate">Create Tag</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Tag className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate">Blog Tags ({allTags.length})</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            All blog tags - Showing {tags.length} of {allTags.length} entries (Total: {allTags.length})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm font-semibold">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold">Slug</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm font-semibold">Posts</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <TableRow key={tag.$id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="font-medium text-xs sm:text-sm">{tag.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs sm:text-sm">{tag.slug}</TableCell>
                      <TableCell>
                        <StatusBadge status={tag.isActive ? "active" : "inactive"} type="blog-category" />
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{tag.postCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(tag)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(tag)}
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 sm:py-12 px-4">
                      <Tag className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm sm:text-base font-medium">No tags found</p>
                      <p className="text-xs sm:text-sm mt-1">Create your first tag to get started</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {getTotalPages(allTags.length, pageSize) > 1 && (
            <div className="border-t p-3 sm:p-4">
              <Pagination>
                <PaginationContent className="flex-wrap gap-2">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={`text-xs sm:text-sm ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationItem>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, getTotalPages(allTags.length, pageSize)) }, (_, i) => {
                    const totalPages = getTotalPages(allTags.length, pageSize);
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          isActive={currentPage === pageNum}
                          className="text-xs sm:text-sm"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {getTotalPages(allTags.length, pageSize) > 5 && currentPage < getTotalPages(allTags.length, pageSize) - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis className="text-xs sm:text-sm" />
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const totalPages = getTotalPages(allTags.length, pageSize);
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={`text-xs sm:text-sm ${currentPage >= getTotalPages(allTags.length, pageSize) ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Tag Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="p-4 sm:p-6">
          <DialogHeader className="px-0 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl">Edit Tag</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update the tag information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-xs sm:text-sm">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug" className="text-xs sm:text-sm">
                Slug
              </Label>
              <div className="space-y-1">
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full"
                />
                {formData.slug && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    URL: /blog/tag/{formData.slug}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color" className="text-xs sm:text-sm">
                Color
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-8 sm:w-16 sm:h-10 p-1 border rounded shrink-0"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
              />
              <Label htmlFor="edit-isActive" className="text-xs sm:text-sm font-normal cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleEditTag} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" /> : null}
              <span className="truncate">Update Tag</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="p-4 sm:p-6">
          <AlertDialogHeader className="px-0 sm:px-0">
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Tag</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete "{tagToDelete?.name || ''}"? This action cannot be undone.
              {tagToDelete?.postCount ? ` This tag has ${tagToDelete.postCount} post${tagToDelete.postCount !== 1 ? 's' : ''}.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel onClick={() => setTagToDelete(null)} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              Delete Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
