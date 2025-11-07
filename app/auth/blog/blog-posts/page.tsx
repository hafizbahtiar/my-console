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

export default function BlogPostsPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();

    // State
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [allPosts, setAllPosts] = useState<BlogPost[]>([]); // Store all posts for filtering
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
    }, [user, router, currentPage, pageSize, searchTerm, statusFilter]);

    const loadPosts = async () => {
        try {
            setIsRefreshing(true);
            
            // Get total count first (only if we need it for filtering or when no filters are active)
            const needsAllData = searchTerm || statusFilter !== 'all';
            
            if (needsAllData) {
                // Load all posts for client-side filtering
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
                // Use Appwrite native pagination when no filters
                const paginationParams = createPaginationParams(currentPage, pageSize);
                
                // Ensure limit and offset are valid numbers
                const limit = paginationParams.limit || DEFAULT_PAGE_SIZE;
                const offset = paginationParams.offset || 0;
                
                try {
                    // Try to use Appwrite native pagination with queries
                    const countResponse = await tablesDB.listRows({
                        databaseId: DATABASE_ID,
                        tableId: BLOG_POSTS_COLLECTION_ID,
                    });
                    setTotalPosts(countResponse.rows.length);
                    
                    const postsData = await tablesDB.listRows({
                        databaseId: DATABASE_ID,
                        tableId: BLOG_POSTS_COLLECTION_ID,
                        queries: [
                            `limit(${limit})`,
                            `offset(${offset})`,
                            `orderDesc("$updatedAt")`
                        ]
                    });
                    
                    const sortedPosts = postsData.rows
                        .map((row: any) => ({
                            ...row,
                            tags: Array.isArray(row.tags) ? row.tags : [],
                            seoKeywords: Array.isArray(row.seoKeywords) ? row.seoKeywords : [],
                            relatedPosts: Array.isArray(row.relatedPosts) ? row.relatedPosts : [],
                        }));
                    
                    setPosts(sortedPosts);
                    setAllPosts(sortedPosts); // For stats display
                } catch (queryError: any) {
                    // Fallback: Load all data and paginate client-side if query fails
                    console.warn('Appwrite query failed, falling back to client-side pagination:', queryError);
                    
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
                    
                    // Apply client-side pagination
                    const paginatedPosts = allSortedPosts.slice(offset, offset + limit);
                    setPosts(paginatedPosts);
                }
            }
            
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
                    description: t('blog.posts.delete_audit_description', { title: postToDelete.title })
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

    // Determine if we need to filter
    const needsFiltering = searchTerm || statusFilter !== 'all';
    
    // Filter all posts first, then paginate (only if filtering is needed)
    const filteredAllPosts = needsFiltering ? allPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : allPosts;
    
    // Apply pagination to filtered results
    const paginationParams = createPaginationParams(currentPage, pageSize);
    const filteredPosts = needsFiltering ? filteredAllPosts.slice(
        paginationParams.offset || 0,
        (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
    ) : posts; // Use already paginated posts when no filtering
    
    const totalFilteredPosts = filteredAllPosts.length;
    const totalPages = getTotalPages(totalFilteredPosts, pageSize);
    
    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage > 1 && needsFiltering) {
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
        return t("general_use.uncategorized", { defaultValue: "Uncategorized" });
    };

    const getTagNames = (blogTags: any[]) => {
        return blogTags?.map((tag: any) => tag.name).join(', ') || '';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">{t("blog.posts.title")}</h1>
                    <p className="text-muted-foreground text-lg">
                        {t("blog.posts.subtitle")}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {totalFilteredPosts} {t("blog.posts.total_posts")}
                        </span>
                        <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {allPosts.filter(p => p.status === 'published').length} {t("blog.posts.published_count")}
                        </span>
                        <span className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            {allPosts.filter(p => p.status === 'draft').length} {t("blog.posts.drafts_count")}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        variant="outline"
                        onClick={loadPosts}
                        disabled={isRefreshing}
                        className="shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {t("general_use.refresh")}
                    </Button>
                    <Button asChild className="shrink-0">
                        <Link href="/auth/blog/blog-posts/create">
                            <Plus className="h-4 w-4 mr-2" />
                            {t("general_use.create")}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-dashed">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        {t("blog.posts.search_filter")}
                    </CardTitle>
                    <CardDescription>
                        {t("blog.posts.search_filter_desc")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t("blog.posts.search_posts")}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder={t("blog.posts.search_placeholder")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t("blog.posts.status_filter")}
                            </label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={t("blog.posts.filter_by_status")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <span>{t("blog.posts.all_status")}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="published">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>{t("blog.posts.published")}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.filter(p => p.status === 'published').length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="draft">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                                            <span>{t("blog.posts.draft")}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.filter(p => p.status === 'draft').length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-gray-500" />
                                            <span>{t("blog.posts.archived")}</span>
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
                                className="shrink-0"
                            >
                                {t("blog.posts.clear_filters")}
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
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {t("blog.posts.title")} ({totalFilteredPosts})
                    </CardTitle>
                    <CardDescription>
                        {t("blog.posts.manage_content")} - {t("general_use.showing_entries_paginated", { 
                            showing: filteredPosts.length.toString(),
                            filtered: totalFilteredPosts.toString(),
                            total: allPosts.length.toString()
                        })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                                <TableHead className="font-semibold">{t("general_use.title")}</TableHead>
                                <TableHead className="font-semibold">{t("general_use.author")}</TableHead>
                                <TableHead className="font-semibold">{t("general_use.category")}</TableHead>
                                <TableHead className="font-semibold">{t("general_use.status")}</TableHead>
                                <TableHead className="font-semibold">{t("general_use.views")}</TableHead>
                                <TableHead className="font-semibold">{t("general_use.likes")}</TableHead>
                                <TableHead className="font-semibold">{t("general_use.published")}</TableHead>
                                <TableHead className="text-right font-semibold">{t("general_use.actions")}</TableHead>
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
                                        <TableCell>
                                            <div className="font-medium group-hover:text-primary transition-colors">
                                                {post.title}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{post.slug}</div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{post.author}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {getCategoryName(post)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell><StatusBadge status={post.status} type="blog-post" /></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Eye className="h-4 w-4" />
                                                <span className="font-medium">{post.views}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Heart className="h-4 w-4" />
                                                <span className="font-medium">{post.likes}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {post.publishedAt ? (
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(post.publishedAt).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Link href={`/auth/blog/blog-posts/${post.$id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    asChild
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Link href={`/auth/blog/blog-posts/${post.$id}/edit`}>
                                                        <Edit className="h-4 w-4" />
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
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : null}
                        </TableBody>
                    </Table>

                    {filteredPosts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{t("blog.posts.no_posts_found")}</h3>
                            <p className="text-muted-foreground text-center max-w-md mb-6">
                                {searchTerm || statusFilter !== 'all'
                                    ? t("blog.posts.adjust_filters")
                                    : t("blog.posts.create_first_post")
                                }
                            </p>
                            {(!searchTerm && statusFilter === 'all') && (
                                <Button asChild>
                                    <Link href="/auth/blog/blog-posts/create">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("blog.posts.create_first_post_button")}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
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
                                                >
                                                    {pageNum}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                    
                                    {totalPages > 5 && currentPage < totalPages - 2 && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
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
                                            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
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
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.author")}</p>
                                    <p className="font-medium">{selectedPost.author}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.status")}</p>
                                    <StatusBadge status={selectedPost.status} type="blog-post" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.category")}</p>
                                    <p className="font-medium">{getCategoryName(selectedPost)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.read_time")}</p>
                                    <p className="font-medium">{selectedPost.readTime}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.views")}</p>
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        <span className="font-medium">{selectedPost.views}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.likes")}</p>
                                    <div className="flex items-center gap-1">
                                        <Heart className="h-4 w-4" />
                                        <span className="font-medium">{selectedPost.likes}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.published_date")}</p>
                                    <p className="font-medium">
                                        {selectedPost.publishedAt ? new Date(selectedPost.publishedAt).toLocaleDateString() : t("blog.view.not_published")}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.featured")}</p>
                                    <p className="font-medium">{selectedPost.isFeatured ? t("general_use.yes") : t("general_use.no")}</p>
                                </div>
                            </div>

                            {/* Tags */}
                            {selectedPost.blogTags && selectedPost.blogTags.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.tags")}</h4>
                                    <div className="flex flex-wrap gap-2">
                                  {selectedPost.blogTags.map((tag: any) => (
                                    <Badge key={tag.$id} variant="secondary" className="text-sm">
                                      {tag.name}
                                                </Badge>
                                  ))}
                                    </div>
                                </div>
                            )}

                            {/* SEO Information */}
                            {(selectedPost.seoTitle || selectedPost.seoDescription || selectedPost.seoKeywords.length > 0) && (
                                <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.seo_info")}</h4>
                                    <div className="space-y-2 text-sm">
                                        {selectedPost.seoTitle && (
                                            <div>
                                                <span className="font-medium">{t("blog.view.seo_title_label")}</span> {selectedPost.seoTitle}
                                            </div>
                                        )}
                                        {selectedPost.seoDescription && (
                                            <div>
                                                <span className="font-medium">{t("blog.view.seo_desc_label")}</span> {selectedPost.seoDescription}
                                            </div>
                                        )}
                                        {selectedPost.seoKeywords.length > 0 && (
                                            <div>
                                                <span className="font-medium">{t("blog.view.seo_keywords_label")}</span>{' '}
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
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.content")}</h4>
                                <div className="border rounded-lg p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
                                    <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
                                </div>
                            </div>

                            {/* Related Posts */}
                            {selectedPost.relatedPosts.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("blog.view.related_posts")}</h4>
                                    <div className="text-sm text-muted-foreground">
                                        {t("blog.view.related_posts_count", { count: selectedPost.relatedPosts.length.toString() })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="border-t pt-6">
                        <div className="flex items-center justify-between w-full">
                            <div className="text-sm text-muted-foreground">
                                {t("general_use.updated")}: {selectedPost?.$updatedAt ? new Date(selectedPost.$updatedAt).toLocaleString() : t("general_use.unknown", { item: '' })}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                                    {t("general_use.close")}
                                </Button>
                                <Button asChild>
                                    <Link href={`/auth/blog/blog-posts/${selectedPost?.$id}/edit`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        {t("general_use.edit")}
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
                        <AlertDialogTitle>{t("blog.posts.delete_post")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("blog.posts.delete_confirmation", { title: postToDelete?.title || '' })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("general_use.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t("general_use.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
