"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/custom/status-badge";
import { 
  Empty, 
  EmptyHeader, 
  EmptyTitle, 
  EmptyDescription, 
  EmptyMedia, 
  EmptyContent 
} from "@/components/ui/empty";
import { Edit, Trash2, FolderTree, MessageSquare, Plus } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { Skeleton } from "@/components/ui/skeleton";
import { CommunityTopic } from "./types";
import { getParentTopicName } from "./utils";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { getTotalPages, DEFAULT_PAGE_SIZE } from "@/lib/pagination";

interface TopicsTableProps {
    topics: CommunityTopic[];
    allTopics: CommunityTopic[];
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onEdit: (topic: CommunityTopic) => void;
    onDelete: (topic: CommunityTopic) => void;
    onCreate?: () => void;
    isLoading?: boolean;
}

export function TopicsTable({
    topics,
    allTopics,
    currentPage,
    pageSize,
    onPageChange,
    onEdit,
    onDelete,
    onCreate,
    isLoading = false,
}: TopicsTableProps) {
    const { t } = useTranslation();
    const totalPages = getTotalPages(allTopics.length, pageSize);
    const isEmpty = topics.length === 0 && !isLoading;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isEmpty) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle suppressHydrationWarning>{t('community_topics_page.table.title', { count: 0 })}</CardTitle>
                    <CardDescription suppressHydrationWarning>
                        {t('community_topics_page.table.no_topics_empty')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <MessageSquare className="h-6 w-6" />
                            </EmptyMedia>
                            <EmptyTitle suppressHydrationWarning>
                                {t('community_topics_page.table.empty_title')}
                            </EmptyTitle>
                            <EmptyDescription suppressHydrationWarning>
                                {t('community_topics_page.table.empty_description')}
                            </EmptyDescription>
                        </EmptyHeader>
                        {onCreate && (
                            <EmptyContent>
                                <Button
                                    onClick={onCreate}
                                    size="sm"
                                    className="w-full sm:w-auto"
                                >
                                    <Plus className="h-4 w-4 mr-2 shrink-0" />
                                    <span className="truncate" suppressHydrationWarning>
                                        {t('add_item', { item: t('topic') })}
                                    </span>
                                </Button>
                            </EmptyContent>
                        )}
                    </Empty>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle suppressHydrationWarning>{t('community_topics_page.table.title', { count: allTopics.length.toString() })}</CardTitle>
                <CardDescription suppressHydrationWarning>
                    {t('community_topics_page.table.description', {
                        current: topics.length.toString(),
                        total: allTopics.length.toString()
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead suppressHydrationWarning>{t('name')}</TableHead>
                                <TableHead suppressHydrationWarning>{t('slug')}</TableHead>
                                <TableHead suppressHydrationWarning>{t('community_topics_page.table.parent')}</TableHead>
                                <TableHead suppressHydrationWarning>{t('status')}</TableHead>
                                <TableHead suppressHydrationWarning>{t('community_topics_page.table.posts')}</TableHead>
                                <TableHead suppressHydrationWarning>{t('community_topics_page.table.replies')}</TableHead>
                                <TableHead suppressHydrationWarning>{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topics.map((topic) => (
                                <TableRow key={topic.$id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {topic.color && (
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: topic.color }}
                                                />
                                            )}
                                            <span className="font-medium">{topic.name}</span>
                                            {topic.parentId && (
                                                <FolderTree className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{topic.slug}</TableCell>
                                    <TableCell className="text-muted-foreground" suppressHydrationWarning>
                                        {getParentTopicName(topic.parentId, allTopics) || t('community_topics_page.table.no_parent')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <StatusBadge status={topic.isActive ? "active" : "inactive"} type="blog-category" />
                                            {!topic.isPublic && (
                                                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                                                    {t('private')}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{topic.postCount}</TableCell>
                                    <TableCell>{topic.replyCount}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit(topic)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onDelete(topic)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

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
                                                onPageChange(currentPage - 1);
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
                                                    onPageChange(pageNum);
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
                                                onPageChange(currentPage + 1);
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
    );
}

