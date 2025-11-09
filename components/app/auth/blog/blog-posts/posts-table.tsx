"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Edit, Trash2, Eye, Heart } from "lucide-react";
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
import { BlogPost } from "@/app/auth/blog/blog-posts/types";

interface PostsTableProps {
  posts: BlogPost[];
  totalPosts: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  categories: any[];
  onPageChange: (page: number) => void;
  onView: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
  getCategoryName: (post: BlogPost) => string;
  searchTerm: string;
  statusFilter: string;
}

export function PostsTable({
  posts,
  totalPosts,
  currentPage,
  pageSize,
  isLoading,
  categories,
  onPageChange,
  onView,
  onDelete,
  getCategoryName,
  searchTerm,
  statusFilter,
}: PostsTableProps) {
  const { t } = useTranslation();
  const totalPages = getTotalPages(totalPosts, pageSize);

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl" suppressHydrationWarning>
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span className="truncate">
            {t('blog_posts_page.table.title', { count: totalPosts.toString() })}
          </span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('blog_posts_page.table.description', {
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
                  {t('blog_posts_page.table.title_header')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell" suppressHydrationWarning>
                  {t('blog_posts_page.table.author')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('blog_posts_page.table.category')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('blog_posts_page.table.status')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell" suppressHydrationWarning>
                  {t('blog_posts_page.table.views')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden md:table-cell" suppressHydrationWarning>
                  {t('blog_posts_page.table.likes')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden lg:table-cell" suppressHydrationWarning>
                  {t('blog_posts_page.table.published')}
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('blog_posts_page.table.actions')}
                </TableHead>
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
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <TableRow
                    key={post.$id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => onView(post)}
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
                    <TableCell className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
                      {post.author}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryName(post)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={post.status} type="blog-post" />
                    </TableCell>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
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
                          variant="outline"
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

        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <div className="rounded-full bg-muted p-4 sm:p-6 mb-4">
              <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center" suppressHydrationWarning>
              {t('blog_posts_page.table.no_posts')}
            </h3>
            <p className="text-muted-foreground text-center text-sm sm:text-base max-w-md mb-6" suppressHydrationWarning>
              {searchTerm || statusFilter !== 'all'
                ? t('blog_posts_page.table.no_posts_filtered')
                : t('blog_posts_page.table.no_posts_empty')
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
                          onPageChange(pageNum);
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
                        onPageChange(currentPage + 1);
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
  );
}

