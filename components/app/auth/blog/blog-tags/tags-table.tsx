"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/custom/status-badge";
import { 
  Empty, 
  EmptyHeader, 
  EmptyTitle, 
  EmptyDescription, 
  EmptyMedia, 
  EmptyContent 
} from "@/components/ui/empty";
import { Tag, Edit, Trash2, Plus } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { Skeleton } from "@/components/ui/skeleton";
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

export interface BlogTag {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  name: string;
  slug: string;
  color: string;
  postCount: number;
  isActive: boolean;
}

interface TagsTableProps {
  tags: BlogTag[];
  allTags: BlogTag[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (tag: BlogTag) => void;
  onDelete: (tag: BlogTag) => void;
  onCreate?: () => void;
  isLoading?: boolean;
}

export function TagsTable({
  tags,
  allTags,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onCreate,
  isLoading = false,
}: TagsTableProps) {
  const { t } = useTranslation();
  const totalPages = getTotalPages(allTags.length, pageSize);
  const isEmpty = tags.length === 0 && !isLoading;

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
          <CardTitle suppressHydrationWarning>{t('blog_tags_page.table.title', { count: 0 })}</CardTitle>
          <CardDescription suppressHydrationWarning>
            {t('blog_tags_page.table.no_tags_empty')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Tag className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle suppressHydrationWarning>
                {t('blog_tags_page.table.empty_title')}
              </EmptyTitle>
              <EmptyDescription suppressHydrationWarning>
                {t('blog_tags_page.table.empty_description')}
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
                    {t('add_item', {item: t('tag')})}
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
        <CardTitle suppressHydrationWarning>{t('blog_tags_page.table.title', { count: allTags.length.toString() })}</CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('blog_tags_page.table.description', {
            current: tags.length.toString(),
            total: allTags.length.toString()
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm font-semibold" suppressHydrationWarning>
                  {t('name')}
                </TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold" suppressHydrationWarning>
                  {t('slug')}
                </TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold" suppressHydrationWarning>
                  {t('status')}
                </TableHead>
                <TableHead className="text-xs sm:text-sm font-semibold" suppressHydrationWarning>
                  {t('blog_tags_page.table.posts')}
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm font-semibold" suppressHydrationWarning>
                  {t('actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.$id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="font-medium text-xs sm:text-sm">{tag.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs sm:text-sm">{tag.slug}</TableCell>
                  <TableCell>
                    <StatusBadge status={tag.isActive ? "active" : "inactive"} type="blog-category" />
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">{tag.postCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(tag)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(tag)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
          <div className="border-t p-3 sm:p-4">
            <Pagination>
              <PaginationContent className="flex-wrap gap-2">
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

