"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Family } from "../persons/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertCircle, RefreshCw, CheckCircle, Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE, optimizedPagination } from "@/lib/pagination";
import { tablesDB, DATABASE_ID, FAMILIES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
    FamiliesFilters,
    FamiliesTable,
    DeleteFamilyDialog,
} from "@/components/app/auth/family-tree/families";

export default function FamiliesPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();

    const [families, setFamilies] = useState<Family[]>([]);
    const [allFamilies, setAllFamilies] = useState<Family[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [familyToDelete, setFamilyToDelete] = useState<Family | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    const [totalFamilies, setTotalFamilies] = useState(0);
    const [needsClientSideFiltering, setNeedsClientSideFiltering] = useState(false);

    useEffect(() => {
        if (user && !authLoading) {
            loadFamilies();
        }
    }, [user, authLoading, currentPage, pageSize, searchTerm, statusFilter]);

    const loadFamilies = async () => {
        try {
            setIsRefreshing(true);
            setError(null);

            // Check if we need client-side filtering
            const hasFilters = searchTerm.trim().length > 0 || statusFilter !== 'all';
            setNeedsClientSideFiltering(hasFilters);

            if (hasFilters) {
                // When filters are active, load all data for client-side filtering
                const allFamiliesData = await tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: FAMILIES_COLLECTION_ID,
                });

                const allSortedFamilies = (allFamiliesData.rows as unknown as Family[])
                    .sort((a: Family, b: Family) => 
                        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
                    );

                setTotalFamilies(allSortedFamilies.length);
                setAllFamilies(allSortedFamilies);
            } else {
                // When no filters, use optimized server-side pagination
                const filters: Array<{ field: string; operator: string; value: any }> = [];

                const result = await optimizedPagination<Family>(
                    tablesDB.listRows.bind(tablesDB),
                    {
                        databaseId: DATABASE_ID,
                        tableId: FAMILIES_COLLECTION_ID,
                        page: currentPage,
                        pageSize: pageSize,
                        orderBy: '$createdAt',
                        orderDirection: 'desc',
                        filters: filters,
                    }
                );

                setFamilies(result.data);
                setTotalFamilies(result.total);
                setAllFamilies([]); // Clear allFamilies when using server-side pagination
            }

            setError(null);
        } catch (err: any) {
            console.error('Failed to load families:', err);
            
            if (err?.code === 401 || err?.code === 403 || err?.message?.includes('not authorized') || err?.message?.includes('Unauthorized')) {
                const errorMsg = `Permission denied. Please set Read permission to "users" (authenticated users) on the '${FAMILIES_COLLECTION_ID}' table in Appwrite Console.`;
                setError(errorMsg);
                toast.error('Unauthorized: Check table permissions in Appwrite Console');
            } else {
                setError(t('error'));
                toast.error(t('error'));
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleDeleteFamily = async () => {
        if (!familyToDelete) return;

        try {
            await tablesDB.deleteRow({
                databaseId: DATABASE_ID,
                tableId: FAMILIES_COLLECTION_ID,
                rowId: familyToDelete.$id,
            });

            toast.success(t('family_tree.families.deleted_success'));
            setDeleteDialogOpen(false);
            setFamilyToDelete(null);
            await loadFamilies();
        } catch (error: any) {
            console.error('Error deleting family:', error);
            toast.error(error.message || t('error'));
        }
    };

    // Determine which families to display
    const filteredAllFamilies = needsClientSideFiltering ? allFamilies.filter(family => {
        const matchesSearch = !searchTerm ||
            (family.familyName && family.familyName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || family.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : [];

    // Apply pagination to filtered results
    const paginationParams = createPaginationParams(currentPage, pageSize);
    const filteredFamilies = needsClientSideFiltering
        ? filteredAllFamilies.slice(
            paginationParams.offset || 0,
            (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
        )
        : families;

    const totalFilteredFamilies = needsClientSideFiltering ? filteredAllFamilies.length : totalFamilies;
    const totalPages = Math.ceil(totalFilteredFamilies / pageSize);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage > 1 && (searchTerm || statusFilter !== 'all')) {
            setCurrentPage(1);
        }
    }, [searchTerm, statusFilter]);

    if (translationLoading || isLoading || authLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
                        <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
                        <div className="flex flex-wrap gap-3 sm:gap-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Skeleton className="h-10 w-full sm:w-24" />
                        <Skeleton className="h-10 w-full sm:w-32" />
                    </div>
                </div>
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-96 w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
                        {t('family_tree.families.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg" suppressHydrationWarning>
                        {t('family_tree.families.description')}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <Heart className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            {t('family_tree.families.total_families', { count: totalFilteredFamilies.toString() })}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                            {(needsClientSideFiltering ? allFamilies : families).filter(f => f.status === 'active').length} {t('family_tree.families.active')}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={loadFamilies}
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
                        onClick={() => router.push('/auth/family-tree/families/create')}
                    >
                        <Plus className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate" suppressHydrationWarning>{t('create_item', {item: t('family_tree.families.family')})}</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <FamiliesFilters
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                allFamilies={allFamilies}
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
                    <AlertDescription suppressHydrationWarning>{error}</AlertDescription>
                </Alert>
            )}

            {/* Families Table */}
            <FamiliesTable
                families={filteredFamilies}
                totalFamilies={totalFilteredFamilies}
                currentPage={currentPage}
                pageSize={pageSize}
                isLoading={isLoading}
                onPageChange={setCurrentPage}
                onDelete={(family: Family) => {
                    setFamilyToDelete(family);
                    setDeleteDialogOpen(true);
                }}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                onCreate={() => router.push('/auth/family-tree/families/create')}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteFamilyDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                family={familyToDelete}
                onConfirm={handleDeleteFamily}
            />
        </div>
    );
}

