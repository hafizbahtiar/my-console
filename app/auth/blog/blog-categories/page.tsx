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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID, BLOG_CATEGORIES_COLLECTION_ID, BLOG_POSTS_COLLECTION_ID } from "@/lib/appwrite";
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

interface BlogCategory {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  postCount?: number; // Calculated dynamically from relationships
}

// Function to calculate post counts for categories
async function calculatePostCounts(categories: BlogCategory[]): Promise<BlogCategory[]> {
  try {
    // Get all posts to count relationships
    const postsResponse = await tablesDB.listRows({
      databaseId: DATABASE_ID,
      tableId: BLOG_POSTS_COLLECTION_ID,
    });

    const posts = postsResponse.rows as any[];
    console.log('Posts data:', posts.slice(0, 2)); // Debug: check first 2 posts
    console.log('Available categories:', categories.map(c => ({ id: c.$id, name: c.name })));

    // Count posts per category using relationships
    const categoryCounts = new Map<string, number>();

    posts.forEach(post => {
      // Handle different relationship field formats
      let categoryId: string | null = null;

      console.log('Processing post:', post.$id, 'blogCategories:', post.blogCategories, 'category:', post.category);

      // Case 1: blogCategories is an object with $id (expanded relationship)
      if (post.blogCategories && typeof post.blogCategories === 'object' && post.blogCategories.$id) {
        categoryId = post.blogCategories.$id;
        console.log('Found object relationship:', categoryId);
      }
      // Case 2: blogCategories is just a string ID (unexpanded relationship)
      else if (typeof post.blogCategories === 'string' && post.blogCategories.trim()) {
        categoryId = post.blogCategories;
        console.log('Found string relationship:', categoryId);
      }
      // Case 3: Fallback to old category string field
      else if (post.category && typeof post.category === 'string' && post.category.trim()) {
        categoryId = post.category;
        console.log('Found legacy category field:', categoryId);
      }
      // Case 4: blogCategories might be an empty string or other falsy value
      else if (post.blogCategories && typeof post.blogCategories === 'string' && post.blogCategories.trim()) {
        categoryId = post.blogCategories.trim();
        console.log('Found string blogCategories:', categoryId);
      }

      if (categoryId) {
        categoryCounts.set(categoryId, (categoryCounts.get(categoryId) || 0) + 1);
        console.log('Incremented count for category:', categoryId, 'total now:', categoryCounts.get(categoryId));
      } else {
        console.log('No category found for post:', post.$id);
      }
    });

    console.log('Category counts:', Object.fromEntries(categoryCounts)); // Debug: show counts

    // Update categories with calculated counts
    const result = categories.map(category => ({
      ...category,
      postCount: categoryCounts.get(category.$id) || 0,
    }));

    console.log('Final result:', result.map(c => ({ name: c.name, count: c.postCount })));
    return result;
  } catch (error) {
    console.warn('Failed to calculate post counts:', error);
    // Return categories with 0 counts on error
    return categories.map(category => ({
      ...category,
      postCount: 0,
    }));
  }
}

