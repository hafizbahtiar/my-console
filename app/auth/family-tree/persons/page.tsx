"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Person } from "@/app/auth/family-tree/persons/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Users,
    Plus,
    AlertCircle,
    RefreshCw,
    CheckCircle,
    UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE, optimizedPagination } from "@/lib/pagination";
import { tablesDB, DATABASE_ID, PERSONS_COLLECTION_ID } from "@/lib/appwrite";
import {
    PersonsFilters,
    PersonsTable,
    DeletePersonDialog,
} from "@/components/app/auth/family-tree/persons";

export default function PersonsPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();

    // State
    const [persons, setPersons] = useState<Person[]>([]);
    const [allPersons, setAllPersons] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [genderFilter, setGenderFilter] = useState<string>('all');

    // Dialog states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [totalPersons, setTotalPersons] = useState(0);
    const [needsClientSideFiltering, setNeedsClientSideFiltering] = useState(false);

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

            await loadPersons();
        };

        loadData();
    }, [user, authLoading, currentPage, pageSize, searchTerm, statusFilter, genderFilter, t]);

    const loadPersons = async () => {
        try {
            setIsRefreshing(true);
            setError(null);

            // Check if we need client-side filtering
            const hasFilters = searchTerm.trim().length > 0 || statusFilter !== 'all' || genderFilter !== 'all';
            setNeedsClientSideFiltering(hasFilters);

            if (hasFilters) {
                // When filters are active, load all data for client-side filtering
                const allPersonsData = await tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: PERSONS_COLLECTION_ID,
                });

                const allSortedPersons = (allPersonsData.rows as unknown as Person[])
                    .sort((a: Person, b: Person) => 
                        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
                    );

                setTotalPersons(allSortedPersons.length);
                setAllPersons(allSortedPersons);
            } else {
                // When no filters, use optimized server-side pagination
                const filters: Array<{ field: string; operator: string; value: any }> = [];

                const result = await optimizedPagination<Person>(
                    tablesDB.listRows.bind(tablesDB),
                    {
                        databaseId: DATABASE_ID,
                        tableId: PERSONS_COLLECTION_ID,
                        page: currentPage,
                        pageSize: pageSize,
                        orderBy: '$createdAt',
                        orderDirection: 'desc',
                        filters: filters,
                    }
                );

                setPersons(result.data);
                setTotalPersons(result.total);
                setAllPersons([]); // Clear allPersons when using server-side pagination
            }

            setError(null);
        } catch (err: any) {
            console.error('Failed to load persons:', err);
            
            // Check for unauthorized error
            if (err?.code === 401 || err?.code === 403 || err?.message?.includes('not authorized') || err?.message?.includes('Unauthorized')) {
                const errorMsg = `Permission denied. Please set Read permission to "users" (authenticated users) on the '${PERSONS_COLLECTION_ID}' table in Appwrite Console.`;
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

    const handleDeletePerson = async () => {
        if (!personToDelete) return;

        try {
            await tablesDB.deleteRow({
                databaseId: DATABASE_ID,
                tableId: PERSONS_COLLECTION_ID,
                rowId: personToDelete.$id,
            });

            toast.success(t('family_tree.persons.deleted_success'));
            setDeleteDialogOpen(false);
            setPersonToDelete(null);
            await loadPersons();
        } catch (error: any) {
            console.error('Error deleting person:', error);
            toast.error(error.message || t('error'));
        }
    };

    // Determine which persons to display
    const filteredAllPersons = needsClientSideFiltering ? allPersons.filter(person => {
        const matchesSearch = !searchTerm ||
            person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (person.firstName && person.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (person.lastName && person.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
        const matchesGender = genderFilter === 'all' || person.gender === genderFilter;
        return matchesSearch && matchesStatus && matchesGender;
    }) : [];

    // Apply pagination to filtered results
    const paginationParams = createPaginationParams(currentPage, pageSize);
    const filteredPersons = needsClientSideFiltering
        ? filteredAllPersons.slice(
            paginationParams.offset || 0,
            (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
        )
        : persons;

    const totalFilteredPersons = needsClientSideFiltering ? filteredAllPersons.length : totalPersons;
    const totalPages = Math.ceil(totalFilteredPersons / pageSize);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage > 1 && (searchTerm || statusFilter !== 'all' || genderFilter !== 'all')) {
            setCurrentPage(1);
        }
    }, [searchTerm, statusFilter, genderFilter]);

    // Show skeleton while loading
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
                        {t('family_tree.persons.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg" suppressHydrationWarning>
                        {t('family_tree.persons.description')}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <UserCircle className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            {t('family_tree.persons.total_persons', { count: totalFilteredPersons.toString() })}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                            {(needsClientSideFiltering ? allPersons : persons).filter(p => p.status === 'active').length} {t('family_tree.persons.active')}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" suppressHydrationWarning>
                            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                            {(needsClientSideFiltering ? allPersons : persons).filter(p => p.status === 'draft').length} {t('family_tree.persons.drafts')}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={loadPersons}
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
                        onClick={() => router.push('/auth/family-tree/persons/create')}
                    >
                        <Plus className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate" suppressHydrationWarning>{t('create_item', {item: t('family_tree.persons.person')})}</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <PersonsFilters
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                genderFilter={genderFilter}
                allPersons={allPersons}
                onSearchChange={setSearchTerm}
                onStatusFilterChange={setStatusFilter}
                onGenderFilterChange={setGenderFilter}
                onClearFilters={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setGenderFilter('all');
                }}
            />

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription suppressHydrationWarning>{error}</AlertDescription>
                </Alert>
            )}

            {/* Persons Table */}
            <PersonsTable
                persons={filteredPersons}
                totalPersons={totalFilteredPersons}
                currentPage={currentPage}
                pageSize={pageSize}
                isLoading={isLoading}
                onPageChange={setCurrentPage}
                onDelete={(person: Person) => {
                    setPersonToDelete(person);
                    setDeleteDialogOpen(true);
                }}
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                genderFilter={genderFilter}
                onCreate={() => router.push('/auth/family-tree/persons/create')}
            />

            {/* Delete Confirmation Dialog */}
            <DeletePersonDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                person={personToDelete}
                onConfirm={handleDeletePerson}
            />
        </div>
    );
}

