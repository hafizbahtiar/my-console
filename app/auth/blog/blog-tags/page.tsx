"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/custom/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useTranslation } from "@/lib/language-context";
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
  const { user } = useAuth();
  const { t } = useTranslation();
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
      setError(t('general_use.error'));
      toast.error(t('general_use.error'));
      throw error; // Re-throw to be handled by caller
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check Super Admin access - must be called before conditional returns
  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      if (!user) {
        router.push('/auth/dashboard');
        return;
      }

      try {
        // Get user's teams - this returns teams the current user is a member of
        const userTeams = await teams.list({});
        const hasSuperAdminAccess = userTeams.teams?.some((team: any) => team.name === 'Super Admin');

        if (!hasSuperAdminAccess) {
          // User is not a Super Admin, redirect to dashboard
          toast.error('Access denied. Super Admin privileges required.');
          router.push('/auth/dashboard');
          return;
        }

        setIsSuperAdmin(true);
      } catch (error) {
        console.error('Failed to check Super Admin access:', error);
        toast.error('Failed to verify access permissions.');
        router.push('/auth/dashboard');
        return;
      } finally {
        setIsLoadingAccess(false);
      }
    };

    checkSuperAdminAccess();
  }, [user, router]);

  // Load data on component mount - must be called before conditional returns
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        router.push('/auth/dashboard');
        return;
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
  }, [user, router, currentPage, pageSize]);

  // Show loading while checking access
  if (isLoadingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if not Super Admin (redirect will happen)
  if (!isSuperAdmin) {
    return null;
  }


  const handleCreateTag = async () => {
    if (!formData.name.trim()) {
      toast.error(t('item_is_required', { item: 'Tag name' }));
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

      toast.success(t('general_use.success'));
      setCreateDialogOpen(false);
      resetForm();
      await loadTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error(t('general_use.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTag = async () => {
    if (!selectedTag || !formData.name.trim()) {
      toast.error(t('item_is_required', { item: 'Tag name' }));
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

      toast.success(t('general_use.success'));
      setEditDialogOpen(false);
      setSelectedTag(null);
      resetForm();
      await loadTags();
    } catch (error) {
      console.error('Failed to update tag:', error);
      toast.error(t('general_use.error'));
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

      toast.success(t('general_use.success'));
      setDeleteDialogOpen(false);
      setTagToDelete(null);
      await loadTags();
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast.error(t('general_use.error'));
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Tags</h1>
          <p className="text-muted-foreground">
            Manage blog tags for organizing your content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadTags}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Blog Tag</DialogTitle>
                <DialogDescription>
                  Add a new tag for organizing your blog posts.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="col-span-3"
                    placeholder="Tag name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="slug" className="text-right">
                    Slug
                  </Label>
                  <div className="col-span-3 space-y-1">
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                    />
                    {formData.slug && (
                      <p className="text-xs text-blue-600">
                        URL: /blog/tag/{formData.slug}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Color
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#6B7280"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTag} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Tag
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags ({allTags.length})
          </CardTitle>
          <CardDescription>
            All blog tags in your system - {t("general_use.showing_entries_paginated", { 
              showing: tags.length.toString(),
              filtered: allTags.length.toString(),
              total: allTags.length.toString()
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <TableRow key={tag.$id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium">{tag.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{tag.slug}</TableCell>
                    <TableCell>
                      <StatusBadge status={tag.isActive ? "active" : "inactive"} type="blog-category" />
                    </TableCell>
                    <TableCell>{tag.postCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(tag)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No blog tags found</p>
                    <p className="text-sm">Create your first tag to get started</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {getTotalPages(allTags.length, pageSize) > 1 && (
            <div className="border-t p-4">
              <Pagination>
                <PaginationContent>
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
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
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
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {getTotalPages(allTags.length, pageSize) > 5 && currentPage < getTotalPages(allTags.length, pageSize) - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
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
                      className={currentPage >= getTotalPages(allTags.length, pageSize) ? 'pointer-events-none opacity-50' : ''}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Blog Tag</DialogTitle>
            <DialogDescription>
              Update the tag information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name *
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-slug" className="text-right">
                Slug
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                />
                {formData.slug && (
                  <p className="text-xs text-blue-600">
                    URL: /blog/tag/{formData.slug}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-12 h-8 p-1 border rounded"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTag} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{tagToDelete?.name}"? This action cannot be undone.
              {tagToDelete?.postCount ? ` This tag has ${tagToDelete.postCount} associated posts.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTagToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Tag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