export default function BlogCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
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

  // Load data on component mount - must be called before conditional returns
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to finish loading before proceeding
      if (authLoading) {
        return;
      }

      // If auth finished loading and no user, redirect
      if (!user) {
        router.push('/auth/dashboard');
        setIsLoading(false);
        return;
      }

      try {
        await loadCategories();
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load blog categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, router, currentPage, pageSize]);

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
      setError("Error");
      toast.error("Error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure slug is unique before creating
      const baseSlug = generateSlug(formData.name);
      const uniqueSlug = generateUniqueSlug(baseSlug);

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

      toast.success("Category created successfully");
      setCreateDialogOpen(false);
      resetForm();
      await loadCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error("Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure slug is unique before updating (exclude current category)
      const baseSlug = generateSlug(formData.name);
      const uniqueSlug = generateUniqueSlug(baseSlug, selectedCategory.$id);

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

      toast.success("Category updated successfully");
      setEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
      await loadCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error("Error");
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

      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error("Error");
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

    // Check if slug exists in current categories (excluding the one being edited)
    while (categories.some(cat =>
      cat.slug === uniqueSlug && cat.$id !== excludeId
    )) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  };

  const handleNameChange = (name: string) => {
    const baseSlug = generateSlug(name);
    const uniqueSlug = generateUniqueSlug(baseSlug, selectedCategory?.$id);
    setFormData(prev => ({
      ...prev,
      name,
      slug: uniqueSlug,
    }));
  };

  // Show loading while auth is loading or data is loading
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-primary"></div>
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Blog Categories</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage blog post categories
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={loadCategories}
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
                <span className="truncate">Add Category</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="p-4 sm:p-6">
              <DialogHeader className="px-0 sm:px-0">
                <DialogTitle className="text-lg sm:text-xl">Create Category</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Create a new blog category
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
                    placeholder="Enter category name"
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
                        URL: /blog/category/{formData.slug}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs sm:text-sm">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full"
                    placeholder="Enter category description"
                    rows={3}
                  />
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
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order" className="text-xs sm:text-sm">
                    Order
                  </Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full"
                    placeholder="0"
                  />
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
                <Button onClick={handleCreateCategory} disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" /> : null}
                  <span className="truncate">Create Category</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            <span className="truncate">Blog Categories ({allCategories.length})</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            All blog categories - Showing {categories.length} of {allCategories.length} entries (Total: {allCategories.length})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm font-semibold">Name</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold">Slug</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold">Posts</TableHead>
                    <TableHead className="text-xs sm:text-sm font-semibold hidden lg:table-cell">Order</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <TableRow key={category.$id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="font-medium text-xs sm:text-sm">{category.name}</span>
                          </div>
                          {category.description && (
                            <div className="text-xs text-muted-foreground md:hidden mt-1 truncate">
                              {category.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm">{category.slug}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs sm:text-sm hidden md:table-cell">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={category.isActive ? "active" : "inactive"} type="blog-category" />
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">{category.postCount || 0}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{category.sortOrder}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(category)}
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
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8 sm:py-12 px-4">
                        <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm sm:text-base font-medium">No categories found</p>
                        <p className="text-xs sm:text-sm mt-1">Create your first category to get started</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </div>

          {/* Pagination */}
          {getTotalPages(allCategories.length, pageSize) > 1 && (
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
                  {Array.from({ length: Math.min(5, getTotalPages(allCategories.length, pageSize)) }, (_, i) => {
                    const totalPages = getTotalPages(allCategories.length, pageSize);
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

                  {getTotalPages(allCategories.length, pageSize) > 5 && currentPage < getTotalPages(allCategories.length, pageSize) - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis className="text-xs sm:text-sm" />
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        const totalPages = getTotalPages(allCategories.length, pageSize);
                        if (currentPage < totalPages) {
                          setCurrentPage(currentPage + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className={`text-xs sm:text-sm ${currentPage >= getTotalPages(allCategories.length, pageSize) ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="p-4 sm:p-6">
          <DialogHeader className="px-0 sm:px-0">
            <DialogTitle className="text-lg sm:text-xl">Edit Category</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update the category information
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
                    URL: /blog/category/{formData.slug}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-xs sm:text-sm">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full"
                rows={3}
              />
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
            <div className="space-y-2">
              <Label htmlFor="edit-order" className="text-xs sm:text-sm">
                Order
              </Label>
              <Input
                id="edit-order"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                className="w-full"
              />
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
            <Button onClick={handleEditCategory} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" /> : null}
              <span className="truncate">Update Category</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="p-4 sm:p-6">
          <AlertDialogHeader className="px-0 sm:px-0">
            <AlertDialogTitle className="text-lg sm:text-xl">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete "{categoryToDelete?.name || ''}"? This action cannot be undone.
              {categoryToDelete?.postCount ? ` This category has ${categoryToDelete.postCount} post${categoryToDelete.postCount !== 1 ? 's' : ''}.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
