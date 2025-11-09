"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Edit, Trash2, Eye, ThumbsUp, MessageCircle, Pin, Lock, Star } from "lucide-react";
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
import { getTotalPages } from "@/lib/pagination";
import { CommunityPost } from "@/app/auth/community/community-posts/types";
import { Skeleton } from "@/components/ui/skeleton";

interface PostsTableProps {
  posts: CommunityPost[];
  totalPosts: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  topics: any[];
  onPageChange: (page: number) => void;
  onDelete: (post: CommunityPost) => void;
  getTopicName: (post: CommunityPost) => string;
  searchTerm: string;
  statusFilter: string;
}

export function PostsTable({
  posts,
  totalPosts,
  currentPage,
  pageSize,
  isLoading,
  topics,
  onPageChange,
  onDelete,
  getTopicName,
  searchTerm,
  statusFilter,
}: PostsTableProps) {
  const { t } = useTranslation();
  const totalPages = getTotalPages(totalPosts, pageSize);

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl" suppressHydrationWarning>
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span className="truncate">
            {t('community_posts_page.table.title', { count: totalPosts.toString() })}
          </span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('community_posts_page.table.description', {
            current: posts.length.toString(),
            total: totalPosts.toString()
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('title')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell" suppressHydrationWarning>
                  {t('author')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('community_posts_page.table.topic')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('status')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell" suppressHydrationWarning>
                  {t('community_posts_page.table.views')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell" suppressHydrationWarning>
                  {t('community_posts_page.table.upvotes')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell" suppressHydrationWarning>
                  {t('community_posts_page.table.replies')}
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('actions')}
                </TableHead>
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
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <TableRow
                    key={post.$id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="min-w-[200px]">
                      <div className="flex items-center gap-2">
                        {post.isPinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                        {post.isLocked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                        {post.isFeatured && <Star className="h-3 w-3 text-yellow-500 shrink-0" />}
                        <div>
                          <div className="font-medium text-xs sm:text-sm">
                            {post.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{post.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
                      {post.author || t('community_posts_page.table.anonymous')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getTopicName(post)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={post.status} type="community-post" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">{post.views}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">{post.upvotes}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">{post.replyCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          <Link href={`/auth/community/community-posts/${post.$id}`}>
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                        >
                          <Link href={`/auth/community/community-posts/${post.$id}/edit`}>
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(post);
                          }}
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
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

        {posts.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
              <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center" suppressHydrationWarning>
              {t('community_posts_page.table.no_posts')}
            </h3>
            <p className="text-muted-foreground text-center text-sm sm:text-base max-w-md mb-6" suppressHydrationWarning>
              {searchTerm || statusFilter !== 'all'
                ? t('community_posts_page.table.no_posts_filtered')
                : t('community_posts_page.table.no_posts_empty')
              }
            </p>
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

