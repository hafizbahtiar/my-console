"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent
} from "@/components/ui/empty";
import { Users, Edit, Trash2, Eye, Plus, User, Mail, Calendar } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { useRouter } from "next/navigation";
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
import { Person } from "@/app/auth/family-tree/persons/types";

interface PersonsTableProps {
  persons: Person[];
  totalPersons: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onDelete: (person: Person) => void;
  searchTerm: string;
  statusFilter: string;
  genderFilter: string;
  onCreate?: () => void;
}

export function PersonsTable({
  persons,
  totalPersons,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onDelete,
  searchTerm,
  statusFilter,
  genderFilter,
  onCreate,
}: PersonsTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const totalPages = getTotalPages(totalPersons, pageSize);
  const hasFilters = searchTerm.trim().length > 0 || statusFilter !== 'all' || genderFilter !== 'all';
  const isEmpty = persons.length === 0 && !isLoading;

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'M':
        return <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 shrink-0" />;
      case 'F':
        return <User className="h-3 w-3 sm:h-4 sm:w-4 text-pink-500 shrink-0" />;
      default:
        return <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />;
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'M':
        return t('family_tree.persons.gender_male');
      case 'F':
        return t('family_tree.persons.gender_female');
      case 'O':
        return t('family_tree.persons.gender_other');
      default:
        return t('family_tree.persons.gender_unknown');
    }
  };

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
          <CardTitle suppressHydrationWarning>{t('family_tree.persons.table.title', { count: 0 })}</CardTitle>
          <CardDescription suppressHydrationWarning>
            {hasFilters
              ? t('family_tree.persons.table.no_persons_filtered')
              : t('family_tree.persons.table.no_persons_empty')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle suppressHydrationWarning>
                {hasFilters
                  ? t('family_tree.persons.table.empty_title_filtered')
                  : t('family_tree.persons.table.empty_title')}
              </EmptyTitle>
              <EmptyDescription suppressHydrationWarning>
                {hasFilters
                  ? t('family_tree.persons.table.empty_description_filtered')
                  : t('family_tree.persons.table.empty_description')}
              </EmptyDescription>
            </EmptyHeader>
            {!hasFilters && (
              <EmptyContent>
                <Button
                  onClick={() => {
                    if (onCreate) {
                      onCreate();
                    } else {
                      router.push('/auth/family-tree/persons/create');
                    }
                  }}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate" suppressHydrationWarning>
                    {t('create_item', {item: t('family_tree.persons.person')})}
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
        <CardTitle suppressHydrationWarning>{t('family_tree.persons.table.title', { count: totalPersons.toString() })}</CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('family_tree.persons.table.description', {
            current: persons.length.toString(),
            total: totalPersons.toString()
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('family_tree.persons.table.name_header')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('family_tree.persons.table.gender')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm hidden sm:table-cell" suppressHydrationWarning>
                  {t('family_tree.persons.table.birth_date')}
                </TableHead>
                <TableHead className="font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('family_tree.persons.table.status')}
                </TableHead>
                <TableHead className="text-right font-semibold text-xs sm:text-sm" suppressHydrationWarning>
                  {t('family_tree.persons.table.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {persons.length > 0 ? (
                persons.map((person) => (
                  <TableRow
                    key={person.$id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors group"
                    onClick={() => router.push(`/auth/family-tree/persons/${person.$id}`)}
                  >
                    <TableCell className="min-w-[200px]">
                      <div className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors">
                        {person.name}
                      </div>
                      {person.email && (
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          {person.email}
                        </div>
                      )}
                      {person.birthDate && (
                        <div className="text-xs text-muted-foreground sm:hidden mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {new Date(person.birthDate).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getGenderIcon(person.gender)}
                        <span className="text-xs sm:text-sm">{getGenderLabel(person.gender)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {person.birthDate ? (
                        <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {new Date(person.birthDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={person.status} />
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
                          <Link href={`/auth/family-tree/persons/${person.$id}`}>
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
                          <Link href={`/auth/family-tree/persons/${person.$id}/edit`}>
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(person);
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

