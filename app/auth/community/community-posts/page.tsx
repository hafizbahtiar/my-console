"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CommunityPost } from "./types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MessageSquare,
    Plus,
    AlertCircle,
    CheckCircle,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, COMMUNITY_TOPICS_COLLECTION_ID } from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE, getTotalPages, optimizedPagination } from "@/lib/pagination";
import {
    PostsFilters,
    PostsTable,
    DeletePostDialog,
    getTopicName as getTopicNameUtil,
} from "@/components/app/auth/community/community-posts";

export default function CommunityPostsPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();

    // State
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
    const [topics, setTopics] = useState<any[]>([]);
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
    const [postToDelete, setPostToDelete] = useState<CommunityPost | null>(null);

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

            await Promise.all([loadPosts(), loadTopics()]);
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
                const allPostsData = await tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: COMMUNITY_POSTS_COLLECTION_ID,
                });

                const allSortedPosts = allPostsData.rows
                    .map((row: any) => ({
                        ...row,
                        tags: Array.isArray(row.tags) ? row.tags : [],
                    }))
                    .sort((a: any, b: any) => new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime());

                setTotalPosts(allSortedPosts.length);
                setAllPosts(allSortedPosts);
            } else {
                // When no filters, try optimized server-side pagination
                const filters: Array<{ field: string; operator: string; value: any }> = [];
                
                const result = await optimizedPagination<CommunityPost>(
                    tablesDB.listRows.bind(tablesDB),
                    {
                        databaseId: DATABASE_ID,
                        tableId: COMMUNITY_POSTS_COLLECTION_ID,
                        page: currentPage,
                        pageSize: pageSize,
                        orderBy: '$updatedAt',
                        orderDirection: 'desc',
                        filters: filters,
                        transform: (row: any) => ({
                            ...row,
                            tags: Array.isArray(row.tags) ? row.tags : [],
                        })
                    }
                );

                setPosts(result.data);
                setTotalPosts(result.total);
                setAllPosts([]); // Clear allPosts when using server-side pagination
            }

            setError(null);
        } catch (err: any) {
            console.error('Failed to load community posts:', err);

            // Check for authorization errors
            const isAuthError = err?.code === 401 ||
                err?.code === 403 ||
                err?.message?.includes('not authorized') ||
                err?.message?.includes('authorized') ||
                err?.type === 'AppwriteException';

            if (isAuthError) {
                const errorMsg = t('community_posts_page.toast.permission_denied');
                setError(errorMsg);
                toast.error(errorMsg);
            } else {
                const errorMsg = t('error');
                setError(errorMsg);
                toast.error(errorMsg);
            }

            // Set empty arrays to prevent further errors
            setPosts([]);
            setAllPosts([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const loadTopics = async () => {
        try {
            const topicsData = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: COMMUNITY_TOPICS_COLLECTION_ID,
            });
            setTopics(topicsData.rows || []);
        } catch (error: any) {
            console.error('Failed to load topics:', error);
            // Silently handle topic loading errors - topics are optional
            setTopics([]);
        }
    };

    const handleDeletePost = async () => {
        if (!postToDelete) return;

        try {
            await tablesDB.deleteRow({
                databaseId: DATABASE_ID,
                tableId: COMMUNITY_POSTS_COLLECTION_ID,
                rowId: postToDelete.$id,
            });

            await auditLogger.log({
                action: 'COMMUNITY_POST_DELETED',
                resource: 'community_posts',
                resourceId: postToDelete.$id,
                userId: user!.$id,
                metadata: {
                    postTitle: postToDelete.title,
                    postViews: postToDelete.views,
                    description: `Deleted community post: ${postToDelete.title}`
                }
            });

            toast.success(t('community_posts_page.toast.deleted_success'));
            setDeleteDialogOpen(false);
            setPostToDelete(null);
            await loadPosts();
        } catch (error) {
            console.error('Failed to delete community post:', error);
            toast.error(t('error'));
        }
    };

    // Determine which posts to display
    // If filters are active, use client-side filtering and pagination
    // Otherwise, use server-side paginated posts
    const filteredAllPosts = needsClientSideFiltering ? allPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.author && post.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
        if (currentPage > 1 && needsClientSideFiltering) {
            setCurrentPage(1);
        }
    }, [searchTerm, statusFilter, needsClientSideFiltering, currentPage]);

    const getTopicName = (post: CommunityPost) => {
        const topicName = getTopicNameUtil(post, topics);
        if (topicName === "__UNCATEGORIZED__") {
            return t('community_posts_page.table.uncategorized');
        }
        return topicName;
    };

    // Show skeleton loading while translations or data are loading
    if (translationLoading || isLoading || authLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-6 w-96" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight" suppressHydrationWarning>
                        {t('community_posts_page.title')}
                    </h1>
                    <p className="text-muted-foreground text-lg" suppressHydrationWarning>
                        {t('community_posts_page.description')}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1" suppressHydrationWarning>
                            <MessageSquare className="h-4 w-4" />
                            {totalFilteredPosts} {t('community_posts_page.total_posts')}
                        </span>
                        <span className="flex items-center gap-1" suppressHydrationWarning>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {allPosts.filter(p => p.status === 'approved').length} {t('approved')}
                        </span>
                        <span className="flex items-center gap-1" suppressHydrationWarning>
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            {allPosts.filter(p => p.status === 'pending').length} {t('pending')}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadPosts}
                        disabled={isRefreshing}
                        className="w-full sm:w-auto shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="truncate" suppressHydrationWarning>{t('refresh')}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto shrink-0"
                        onClick={() => router.push('/auth/community/community-posts/create')}
                    >
                        <Plus className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate" suppressHydrationWarning>{t('add_item', {item: t('post')})}</span>
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
                    <AlertTitle suppressHydrationWarning>{t('error')}</AlertTitle>
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
                topics={topics}
                onPageChange={setCurrentPage}
                onDelete={(post) => {
                    setPostToDelete(post);
                    setDeleteDialogOpen(true);
                }}
                getTopicName={getTopicName}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
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

