"use client";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/custom/status-badge";
import { Edit, Trash2, FolderTree, MessageSquare } from "lucide-react";
import { CommunityTopic } from "./types";
import { getParentTopicName } from "./utils";
import { useTranslation } from "@/lib/language-context";
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
}

export function TopicsTable({
    topics,
    allTopics,
    currentPage,
    pageSize,
    onPageChange,
    onEdit,
    onDelete,
}: TopicsTableProps) {
    const { t } = useTranslation();
    const totalPages = getTotalPages(allTopics.length, pageSize);

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("general_use.name")}</TableHead>
                        <TableHead>{t("community.topics.slug")}</TableHead>
                        <TableHead>{t("community.topics.parent")}</TableHead>
                        <TableHead>{t("general_use.status")}</TableHead>
                        <TableHead>{t("community.topics.posts")}</TableHead>
                        <TableHead>{t("community.topics.replies")}</TableHead>
                        <TableHead>{t("general_use.actions")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {topics.length > 0 ? (
                        topics.map((topic) => (
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
                                <TableCell className="text-muted-foreground">
                                    {getParentTopicName(topic.parentId, allTopics)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <StatusBadge status={topic.isActive ? "active" : "inactive"} type="blog-category" />
                                        {!topic.isPublic && (
                                            <span className="text-xs text-muted-foreground">{t("community.topics.private")}</span>
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
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>{t("community.topics.no_topics_found")}</p>
                                <p className="text-sm">{t("community.topics.create_first_topic")}</p>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

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
        </>
    );
}

