"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BlogPost } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
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
    AlertTriangle,
    Search,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID, BLOG_POSTS_COLLECTION_ID, BLOG_CATEGORIES_COLLECTION_ID, BLOG_TAGS_COLLECTION_ID } from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE, getTotalPages, optimizedPagination } from "@/lib/pagination";
import { SafeHTML } from "@/components/ui/safe-html";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

export default function BlogPostsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // State
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [allPosts, setAllPosts] = useState<BlogPost[]>([]); // Store all posts for filtering (when filters active)
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [totalPosts, setTotalPosts] = useState(0);
    const [needsClientSideFiltering, setNeedsClientSideFiltering] = useState(false);

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

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

            await Promise.all([loadPosts(), loadCategories(), loadTags()]);
        };

        loadData();
    }, [user, authLoading, router, currentPage, pageSize, searchTerm, statusFilter]);

    const loadPosts = async () => {
        try {
            setIsRefreshing(true);
            
            // Check if we need client-side filtering (search or status filter active)
            const hasFilters = searchTerm.trim().length > 0 || statusFilter !== 'all';
            setNeedsClientSideFiltering(hasFilters);

            if (hasFilters) {
                // When filters are active, load all data for client-side filtering
                const allPostsData = await tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: BLOG_POSTS_COLLECTION_ID,
                });
                
                const allSortedPosts = allPostsData.rows
                    .map((row: any) => ({
                        ...row,
                        tags: Array.isArray(row.tags) ? row.tags : [],
                        seoKeywords: Array.isArray(row.seoKeywords) ? row.seoKeywords : [],
                        relatedPosts: Array.isArray(row.relatedPosts) ? row.relatedPosts : [],
                    }))
                    .sort((a: any, b: any) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime());

                setTotalPosts(allSortedPosts.length);
                setAllPosts(allSortedPosts);
            } else {
                // When no filters, try optimized server-side pagination
                const filters: Array<{ field: string; operator: string; value: any }> = [];
                
                const result = await optimizedPagination<BlogPost>(
                    tablesDB.listRows.bind(tablesDB),
                    {
                        databaseId: DATABASE_ID,
                        tableId: BLOG_POSTS_COLLECTION_ID,
                        page: currentPage,
                        pageSize: pageSize,
                        orderBy: '$updatedAt',
                        orderDirection: 'desc',
                        filters: filters,
                        transform: (row: any) => ({
                            ...row,
                            tags: Array.isArray(row.tags) ? row.tags : [],
                            seoKeywords: Array.isArray(row.seoKeywords) ? row.seoKeywords : [],
                            relatedPosts: Array.isArray(row.relatedPosts) ? row.relatedPosts : [],
                        })
                    }
                );

                setPosts(result.data);
                setTotalPosts(result.total);
                setAllPosts([]); // Clear allPosts when using server-side pagination
            }
            
            setError(null);
        } catch (err) {
            console.error('Failed to load blog posts:', err);
            setError("Error");
            toast.error("Error");
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
            // Note: Category post counts are calculated dynamically from relationships
            // No manual updates needed on deletion

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

            toast.success("Post deleted successfully");
            setDeleteDialogOpen(false);
            setPostToDelete(null);
            await loadPosts();
        } catch (error) {
            console.error('Failed to delete blog post:', error);
            toast.error("Error");
        }
    };


    const openViewDialog = (post: BlogPost) => {
        setSelectedPost(post);
        setViewDialogOpen(true);
    };

    // Determine which posts to display
    // If filters are active, use client-side filtering and pagination
    // Otherwise, use server-side paginated posts
    const filteredAllPosts = needsClientSideFiltering ? allPosts.filter(post => {
        const matchesSearch = !searchTerm || 
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : [];
    
    // Apply pagination to filtered results (only when client-side filtering is active)
    const paginationParams = createPaginationParams(currentPage, pageSize);
    const filteredPosts = needsClientSideFiltering 
        ? filteredAllPosts.slice(
            paginationParams.offset || 0,
            (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
          )
        : posts; // Use server-side paginated posts when no filters
    
    const totalFilteredPosts = needsClientSideFiltering ? filteredAllPosts.length : totalPosts;
    const totalPages = getTotalPages(totalFilteredPosts, pageSize);
    
    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage > 1 && (searchTerm || statusFilter !== 'all')) {
            setCurrentPage(1);
        }
    }, [searchTerm, statusFilter]);


    const getCategoryName = (post: BlogPost) => {
        // Use only the relationship field
        if (post.blogCategories) {
            // Check if blogCategories is an object (expanded relationship)
            if (typeof post.blogCategories === 'object' && post.blogCategories.name) {
                return post.blogCategories.name;
            }
            // Check if blogCategories is a string (unexpanded relationship ID)
            else if (typeof post.blogCategories === 'string') {
                const category = categories.find(cat => cat.$id === post.blogCategories);
                return category?.name || post.blogCategories;
            }
        }
        return "Uncategorized";
    };

    // Show loading while auth is loading or data is loading
    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Blog Posts</h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                        Manage and organize your blog content
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 shrink-0">
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            {totalFilteredPosts} total posts
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                            {allPosts.filter(p => p.status === 'published').length} published
                        </span>
                        <span className="flex items-center gap-1 shrink-0">
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                            {allPosts.filter(p => p.status === 'draft').length} drafts
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={loadPosts}
                        disabled={isRefreshing}
                        className="w-full sm:w-auto shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="truncate">Refresh</span>
                    </Button>
                    <Button asChild className="w-full sm:w-auto shrink-0">
                        <Link href="/auth/blog/blog-posts/create">
                            <Plus className="h-4 w-4 mr-2 shrink-0" />
                            <span className="truncate">Create</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-dashed">
                <CardHeader className="pb-4 p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                        Search & Filter
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Search posts by title, author, or slug. Filter by status.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="flex-1 space-y-2 min-w-0">
                            <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Search Posts
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
                                <Input
                                    type="text"
                                    placeholder="Search by title, author, or slug..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Status Filter
                            </label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-48">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <span>All Status</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="published">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                            <span>Published</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.filter(p => p.status === 'published').length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="draft">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
                                            <span>Draft</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.filter(p => p.status === 'draft').length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-gray-500 shrink-0" />
                                            <span>Archived</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.filter(p => p.status === 'archived').length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(searchTerm || statusFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                }}
                                className="w-full md:w-auto shrink-0"
                            >
                                Clear Filters
                            </Button>
                        )}
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
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        <span className="truncate">Blog Posts ({totalFilteredPosts})</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Manage your blog content - Showing {filteredPosts.length} of {totalFilteredPosts} entries (Total: {totalFilteredPosts})
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="font-semibold text-xs sm:text-sm">Title</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell">Author</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm">Category</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm">Status</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Views</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell">Likes</TableHead>
                                        <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell">Published</TableHead>
                                        <TableHead className="text-right font-semibold text-xs sm:text-sm">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                // Loading skeleton rows
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
                                                <div className="h-3 bg-muted animate-pulse rounded w-32"></div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-6 bg-muted animate-pulse rounded w-16"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-4 bg-muted animate-pulse rounded w-12"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-4 bg-muted animate-pulse rounded w-12"></div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                                                <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                                                <div className="h-8 w-8 bg-muted animate-pulse rounded"></div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPosts.length > 0 ? (
                                filteredPosts.map((post) => (
                                    <TableRow
                                        key={post.$id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                        onClick={() => openViewDialog(post)}
                                    >
                                                <TableCell className="min-w-[200px]">
                                                    <div className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors">
                                                {post.title}
                                            </div>
                                                    <div className="text-xs text-muted-foreground truncate">{post.slug}</div>
                                                    <div className="text-xs text-muted-foreground sm:hidden mt-1">
                                                        {post.author}
                                                    </div>
                                        </TableCell>
                                                <TableCell className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">{post.author}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {getCategoryName(post)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell><StatusBadge status={post.status} type="blog-post" /></TableCell>
                                                <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                                        <span className="font-medium text-xs sm:text-sm">{post.views}</span>
                                            </div>
                                        </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                        <Heart className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                                        <span className="font-medium text-xs sm:text-sm">{post.likes}</span>
                                            </div>
                                        </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                            {post.publishedAt ? (
                                                        <div className="text-xs sm:text-sm text-muted-foreground">
                                                    {new Date(post.publishedAt).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                        <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    onClick={(e) => e.stopPropagation()}
                                                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                                >
                                                    <Link href={`/auth/blog/blog-posts/${post.$id}`}>
                                                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    onClick={(e) => e.stopPropagation()}
                                                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                                >
                                                    <Link href={`/auth/blog/blog-posts/${post.$id}/edit`}>
                                                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPostToDelete(post);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : null}
                        </TableBody>
                    </Table>
                    </div>

                    {filteredPosts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                            <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
                                <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">No posts found</h3>
                            <p className="text-muted-foreground text-center text-sm sm:text-base max-w-md mb-6">
                                {searchTerm || statusFilter !== 'all'
                                    ? "Try adjusting your filters to see more results"
                                    : "Create your first blog post to get started"
                                }
                            </p>
                            {(!searchTerm && statusFilter === 'all') && (
                                <Button asChild className="w-full sm:w-auto">
                                    <Link href="/auth/blog/blog-posts/create">
                                        <Plus className="h-4 w-4 mr-2 shrink-0" />
                                        <span className="truncate">Create First Post</span>
                                    </Link>
                                </Button>
                            )}
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
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
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                                    
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <PaginationItem>
                                            <PaginationEllipsis className="text-xs sm:text-sm" />
                                        </PaginationItem>
                                    )}
                                    
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (currentPage < totalPages) {
                                                    setCurrentPage(currentPage + 1);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                            className={`text-xs sm:text-sm ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>



            {/* View Post Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="sm:max-w-[1200px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader className="space-y-3 sm:space-y-4 px-0 sm:px-0">
                        <div className="space-y-2">
                            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
                                {selectedPost?.title}
                            </DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                {selectedPost?.excerpt}
                            </DialogDescription>
                        </div>

                        {/* Featured Image */}
                        {selectedPost?.featuredImage && (
                            <div className="relative">
                                <img
                                    src={selectedPost.featuredImage}
                                    alt={selectedPost.featuredImageAlt || selectedPost.title}
                                    className="w-full h-48 sm:h-64 object-cover rounded-lg shadow-md"
                                />
                                {selectedPost.featuredImageAlt && (
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-2 italic">
                                        {selectedPost.featuredImageAlt}
                                    </p>
                                )}
                            </div>
                        )}
                    </DialogHeader>

                    {selectedPost && (
                        <div className="space-y-4 sm:space-y-6 md:space-y-8 py-4 sm:py-6">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
                                <div className="space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Author</p>
                                    <p className="font-medium text-xs sm:text-sm">{selectedPost.author}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                                    <StatusBadge status={selectedPost.status} type="blog-post" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</p>
                                    <p className="font-medium text-xs sm:text-sm">{getCategoryName(selectedPost)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Read Time</p>
                                    <p className="font-medium text-xs sm:text-sm">{selectedPost.readTime}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Views</p>
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                        <span className="font-medium text-xs sm:text-sm">{selectedPost.views}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Likes</p>
                                    <div className="flex items-center gap-1">
                                        <Heart className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                        <span className="font-medium text-xs sm:text-sm">{selectedPost.likes}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Published Date</p>
                                    <p className="font-medium text-xs sm:text-sm">
                                        {selectedPost.publishedAt ? new Date(selectedPost.publishedAt).toLocaleDateString() : "Not published"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Featured</p>
                                    <p className="font-medium text-xs sm:text-sm">{selectedPost.isFeatured ? "Yes" : "No"}</p>
                                </div>
                            </div>

                            {/* Tags */}
                            {selectedPost.blogTags && selectedPost.blogTags.length > 0 && (
                                <div className="space-y-2 sm:space-y-3">
                                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                  {selectedPost.blogTags.map((tag: any) => (
                                            <Badge key={tag.$id} variant="secondary" className="text-xs sm:text-sm">
                                      {tag.name}
                                                </Badge>
                                  ))}
                                    </div>
                                </div>
                            )}

                            {/* SEO Information */}
                            {(selectedPost.seoTitle || selectedPost.seoDescription || selectedPost.seoKeywords.length > 0) && (
                                <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 border rounded-lg bg-muted/20">
                                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">SEO Information</h4>
                                    <div className="space-y-2 text-xs sm:text-sm">
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
                            <div className="space-y-2 sm:space-y-3">
                                <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Content</h4>
                                <div className="border rounded-lg p-3 sm:p-4 md:p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
                                    <SafeHTML html={selectedPost.content} />
                                </div>
                            </div>

                            {/* Related Posts */}
                            {selectedPost.relatedPosts.length > 0 && (
                                <div className="space-y-2 sm:space-y-3">
                                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">Related Posts</h4>
                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                        {selectedPost.relatedPosts.length} related post{selectedPost.relatedPosts.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="border-t pt-4 sm:pt-6 flex-col sm:flex-row gap-3 sm:gap-2">
                        <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                                Updated: {selectedPost?.$updatedAt ? new Date(selectedPost.$updatedAt).toLocaleString() : "Unknown"}
                            </div>
                        <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                            <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="flex-1 sm:flex-initial">
                                    Close
                                </Button>
                            <Button asChild className="flex-1 sm:flex-initial">
                                    <Link href={`/auth/blog/blog-posts/${selectedPost?.$id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2 shrink-0" />
                                    <span className="truncate">Edit</span>
                                    </Link>
                                </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{postToDelete?.title || ''}"? This action cannot be undone.
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
