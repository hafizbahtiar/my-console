"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CommunityPost } from "./types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
    MessageSquare,
    Plus,
    Edit,
    Trash2,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Eye,
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    Search,
    Pin,
    Lock,
    Star,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID, COMMUNITY_POSTS_COLLECTION_ID, COMMUNITY_TOPICS_COLLECTION_ID } from "@/lib/appwrite";
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

export default function CommunityPostsPage() {
    const { user } = useAuth();
    const { t } = useTranslation();
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

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<CommunityPost | null>(null);
    const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            if (!user) {
                router.push('/auth/dashboard');
                return;
            }
            await Promise.all([loadPosts(), loadTopics()]);
        };

        loadData();
    }, [user, router, currentPage, pageSize, searchTerm, statusFilter]);

    const loadPosts = async () => {
        try {
            setIsRefreshing(true);

            const needsAllData = searchTerm || statusFilter !== 'all';

            if (needsAllData) {
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
                const paginationParams = createPaginationParams(currentPage, pageSize);

                // Ensure limit and offset are valid numbers
                const limit = paginationParams.limit || DEFAULT_PAGE_SIZE;
                const offset = paginationParams.offset || 0;

                try {
                    // Try to use Appwrite native pagination with queries
                    const countResponse = await tablesDB.listRows({
                        databaseId: DATABASE_ID,
                        tableId: COMMUNITY_POSTS_COLLECTION_ID,
                    });
                    setTotalPosts(countResponse.rows.length);

                    const postsData = await tablesDB.listRows({
                        databaseId: DATABASE_ID,
                        tableId: COMMUNITY_POSTS_COLLECTION_ID,
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
                        }));

                    setPosts(sortedPosts);
                    setAllPosts(sortedPosts);
                } catch (queryError: any) {
                    // Fallback: Load all data and paginate client-side if query fails
                    console.warn('Query failed, falling back to client-side pagination:', queryError);
                    const allPostsData = await tablesDB.listRows({
                        databaseId: DATABASE_ID,
                        tableId: COMMUNITY_POSTS_COLLECTION_ID,
                    });

                    const allSortedPosts = allPostsData.rows
                        .map((row: any) => ({
                            ...row,
                            tags: Array.isArray(row.tags) ? row.tags : [],
                        }))
                        .sort((a: any, b: any) => new Date(b.$updatedAt || b.$createdAt || 0).getTime() - new Date(a.$updatedAt || a.$createdAt || 0).getTime());

                    setTotalPosts(allSortedPosts.length);
                    setAllPosts(allSortedPosts);

                    // Apply pagination client-side
                    const paginatedPosts = allSortedPosts.slice(offset, offset + limit);
                    setPosts(paginatedPosts);
                }
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
                const errorMsg = t('community.posts.auth_error', {
                    defaultValue: 'You do not have permission to access community posts. Please contact an administrator to set up the required permissions.'
                });
                setError(errorMsg);
                toast.error(errorMsg);
            } else {
                setError(t('general_use.error'));
                toast.error(t('general_use.error'));
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

            toast.success(t('general_use.success'));
            setDeleteDialogOpen(false);
            setPostToDelete(null);
            await loadPosts();
        } catch (error) {
            console.error('Failed to delete community post:', error);
            toast.error(t('general_use.error'));
        }
    };

    const openViewDialog = (post: CommunityPost) => {
        setSelectedPost(post);
        setViewDialogOpen(true);
    };

    // Determine if we need to filter
    const needsFiltering = searchTerm || statusFilter !== 'all';

    // Filter all posts first, then paginate
    const filteredAllPosts = needsFiltering ? allPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.author && post.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
            post.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : allPosts;

    // Apply pagination to filtered results
    const paginationParams = createPaginationParams(currentPage, pageSize);
    const filteredPosts = needsFiltering ? filteredAllPosts.slice(
        paginationParams.offset || 0,
        (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
    ) : posts;

    const totalFilteredPosts = filteredAllPosts.length;
    const totalPages = getTotalPages(totalFilteredPosts, pageSize);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage > 1 && needsFiltering) {
            setCurrentPage(1);
        }
    }, [searchTerm, statusFilter]);

    const getTopicName = (post: CommunityPost) => {
        if (post.communityTopics) {
            if (typeof post.communityTopics === 'object' && post.communityTopics.name) {
                return post.communityTopics.name;
            } else if (typeof post.communityTopics === 'string') {
                const topic = topics.find(t => t.$id === post.communityTopics);
                return topic?.name || post.communityTopics;
            }
        }
        return t("general_use.uncategorized", { defaultValue: "Uncategorized" });
    };

    if (isLoading) {
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
                    <h1 className="text-3xl font-bold tracking-tight">{t("community.posts.title")}</h1>
                    <p className="text-muted-foreground text-lg">
                        {t("community.posts.subtitle")}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {totalFilteredPosts} {t("community.posts.total_posts")}
                        </span>
                        <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {allPosts.filter(p => p.status === 'approved').length} {t("community.posts.approved_count")}
                        </span>
                        <span className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            {allPosts.filter(p => p.status === 'pending').length} {t("community.posts.pending_count")}
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
                        <Link href="/auth/community/community-posts/create">
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
                        {t("community.posts.search_filter")}
                    </CardTitle>
                    <CardDescription>
                        {t("community.posts.search_filter_desc")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t("community.posts.search_posts")}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder={t("community.posts.search_placeholder")}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t("community.posts.status_filter")}
                            </label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder={t("community.posts.filter_by_status")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <span>{t("community.posts.all_status")}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                                            <span>{t("status.pending")}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.filter(p => p.status === 'pending').length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>{t("status.approved")}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.filter(p => p.status === 'approved').length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                            <span>{t("status.rejected")}</span>
                                            <Badge variant="secondary" className="text-xs">
                                                {allPosts.filter(p => p.status === 'rejected').length}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-gray-500" />
                                            <span>{t("status.archived")}</span>
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
                                {t("community.posts.clear_filters")}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("general_use.error")}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Posts Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        {t("community.posts.title")} ({totalFilteredPosts})
                    </CardTitle>
                    <CardDescription>
                        {t("community.posts.manage_content")} - {t("general_use.showing_entries_paginated", {
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
                                <TableHead className="font-semibold">{t("community.posts.topic")}</TableHead>
                                <TableHead className="font-semibold">{t("general_use.status")}</TableHead>
                                <TableHead className="font-semibold">{t("general_use.views")}</TableHead>
                                <TableHead className="font-semibold">{t("community.posts.upvotes")}</TableHead>
                                <TableHead className="font-semibold">{t("community.posts.replies")}</TableHead>
                                <TableHead className="text-right font-semibold">{t("general_use.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-48" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-20" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-6 w-16" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-12" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-12" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-12" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Skeleton className="h-8 w-8" />
                                                <Skeleton className="h-8 w-8" />
                                                <Skeleton className="h-8 w-8" />
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
                                            <div className="flex items-center gap-2">
                                                {post.isPinned && <Pin className="h-3 w-3 text-primary" />}
                                                {post.isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                                                {post.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                                                <div>
                                                    <div className="font-medium group-hover:text-primary transition-colors">
                                                        {post.title}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">{post.slug}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {post.author || t("community.posts.anonymous")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {getTopicName(post)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell><StatusBadge status={post.status} type="community-post" /></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Eye className="h-4 w-4" />
                                                <span className="font-medium">{post.views}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <ThumbsUp className="h-4 w-4" />
                                                <span className="font-medium">{post.upvotes}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <MessageCircle className="h-4 w-4" />
                                                <span className="font-medium">{post.replyCount}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <TooltipProvider>
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openViewDialog(post);
                                                                }}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t("general_use.view")}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <Link href={`/auth/community/community-posts/${post.$id}/edit`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t("general_use.edit")}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
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
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{t("general_use.delete")}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TooltipProvider>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : null}
                        </TableBody>
                    </Table>

                    {filteredPosts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <MessageSquare className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                {error && error.includes('permission')
                                    ? t("community.posts.auth_error_title", { defaultValue: "Permission Denied" })
                                    : t("community.posts.no_posts_found")
                                }
                            </h3>
                            <p className="text-muted-foreground text-center max-w-md mb-6">
                                {error && error.includes('permission')
                                    ? error
                                    : searchTerm || statusFilter !== 'all'
                                        ? t("community.posts.adjust_filters")
                                        : t("community.posts.create_first_post")
                                }
                            </p>
                            {(!searchTerm && statusFilter === 'all' && !error) && (
                                <Button asChild>
                                    <Link href="/auth/community/community-posts/create">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("community.posts.create_first_post_button")}
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
                            <DialogTitle className="text-2xl font-bold leading-tight flex items-center gap-2">
                                {selectedPost?.isPinned && <Pin className="h-5 w-5 text-primary" />}
                                {selectedPost?.isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                                {selectedPost?.isFeatured && <Star className="h-5 w-5 text-yellow-500" />}
                                {selectedPost?.title}
                            </DialogTitle>
                            {selectedPost?.excerpt && (
                                <DialogDescription className="text-base">
                                    {selectedPost.excerpt}
                                </DialogDescription>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedPost && (
                        <div className="space-y-8 py-6">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.author")}</p>
                                    <p className="font-medium">{selectedPost.author || t("community.posts.anonymous")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.status")}</p>
                                    <StatusBadge status={selectedPost.status} type="community-post" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("community.posts.topic")}</p>
                                    <p className="font-medium">{getTopicName(selectedPost)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.views")}</p>
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        <span className="font-medium">{selectedPost.views}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("community.posts.upvotes")}</p>
                                    <div className="flex items-center gap-1">
                                        <ThumbsUp className="h-4 w-4" />
                                        <span className="font-medium">{selectedPost.upvotes}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("community.posts.downvotes")}</p>
                                    <div className="flex items-center gap-1">
                                        <ThumbsDown className="h-4 w-4" />
                                        <span className="font-medium">{selectedPost.downvotes}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("community.posts.replies")}</p>
                                    <div className="flex items-center gap-1">
                                        <MessageCircle className="h-4 w-4" />
                                        <span className="font-medium">{selectedPost.replyCount}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("community.posts.created")}</p>
                                    <p className="font-medium">
                                        {selectedPost.$createdAt ? new Date(selectedPost.$createdAt).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Tags */}
                            {selectedPost.tags && selectedPost.tags.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("general_use.tags")}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPost.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="text-sm">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* Content */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("community.posts.content")}</h4>
                                <div className="border rounded-lg p-6 bg-background prose prose-sm max-w-none dark:prose-invert">
                                    <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="border-t pt-6">
                        <div className="flex items-center justify-between w-full">
                            <div className="text-sm text-muted-foreground">
                                {t("general_use.updated")}: {selectedPost?.$updatedAt ? new Date(selectedPost.$updatedAt).toLocaleString() : '-'}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                                    {t("general_use.close")}
                                </Button>
                                <Button asChild>
                                    <Link href={`/auth/community/community-posts/${selectedPost?.$id}/edit`}>
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
                        <AlertDialogTitle>{t("community.posts.delete_post")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("community.posts.delete_confirmation", { title: postToDelete?.title || '' })}
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

