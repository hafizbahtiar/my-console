"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BlogPost } from "./types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
    FileText,
    Plus,
    AlertCircle,
    CheckCircle,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID, BLOG_POSTS_COLLECTION_ID, BLOG_CATEGORIES_COLLECTION_ID, BLOG_TAGS_COLLECTION_ID } from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE, optimizedPagination } from "@/lib/pagination";
import {
    PostsFilters,
    PostsTable,
    ViewPostDialog,
    DeletePostDialog,
    getCategoryName,
} from "@/components/app/auth/blog/blog-posts";

export default function BlogPostsPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
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

            // If auth finished loading and no user, don't redirect, just set loading to false
            if (!user) {
                setIsLoading(false);
                return;
            }

            await Promise.all([loadPosts(), loadCategories(), loadTags()]);
        };

        loadData();
    }, [user, authLoading, currentPage, pageSize, searchTerm, statusFilter, t]);

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
            setError(t('blog_posts_page.failed_to_load'));
            toast.error(t('blog_posts_page.failed_to_load'));
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

            toast.success(t('blog_posts_page.delete_dialog.deleted_success'));
            setDeleteDialogOpen(false);
            setPostToDelete(null);
            await loadPosts();
        } catch (error) {
            console.error('Failed to delete blog post:', error);
            toast.error(t('error'));
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
    const totalPages = Math.ceil(totalFilteredPosts / pageSize);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage > 1 && (searchTerm || statusFilter !== 'all')) {
            setCurrentPage(1);
        }
    }, [searchTerm, statusFilter]);


    const getCategoryNameForPost = (post: BlogPost) => {
        const categoryName = getCategoryName(post, categories);
        return categoryName === "__UNCATEGORIZED__" ? t('blog_posts_page.table.uncategorized') : categoryName;
    };

    // Show skeleton while translations or data is loading
    if (translationLoading || isLoading || authLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                {/* Header Skeleton */}
                <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
                        <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Skeleton className="h-10 w-full sm:w-24" />
                        <Skeleton className="h-10 w-full sm:w-32" />
                    </div>
                </div>

                {/* Filters Skeleton */}
                <Skeleton className="h-32 w-full rounded-lg" />

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

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
                        {t('blog_posts_page.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg" suppressHydrationWarning>
                        {t('blog_posts_page.description')}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            {t('blog_posts_page.total_posts', { count: totalFilteredPosts.toString() })}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                            {allPosts.filter(p => p.status === 'published').length} {t('blog_posts_page.published')}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                            {allPosts.filter(p => p.status === 'draft').length} {t('blog_posts_page.drafts')}
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
                        <span className="truncate" suppressHydrationWarning>{t('refresh')}</span>
                    </Button>
                    <Button asChild className="w-full sm:w-auto shrink-0">
                        <Link href="/auth/blog/blog-posts/create">
                            <Plus className="h-4 w-4 mr-2 shrink-0" />
                            <span className="truncate" suppressHydrationWarning>{t('blog_posts_page.create')}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <PostsFilters
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                allPosts={allPosts}
                onSearchChange={setSearchTerm}
                onStatusFilterChange={setStatusFilter}
                onClearFilters={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                }}
            />

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription suppressHydrationWarning>{error}</AlertDescription>
                </Alert>
            )}

            {/* Posts Table */}
            <PostsTable
                posts={filteredPosts}
                totalPosts={totalFilteredPosts}
                currentPage={currentPage}
                pageSize={pageSize}
                isLoading={isLoading}
                categories={categories}
                onPageChange={setCurrentPage}
                onView={openViewDialog}
                onDelete={(post: BlogPost) => {
                    setPostToDelete(post);
                    setDeleteDialogOpen(true);
                }}
                getCategoryName={getCategoryNameForPost}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
            />

            {/* View Post Dialog */}
            <ViewPostDialog
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                post={selectedPost}
                getCategoryName={getCategoryNameForPost}
            />

            {/* Delete Confirmation Dialog */}
            <DeletePostDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                post={postToDelete}
                onConfirm={handleDeletePost}
            />
        </div>
    );
}
