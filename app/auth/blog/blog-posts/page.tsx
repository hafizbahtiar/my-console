"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye,
  Heart,
  Calendar,
  User,
  Tag,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB } from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";

interface BlogPost {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorId?: string;
  category: string;
  tags: string[];
  readTime: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  views: number;
  likes: number;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  allowComments: boolean;
  commentCount: number;
  relatedPosts: string[];
}

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'console-db';
const BLOG_POSTS_COLLECTION_ID = 'blog_posts';
const BLOG_CATEGORIES_COLLECTION_ID = 'blog_categories';
const BLOG_TAGS_COLLECTION_ID = 'blog_tags';

export default function BlogPostsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  // State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        router.push('/auth/dashboard');
        return;
      }
      await Promise.all([loadPosts(), loadCategories(), loadTags()]);
    };

    loadData();
  }, [user, router]);

  const loadPosts = async () => {
    try {
      setIsRefreshing(true);
      const postsData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_POSTS_COLLECTION_ID,
      });

      const sortedPosts = postsData.rows
        .map((row: any) => ({
          ...row,
          tags: Array.isArray(row.tags) ? row.tags : [],
          seoKeywords: Array.isArray(row.seoKeywords) ? row.seoKeywords : [],
          relatedPosts: Array.isArray(row.relatedPosts) ? row.relatedPosts : [],
        }))
        .sort((a: any, b: any) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime());

      setPosts(sortedPosts);
      setError(null);
    } catch (err) {
      console.error('Failed to load blog posts:', err);
      setError(t('general_use.error'));
      toast.error(t('general_use.error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_CATEGORIES_COLLECTION_ID,
      });
      setCategories(categoriesData.rows || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tagsData = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: BLOG_TAGS_COLLECTION_ID,
      });
      setTags(tagsData.rows || []);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };



  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: BLOG_POSTS_COLLECTION_ID,
        rowId: postToDelete.$id,
      });

      // Log audit event
      await auditLogger.log({
        action: 'BLOG_POST_DELETED',
        resource: 'blog_posts',
        resourceId: postToDelete.$id,
        userId: user!.$id,
        metadata: {
          postTitle: postToDelete.title,
          postViews: postToDelete.views,
          description: `Deleted blog post: ${postToDelete.title}`
        }
      });

      toast.success(t('general_use.success'));
      setDeleteDialogOpen(false);
      setPostToDelete(null);
      await loadPosts();
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      toast.error(t('general_use.error'));
    }
  };


  const openViewDialog = (post: BlogPost) => {
    setSelectedPost(post);
    setViewDialogOpen(true);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Published</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.$id === categoryId);
    return category?.name || categoryId;
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds.map(tagId => {
      const tag = tags.find(t => t.$id === tagId);
      return tag?.name || tagId;
    }).join(', ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">
            Manage your blog posts and content
          </p>
        </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadPosts}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/auth/blog/blog-posts/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Link>
            </Button>
          </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Posts ({filteredPosts.length})</CardTitle>
          <CardDescription>
            A list of all your blog posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Likes</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.$id}>
                  <TableCell>
                    <div className="font-medium">{post.title}</div>
                    <div className="text-sm text-muted-foreground">{post.slug}</div>
                  </TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>{getCategoryName(post.category)}</TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {post.views}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Heart className="h-4 w-4 mr-1" />
                      {post.likes}
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.publishedAt ? (
                      <div className="text-sm">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(post)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/auth/blog/blog-posts/${post.$id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPostToDelete(post);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPosts.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No blog posts found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first blog post'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>



      {/* View Post Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] max-h-[95vh] overflow-y-auto">
          <DialogHeader className="space-y-4">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold leading-tight">
                {selectedPost?.title}
              </DialogTitle>
              <DialogDescription className="text-base">
                {selectedPost?.excerpt}
              </DialogDescription>
            </div>

            {/* Featured Image */}
            {selectedPost?.featuredImage && (
              <div className="relative">
                <img
                  src={selectedPost.featuredImage}
                  alt={selectedPost.featuredImageAlt || selectedPost.title}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
                {selectedPost.featuredImageAlt && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    {selectedPost.featuredImageAlt}
                  </p>
                )}
              </div>
            )}
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-8 py-6">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Author</p>
                  <p className="font-medium">{selectedPost.author}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                  {getStatusBadge(selectedPost.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</p>
                  <p className="font-medium">{getCategoryName(selectedPost.category)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Read Time</p>
                  <p className="font-medium">{selectedPost.readTime}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Views</p>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span className="font-medium">{selectedPost.views}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Likes</p>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span className="font-medium">{selectedPost.likes}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Published</p>
                  <p className="font-medium">
                    {selectedPost.publishedAt ? new Date(selectedPost.publishedAt).toLocaleDateString() : 'Not published'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Featured</p>
                  <p className="font-medium">{selectedPost.isFeatured ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedPost.tags.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.tags.map((tagId) => {
                      const tag = tags.find(t => t.$id === tagId);
                      return (
                        <Badge key={tagId} variant="secondary" className="text-sm">
                          {tag?.name || tagId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SEO Information */}
              {(selectedPost.seoTitle || selectedPost.seoDescription || selectedPost.seoKeywords.length > 0) && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">SEO Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedPost.seoTitle && (
                      <div>
                        <span className="font-medium">SEO Title:</span> {selectedPost.seoTitle}
                      </div>
                    )}
                    {selectedPost.seoDescription && (
                      <div>
                        <span className="font-medium">SEO Description:</span> {selectedPost.seoDescription}
                      </div>
                    )}
                    {selectedPost.seoKeywords.length > 0 && (
                      <div>
                        <span className="font-medium">SEO Keywords:</span>{' '}
                        <div className="inline-flex flex-wrap gap-1 mt-1">
                          {selectedPost.seoKeywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Content</h4>
                <div className="border rounded-lg p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
                </div>
              </div>

              {/* Related Posts */}
              {selectedPost.relatedPosts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Related Posts</h4>
                  <div className="text-sm text-muted-foreground">
                    {selectedPost.relatedPosts.length} related post(s) configured
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-6">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                Last updated: {selectedPost?.$updatedAt ? new Date(selectedPost.$updatedAt).toLocaleString() : 'Unknown'}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/auth/blog/blog-posts/${selectedPost?.$id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Post
                  </Link>
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
