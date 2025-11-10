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
import { Edit, Trash2, Eye, Building2, Mail, Phone, MapPin, Plus } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { useRouter } from "next/navigation";
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
import { Customer } from "@/app/auth/customers/types";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomersTableProps {
  customers: Customer[];
  totalCustomers: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  searchTerm: string;
  statusFilter: string;
  onCreate?: () => void;
}

export function CustomersTable({
  customers,
  totalCustomers,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  searchTerm,
  statusFilter,
  onCreate,
}: CustomersTableProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const totalPages = getTotalPages(totalCustomers, pageSize);
  const hasFilters = searchTerm.trim().length > 0 || statusFilter !== 'all';
  const isEmpty = customers.length === 0 && !isLoading;

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
          <CardTitle suppressHydrationWarning>{t('customers_page.table.title', { count: 0 })}</CardTitle>
          <CardDescription suppressHydrationWarning>
            {hasFilters
              ? t('customers_page.table.no_customers_filtered')
              : t('customers_page.table.no_customers_empty')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle suppressHydrationWarning>
                {hasFilters
                  ? t('customers_page.table.empty_title_filtered')
                  : t('customers_page.table.empty_title')}
              </EmptyTitle>
              <EmptyDescription suppressHydrationWarning>
                {hasFilters
                  ? t('customers_page.table.empty_description_filtered')
                  : t('customers_page.table.empty_description')}
              </EmptyDescription>
            </EmptyHeader>
            {!hasFilters && (
              <EmptyContent>
                <Button
                  onClick={() => {
                    if (onCreate) {
                      onCreate();
                    } else {
                      router.push('/auth/customers/create');
                    }
                  }}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate" suppressHydrationWarning>
                    {t('create_item', {item: t('customer')})}
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
        <CardTitle suppressHydrationWarning>{t('customers_page.table.title', { count: totalCustomers })}</CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('customers_page.table.description', { current: customers.length, total: totalCustomers })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">{t('name')}</TableHead>
                <TableHead className="hidden sm:table-cell">{t('email')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('phone')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('company')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('status')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('customers_page.table.total_revenue')}</TableHead>
                <TableHead className="text-right">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.$id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="truncate max-w-[200px]">{customer.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
                        {customer.email && (
                          <div className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
                        <StatusBadge status={customer.status} type="customer" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {customer.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[200px]">{customer.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {customer.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {customer.company ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[150px]">{customer.company}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <StatusBadge status={customer.status} type="customer" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="font-medium">
                      {customer.currency || 'USD'} {customer.totalRevenue.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(customer)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(customer)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(customer)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => onPageChange(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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

