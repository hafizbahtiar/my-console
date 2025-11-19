"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Relationship } from "../persons/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertCircle, RefreshCw, CheckCircle, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE, optimizedPagination } from "@/lib/pagination";
import { tablesDB, DATABASE_ID, RELATIONSHIPS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import {
    RelationshipsFilters,
    RelationshipsTable,
    DeleteRelationshipDialog,
} from "@/components/app/auth/family-tree/relationships";

export default function RelationshipsPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();

    const [relationships, setRelationships] = useState<Relationship[]>([]);
    const [allRelationships, setAllRelationships] = useState<Relationship[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [relationshipToDelete, setRelationshipToDelete] = useState<Relationship | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    const [totalRelationships, setTotalRelationships] = useState(0);
    const [needsClientSideFiltering, setNeedsClientSideFiltering] = useState(false);

    useEffect(() => {
        if (user && !authLoading) {
            loadRelationships();
        }
    }, [user, authLoading, currentPage, pageSize, typeFilter]);

    const loadRelationships = async () => {
        try {
            setIsRefreshing(true);
            setError(null);

            // Check if we need client-side filtering
            const hasFilters = typeFilter !== 'all';
            setNeedsClientSideFiltering(hasFilters);

            if (hasFilters) {
                // When filters are active, load all data for client-side filtering
                const allRelationshipsData = await tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: RELATIONSHIPS_COLLECTION_ID,
                });

                const allSortedRelationships = (allRelationshipsData.rows as unknown as Relationship[])
                    .sort((a: Relationship, b: Relationship) =>
                        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
                    );

                setTotalRelationships(allSortedRelationships.length);
                setAllRelationships(allSortedRelationships);
            } else {
                // When no filters, use optimized server-side pagination
                const filters: Array<{ field: string; operator: string; value: any }> = [];

                const result = await optimizedPagination<Relationship>(
                    tablesDB.listRows.bind(tablesDB),
                    {
                        databaseId: DATABASE_ID,
                        tableId: RELATIONSHIPS_COLLECTION_ID,
                        page: currentPage,
                        pageSize: pageSize,
                        orderBy: '$createdAt',
                        orderDirection: 'desc',
                        filters: filters,
                    }
                );

                setRelationships(result.data);
                setTotalRelationships(result.total);
                setAllRelationships([]); // Clear allRelationships when using server-side pagination
            }

            setError(null);
        } catch (err: any) {
            console.error('Failed to load relationships:', err);

            if (err?.code === 401 || err?.code === 403 || err?.message?.includes('not authorized') || err?.message?.includes('Unauthorized')) {
                const errorMsg = `Permission denied. Please set Read permission to "users" (authenticated users) on the '${RELATIONSHIPS_COLLECTION_ID}' table in Appwrite Console.`;
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

    const handleDeleteRelationship = async () => {
        if (!relationshipToDelete) return;

        try {
            await tablesDB.deleteRow({
                databaseId: DATABASE_ID,
                tableId: RELATIONSHIPS_COLLECTION_ID,
                rowId: relationshipToDelete.$id,
            });

            toast.success(t('family_tree.relationships.deleted_success'));
            setDeleteDialogOpen(false);
            setRelationshipToDelete(null);
            await loadRelationships();
        } catch (error: any) {
            console.error('Error deleting relationship:', error);
            toast.error(error.message || t('error'));
        }
    };

    // Determine which relationships to display
    const filteredAllRelationships = needsClientSideFiltering ? allRelationships.filter(relationship => {
        const matchesType = typeFilter === 'all' || relationship.type === typeFilter;
        return matchesType;
    }) : [];

    // Apply pagination to filtered results
    const paginationParams = createPaginationParams(currentPage, pageSize);
    const filteredRelationships = needsClientSideFiltering
        ? filteredAllRelationships.slice(
            paginationParams.offset || 0,
            (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
        )
        : relationships;

    const totalFilteredRelationships = needsClientSideFiltering ? filteredAllRelationships.length : totalRelationships;
    const totalPages = Math.ceil(totalFilteredRelationships / pageSize);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage > 1 && typeFilter !== 'all') {
            setCurrentPage(1);
        }
    }, [typeFilter]);

    if (translationLoading || isLoading || authLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
                        <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
                        <div className="flex flex-wrap gap-3 sm:gap-4">
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
                        {t('family_tree.relationships.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg" suppressHydrationWarning>
                        {t('family_tree.relationships.description')}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            {t('family_tree.relationships.total_relationships', { count: totalFilteredRelationships.toString() })}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                            {(needsClientSideFiltering ? allRelationships : relationships).filter(r => r.status === 'active').length} {t('family_tree.relationships.active')}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={loadRelationships}
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
                        onClick={() => router.push('/auth/family-tree/relationships/create')}
                    >
                        <Plus className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate" suppressHydrationWarning>{t('create_item', { item: t('family_tree.relationships.relationship') })}</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <RelationshipsFilters
                typeFilter={typeFilter}
                allRelationships={allRelationships}
                onTypeFilterChange={setTypeFilter}
                onClearFilters={() => {
                    setTypeFilter('all');
                }}
            />

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription suppressHydrationWarning>{error}</AlertDescription>
                </Alert>
            )}

            {/* Relationships Table */}
            <RelationshipsTable
                relationships={filteredRelationships}
                totalRelationships={totalFilteredRelationships}
                currentPage={currentPage}
                pageSize={pageSize}
                isLoading={isLoading}
                onPageChange={setCurrentPage}
                onDelete={(relationship: Relationship) => {
                    setRelationshipToDelete(relationship);
                    setDeleteDialogOpen(true);
                }}
                typeFilter={typeFilter}
                onCreate={() => router.push('/auth/family-tree/relationships/create')}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteRelationshipDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                relationship={relationshipToDelete}
                onConfirm={handleDeleteRelationship}
            />
        </div>
    );
}

