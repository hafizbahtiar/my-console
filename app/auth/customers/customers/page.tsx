"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Customer } from "./types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users,
    Plus,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE, optimizedPagination } from "@/lib/pagination";
import {
    CustomersFilters,
    CustomersTable,
    ViewCustomerDialog,
    DeleteCustomerDialog,
} from "@/components/app/auth/customers";
import { CustomerImportExport } from "@/components/app/auth/customers";
import { CustomerBulkOperations } from "@/components/app/auth/customers/customer-bulk-operations";
import { getCSRFHeadersAlt } from "@/lib/csrf-utils";

export default function CustomersPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();

    // State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]); // Store all customers for filtering
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [needsClientSideFiltering, setNeedsClientSideFiltering] = useState(false);

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Selection state for bulk operations
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            if (authLoading) {
                return;
            }

            if (!user) {
                setIsLoading(false);
                return;
            }

            await loadCustomers();
        };

        loadData();
    }, [user, authLoading, currentPage, pageSize, searchTerm, statusFilter, t]);

    const loadCustomers = async () => {
        try {
            setIsRefreshing(true);
            setError(null);

            // Check if we need client-side filtering (search or status filter active)
            const hasFilters = searchTerm.trim().length > 0 || statusFilter !== 'all';
            setNeedsClientSideFiltering(hasFilters);

            if (hasFilters) {
                // When filters are active, load all data for client-side filtering
                const allCustomersData = await tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: CUSTOMERS_COLLECTION_ID,
                });

                const allSortedCustomers = allCustomersData.rows
                    .map((row: any) => ({
                        ...row,
                        totalRevenue: row.totalRevenue || 0,
                        totalInvoices: row.totalInvoices || 0,
                    }))
                    .sort((a: Customer, b: Customer) => 
                        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
                    );

                setAllCustomers(allSortedCustomers);
                setTotalCustomers(allSortedCustomers.length);
            } else {
                // Server-side pagination when no filters
                const paginationParams = createPaginationParams(currentPage, pageSize);
                
                try {
                    const response = await tablesDB.listRows({
                        databaseId: DATABASE_ID,
                        tableId: CUSTOMERS_COLLECTION_ID,
                        queries: [
                            Query.orderDesc('$createdAt'),
                            ...(paginationParams.limit ? [Query.limit(paginationParams.limit)] : []),
                            ...(paginationParams.offset ? [Query.offset(paginationParams.offset)] : []),
                        ],
                    });

                    const sortedCustomers = response.rows
                        .map((row: any) => ({
                            ...row,
                            totalRevenue: row.totalRevenue || 0,
                            totalInvoices: row.totalInvoices || 0,
                        }))
                        .sort((a: Customer, b: Customer) => 
                            new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
                        );

                    setCustomers(sortedCustomers);
                    setTotalCustomers(response.total);
                } catch (serverError) {
                    // Fallback to client-side if server-side fails
                    console.warn('Server-side pagination failed, using client-side:', serverError);
                    const allCustomersData = await tablesDB.listRows({
                        databaseId: DATABASE_ID,
                        tableId: CUSTOMERS_COLLECTION_ID,
                    });

                    const allSortedCustomers = allCustomersData.rows
                        .map((row: any) => ({
                            ...row,
                            totalRevenue: row.totalRevenue || 0,
                            totalInvoices: row.totalInvoices || 0,
                        }))
                        .sort((a: Customer, b: Customer) => 
                            new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
                        );

                    setAllCustomers(allSortedCustomers);
                    setTotalCustomers(allSortedCustomers.length);
                    setNeedsClientSideFiltering(true);
                }
            }
        } catch (error: any) {
            console.error('Failed to load customers:', error);
            setError(error.message || t('customers_page.failed_to_load'));
            toast.error(error.message || t('customers_page.failed_to_load'));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleDelete = async () => {
        if (!customerToDelete) return;

        try {
            setIsDeleting(true);
            
            const headers = await getCSRFHeadersAlt();
            
            const response = await fetch(`/api/customers/${customerToDelete.$id}`, {
                method: 'DELETE',
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('error'));
            }

            // Log deletion in audit log
            if (user) {
                auditLogger.logSecurityEvent(user.$id, 'CUSTOMER_DELETED', {
                    customerId: customerToDelete.$id,
                    customerName: customerToDelete.name,
                }).catch(() => {});
            }

            toast.success(t('customers_page.delete_dialog.deleted_success'));
            setDeleteDialogOpen(false);
            setCustomerToDelete(null);
            await loadCustomers();
        } catch (error: any) {
            console.error('Failed to delete customer:', error);
            toast.error(error.message || t('error'));
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteDialog = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteDialogOpen(true);
    };

    const openViewDialog = (customer: Customer) => {
        setSelectedCustomer(customer);
        setViewDialogOpen(true);
    };

    const openEditDialog = (customer: Customer) => {
        router.push(`/auth/customers/customers/${customer.$id}/edit`);
    };

    // Determine which customers to display
    const filteredAllCustomers = needsClientSideFiltering ? allCustomers.filter(customer => {
        const matchesSearch = !searchTerm ||
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (customer.company && customer.company.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : [];

    // Apply pagination to filtered results (only when client-side filtering is active)
    const paginationParams = createPaginationParams(currentPage, pageSize);
    const filteredCustomers = needsClientSideFiltering
        ? filteredAllCustomers.slice(
            paginationParams.offset || 0,
            (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
        )
        : customers; // Use server-side paginated customers when no filters

    const totalFilteredCustomers = needsClientSideFiltering ? filteredAllCustomers.length : totalCustomers;

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage > 1 && (searchTerm || statusFilter !== 'all')) {
            setCurrentPage(1);
        }
    }, [searchTerm, statusFilter]);

    // Show skeleton while translations or data is loading
    if (translationLoading || isLoading || authLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                {/* Header Skeleton */}
                <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
                        <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
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
                        {t('customers_page.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg" suppressHydrationWarning>
                        {t('customers_page.description')}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <CustomerImportExport onImportComplete={loadCustomers} />
                    <Button
                        variant="outline"
                        onClick={loadCustomers}
                        disabled={isRefreshing}
                        className="w-full sm:w-auto shrink-0"
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span className="truncate" suppressHydrationWarning>{t('refresh')}</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto shrink-0"
                        size="sm"
                        onClick={() => router.push('/auth/customers/customers/create')}
                    >
                        <Plus className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate" suppressHydrationWarning>{t('create_item', {item: t('customer')})}</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <CustomersFilters
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                allCustomers={allCustomers}
                onSearchChange={setSearchTerm}
                onStatusFilterChange={setStatusFilter}
                onClearFilters={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                }}
            />

            {/* Bulk Operations */}
            <CustomerBulkOperations
                selectedIds={selectedIds}
                onComplete={() => {
                    setSelectedIds([]);
                    loadCustomers();
                }}
                onExport={async (ids) => {
                    try {
                        // Get selected customers data
                        const selectedCustomers = allCustomers.filter(c => ids.includes(c.$id));
                        
                        // Transform for export
                        const exportData = selectedCustomers.map((customer: any) => {
                            const { $id, $createdAt, $updatedAt, ...rest } = customer;
                            const parsed: any = {
                                id: $id,
                                createdAt: $createdAt,
                                updatedAt: $updatedAt,
                                ...rest,
                            };

                            // Parse JSON fields
                            if (parsed.notes && typeof parsed.notes === 'string') {
                                try {
                                    parsed.notes = JSON.parse(parsed.notes);
                                } catch {}
                            }

                            if (parsed.metadata && typeof parsed.metadata === 'string') {
                                try {
                                    parsed.metadata = JSON.parse(parsed.metadata);
                                } catch {}
                            }

                            return parsed;
                        });

                        // Create and download JSON file
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `customers-selected-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);

                        toast.success(t('customers_page.bulk.exported_success', { count: ids.length.toString() }));
                    } catch (error: any) {
                        console.error('Bulk export failed:', error);
                        toast.error(error.message || t('customers_page.bulk.export_failed'));
                    }
                }}
            />

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription suppressHydrationWarning>{error}</AlertDescription>
                </Alert>
            )}

            {/* Customers Table */}
            <CustomersTable
                customers={filteredCustomers}
                totalCustomers={totalFilteredCustomers}
                currentPage={currentPage}
                pageSize={pageSize}
                isLoading={isLoading}
                onPageChange={setCurrentPage}
                onView={openViewDialog}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onCreate={() => router.push('/auth/customers/customers/create')}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
            />

            {/* View Dialog */}
            <ViewCustomerDialog
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                customer={selectedCustomer}
                onEdit={() => {
                    setViewDialogOpen(false);
                    if (selectedCustomer) {
                        openEditDialog(selectedCustomer);
                    }
                }}
            />

            {/* Delete Dialog */}
            <DeleteCustomerDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                customer={customerToDelete}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}

