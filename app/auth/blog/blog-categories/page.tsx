"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB } from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";

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
  postCount: number;
  sortOrder: number;
}

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'console-db';
const BLOG_CATEGORIES_COLLECTION_ID = 'blog_categories';

export default function BlogCategoriesPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  // State
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      if (!user) {
        router.push('/auth/dashboard');
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
  }, [user, router]);

  const loadCategories = async () => {
    try {
      setIsRefreshing(true);
      const response = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_CATEGORIES_COLLECTION_ID
      });

      // Sort by sortOrder, then by creation date
      const sortedCategories = response.rows
        .map((row: any) => ({
          ...row,
          postCount: row.postCount || 0,
        }))
        .sort((a: BlogCategory, b: BlogCategory) => {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
        });

      setCategories(sortedCategories);
      setError(null);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError(t('general_use.error'));
      toast.error(t('general_use.error'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error(t('item_is_required', { item: 'Category name' }));
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
        postCount: 0,
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

      toast.success(t('general_use.success'));
      setCreateDialogOpen(false);
      resetForm();
      await loadCategories();
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error(t('general_use.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name.trim()) {
      toast.error(t('item_is_required', { item: 'Category name' }));
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

      toast.success(t('general_use.success'));
      setEditDialogOpen(false);
      setSelectedCategory(null);
      resetForm();
      await loadCategories();
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error(t('general_use.error'));
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
          postCount: categoryToDelete.postCount,
          description: `Deleted blog category: ${categoryToDelete.name}`
        }
      });

      toast.success(t('general_use.success'));
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      await loadCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error(t('general_use.error'));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Categories</h1>
          <p className="text-muted-foreground">
            Manage blog categories for organizing your content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadCategories}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Blog Category</DialogTitle>
                <DialogDescription>
                  Add a new category for organizing your blog posts.
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
                    placeholder="Category name"
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
                        URL: /blog/category/{formData.slug}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="col-span-3"
                    placeholder="Category description"
                    rows={3}
                  />
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
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="order" className="text-right">
                    Order
                  </Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="col-span-3"
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Categories ({categories.length})
          </CardTitle>
          <CardDescription>
            All blog categories in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posts</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <TableRow key={category.$id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{category.postCount}</TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(category)}
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No blog categories found</p>
                    <p className="text-sm">Create your first category to get started</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Blog Category</DialogTitle>
            <DialogDescription>
              Update the category information.
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
                    URL: /blog/category/{formData.slug}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                rows={3}
              />
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-order" className="text-right">
                Order
              </Label>
              <Input
                id="edit-order"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCategory} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              {categoryToDelete?.postCount ? ` This category has ${categoryToDelete.postCount} associated posts.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
