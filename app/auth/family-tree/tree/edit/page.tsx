"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, Save, ArrowLeft, Undo2, Redo2, UserPlus, UserMinus, Edit } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { tablesDB, DATABASE_ID, PERSONS_COLLECTION_ID, FAMILIES_COLLECTION_ID, RELATIONSHIPS_COLLECTION_ID, account } from "@/lib/appwrite";
import { Query, ID } from "appwrite";

export default function EditableFamilyTreePage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();
    const chartInstanceRef = useRef<any>(null);
    const editTreeInstanceRef = useRef<any>(null);

    const [treeData, setTreeData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

    useEffect(() => {
        if (user && !authLoading) {
            loadTreeData();
        }
    }, [user, authLoading]);

    const loadTreeData = async () => {
        try {
            setIsRefreshing(true);
            setError(null);

            // Fetch all persons
            const personsResponse = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: PERSONS_COLLECTION_ID,
                queries: [Query.equal('status', 'active')],
            });
            const persons = personsResponse.rows;

            // Fetch all families
            const familiesResponse = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: FAMILIES_COLLECTION_ID,
                queries: [Query.equal('status', 'active')],
            });
            const families = familiesResponse.rows;

            // Transform to family-chart format
            const individuals = persons.map((person: any) => ({
                id: person.$id,
                name: person.name || getFullName(person),
                'first name': person.firstName || '',
                'last name': person.lastName || '',
                'middle name': person.middleName || '',
                'nickname': person.nickname || '',
                gender: person.gender,
                photo: person.photo,
                'birth date': person.birthDate ? new Date(person.birthDate).toLocaleDateString() : '',
                'death date': person.deathDate ? new Date(person.deathDate).toLocaleDateString() : '',
                'birth place': person.birthPlace || '',
                'death place': person.deathPlace || '',
                occupation: person.occupation || '',
                email: person.email || '',
                phone: person.phone || '',
                isDeceased: person.isDeceased,
                ...person,
            }));

            const familiesData = families.map((family: any) => {
                const familyData: any = {};
                if (family.husband) familyData.husband = family.husband;
                if (family.wife) familyData.wife = family.wife;
                const allPartners = getAllPartners(family);
                if (allPartners.length > 0) {
                    familyData.partners = allPartners;
                }
                if (family.children && family.children.length > 0) {
                    familyData.children = family.children;
                }
                return familyData;
            });

            setTreeData({
                individuals,
                families: familiesData,
            });
            setError(null);
        } catch (err: any) {
            console.error('Failed to load tree data:', err);
            
            if (err?.code === 401 || err?.code === 403 || err?.message?.includes('not authorized') || err?.message?.includes('Unauthorized')) {
                const errorMsg = `Permission denied. Please set Read permission to "users" (authenticated users) on the family tree tables in Appwrite Console.`;
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

    // Helper functions
    function getAllPartners(family: any): string[] {
        const partners: string[] = [];
        if (family.husband) partners.push(family.husband);
        if (family.wife) partners.push(family.wife);
        if (family.partners && family.partners.length > 0) {
            partners.push(...family.partners);
        }
        return [...new Set(partners)];
    }

    function getFullName(person: any): string {
        if (person.name) return person.name;
        const parts: string[] = [];
        if (person.title) parts.push(person.title);
        if (person.firstName) parts.push(person.firstName);
        if (person.middleName) parts.push(person.middleName);
        if (person.lastName) parts.push(person.lastName);
        return parts.join(' ') || 'Unknown';
    }

    // Transform { individuals, families } format to Datum[] format
    function transformToDatumArray(data: { individuals: any[], families: any[] }): any[] {
        const { individuals, families } = data;
        const relationshipsMap = new Map<string, { parents: string[], spouses: string[], children: string[] }>();
        
        individuals.forEach((ind: any) => {
            relationshipsMap.set(ind.id, { parents: [], spouses: [], children: [] });
        });
        
        families.forEach((family: any) => {
            const allPartners = getAllPartners(family);
            const children = family.children || [];
            
            // Link partners as spouses
            for (let i = 0; i < allPartners.length; i++) {
                for (let j = i + 1; j < allPartners.length; j++) {
                    const partner1 = relationshipsMap.get(allPartners[i]);
                    const partner2 = relationshipsMap.get(allPartners[j]);
                    if (partner1 && !partner1.spouses.includes(allPartners[j])) {
                        partner1.spouses.push(allPartners[j]);
                    }
                    if (partner2 && !partner2.spouses.includes(allPartners[i])) {
                        partner2.spouses.push(allPartners[i]);
                    }
                }
            }
            
            // Link children to parents
            children.forEach((childId: string) => {
                const childRels = relationshipsMap.get(childId);
                if (childRels) {
                    allPartners.forEach((parentId: string) => {
                        if (!childRels.parents.includes(parentId)) {
                            childRels.parents.push(parentId);
                        }
                    });
                }
                allPartners.forEach((parentId: string) => {
                    const parentRels = relationshipsMap.get(parentId);
                    if (parentRels && !parentRels.children.includes(childId)) {
                        parentRels.children.push(childId);
                    }
                });
            });
        });
        
        return individuals.map((ind: any) => ({
            id: ind.id,
            data: {
                gender: ind.gender || 'U',
                name: ind.name,
                'first name': ind['first name'] || '',
                'last name': ind['last name'] || '',
                'middle name': ind['middle name'] || '',
                'nickname': ind['nickname'] || '',
                photo: ind.photo,
                'birth date': ind['birth date'] || '',
                'death date': ind['death date'] || '',
                'birth place': ind['birth place'] || '',
                'death place': ind['death place'] || '',
                occupation: ind.occupation || '',
                email: ind.email || '',
                phone: ind.phone || '',
                isDeceased: ind.isDeceased,
                ...ind,
            },
            rels: relationshipsMap.get(ind.id) || { parents: [], spouses: [], children: [] },
        }));
    }

    // Save changes back to Appwrite
    const saveChanges = async () => {
        if (!editTreeInstanceRef.current || !chartInstanceRef.current) {
            toast.error('No changes to save');
            return;
        }

        setIsSaving(true);
        try {
            const currentUser = await account.get();
            const updatedData = editTreeInstanceRef.current.exportData();

            // Process each person in the updated data
            for (const datum of updatedData) {
                const personId = datum.id;
                const personData = datum.data;

                // Check if this is a new person (doesn't exist in our database)
                const existingPerson = treeData.individuals.find((ind: any) => ind.id === personId);
                
                if (!existingPerson) {
                    // Create new person
                    const newPersonData: any = {
                        name: personData.name || `${personData['first name']} ${personData['last name']}`.trim() || 'Unknown',
                        firstName: personData['first name'] || '',
                        lastName: personData['last name'] || '',
                        middleName: personData['middle name'] || '',
                        nickname: personData['nickname'] || '',
                        gender: personData.gender || 'U',
                        birthDate: personData['birth date'] ? new Date(personData['birth date']).toISOString() : undefined,
                        deathDate: personData['death date'] ? new Date(personData['death date']).toISOString() : undefined,
                        birthPlace: personData['birth place'] || '',
                        deathPlace: personData['death place'] || '',
                        occupation: personData.occupation || '',
                        email: personData.email || '',
                        phone: personData.phone || '',
                        photo: personData.photo || '',
                        isDeceased: personData.isDeceased || false,
                        status: 'active',
                        isPublic: false,
                        displayOrder: 0,
                        createdBy: currentUser.$id,
                    };

                    await tablesDB.createRow({
                        databaseId: DATABASE_ID,
                        tableId: PERSONS_COLLECTION_ID,
                        rowId: personId,
                        data: newPersonData,
                    });
                } else {
                    // Update existing person
                    const updateData: any = {
                        name: personData.name || existingPerson.name,
                        firstName: personData['first name'] || existingPerson.firstName || '',
                        lastName: personData['last name'] || existingPerson.lastName || '',
                        middleName: personData['middle name'] || existingPerson.middleName || '',
                        nickname: personData['nickname'] || existingPerson.nickname || '',
                        gender: personData.gender || existingPerson.gender,
                        updatedBy: currentUser.$id,
                    };

                    if (personData['birth date']) {
                        updateData.birthDate = new Date(personData['birth date']).toISOString();
                    }
                    if (personData['death date']) {
                        updateData.deathDate = new Date(personData['death date']).toISOString();
                    }
                    if (personData['birth place']) updateData.birthPlace = personData['birth place'];
                    if (personData['death place']) updateData.deathPlace = personData['death place'];
                    if (personData.occupation) updateData.occupation = personData.occupation;
                    if (personData.email) updateData.email = personData.email;
                    if (personData.phone) updateData.phone = personData.phone;
                    if (personData.photo) updateData.photo = personData.photo;
                    if (personData.isDeceased !== undefined) updateData.isDeceased = personData.isDeceased;

                    await tablesDB.updateRow({
                        databaseId: DATABASE_ID,
                        tableId: PERSONS_COLLECTION_ID,
                        rowId: personId,
                        data: updateData,
                    });
                }
            }

            // Update families based on relationships
            // This is a simplified approach - you may want to enhance this
            // to handle family updates more comprehensively

            toast.success(t('family_tree.tree.edit.saved_success') || 'Changes saved successfully');
            setHasUnsavedChanges(false);
            
            // Reload tree data
            await loadTreeData();
        } catch (error: any) {
            console.error('Error saving changes:', error);
            toast.error(error.message || t('error'));
        } finally {
            setIsSaving(false);
        }
    };

    // Initialize and configure the editable family chart
    useEffect(() => {
        if (treeData && typeof window !== 'undefined') {
            let chartInstance: any = null;
            let editTreeInstance: any = null;

            import('family-chart').then((familyChartModule: any) => {
                const container = document.getElementById('editable-family-tree-container');
                if (!container) return;

                container.innerHTML = '';

                try {
                    const familyChart = familyChartModule.default || familyChartModule;
                    const createChart = familyChart?.createChart || familyChartModule.createChart;
                    
                    if (!createChart || typeof createChart !== 'function') {
                        throw new Error('createChart function not found in family-chart module');
                    }

                    const formattedData = transformToDatumArray(treeData);
                    chartInstance = createChart(container, formattedData);
                    chartInstanceRef.current = chartInstance;

                    // Configure card display
                    const cardHtml = chartInstance.setCardHtml();
                    cardHtml
                        .setCardDisplay([
                            ["first name", "last name"],
                            ["birth date"],
                            ["occupation"]
                        ])
                        .setCardImageField("photo")
                        .setStyle('imageCircleRect');

                    // Enable editing
                    editTreeInstance = chartInstance.editTree();
                    editTreeInstanceRef.current = editTreeInstance;

                    // Set editable fields
                    editTreeInstance.setFields([
                        "first name",
                        "last name",
                        "middle name",
                        "nickname",
                        "gender",
                        "birth date",
                        "death date",
                        "birth place",
                        "death place",
                        "occupation",
                        "email",
                        "phone",
                        "photo"
                    ]);

                    // Handle data changes
                    editTreeInstance.setOnChange(() => {
                        setHasUnsavedChanges(true);
                        // Update history state
                        if (editTreeInstance.history) {
                            setHistoryState({
                                canUndo: editTreeInstance.history.canUndo?.() || false,
                                canRedo: editTreeInstance.history.canRedo?.() || false,
                            });
                        }
                    });

                    // Enable add/remove relative buttons
                    editTreeInstance.setCanAdd(true);
                    editTreeInstance.setCanEdit(true);
                    editTreeInstance.setCanDelete(true);

                    // Set card click to open edit form (must be after editTree is initialized)
                    cardHtml.setOnCardClick((e: MouseEvent, d: any) => {
                        if (editTreeInstance) {
                            editTreeInstance.open(d);
                        }
                    });

                    // Set main person
                    if (formattedData.length > 0) {
                        chartInstance.updateMainId(formattedData[0].id);
                    }

                    // Update tree
                    chartInstance.updateTree({ initial: true });

                } catch (error: any) {
                    console.error('Error initializing editable family-chart:', error);
                    toast.error(`Failed to initialize editable family tree: ${error.message || 'Unknown error'}`);
                }
            }).catch((error) => {
                console.error('Error loading family-chart:', error);
                toast.error('Failed to load family tree visualization.');
            });

            return () => {
                if (chartInstance && typeof chartInstance.destroy === 'function') {
                    chartInstance.destroy();
                }
            };
        }
    }, [treeData, t]);

    // History controls
    const handleUndo = () => {
        if (editTreeInstanceRef.current?.history?.undo) {
            editTreeInstanceRef.current.history.undo();
            setHasUnsavedChanges(true);
        }
    };

    const handleRedo = () => {
        if (editTreeInstanceRef.current?.history?.redo) {
            editTreeInstanceRef.current.history.redo();
            setHasUnsavedChanges(true);
        }
    };

    // Add relative
    const handleAddRelative = () => {
        if (editTreeInstanceRef.current && chartInstanceRef.current) {
            try {
                const mainDatum = chartInstanceRef.current.getMainDatum();
                if (mainDatum) {
                    editTreeInstanceRef.current.addRelative(mainDatum);
                    setHasUnsavedChanges(true);
                } else {
                    toast.error('Please select a person first');
                }
            } catch (error: any) {
                console.error('Error adding relative:', error);
                toast.error('Failed to add relative');
            }
        }
    };

    // Remove relative
    const handleRemoveRelative = () => {
        if (editTreeInstanceRef.current && chartInstanceRef.current) {
            try {
                const mainDatum = chartInstanceRef.current.getMainDatum();
                if (mainDatum) {
                    // Use the removeRelativeInstance to remove a relative
                    if (editTreeInstanceRef.current.removeRelativeInstance) {
                        editTreeInstanceRef.current.removeRelativeInstance.removeRelative(mainDatum);
                        setHasUnsavedChanges(true);
                    }
                } else {
                    toast.error('Please select a person first');
                }
            } catch (error: any) {
                console.error('Error removing relative:', error);
                toast.error('Failed to remove relative');
            }
        }
    };

    if (translationLoading || isLoading || authLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
            <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
                        {t('family_tree.tree.edit.title') || 'Edit Family Tree'}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg" suppressHydrationWarning>
                        {t('family_tree.tree.edit.description') || 'Click on any person card to edit, or use the buttons below to add/remove relatives'}
                    </p>
                    {hasUnsavedChanges && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            {t('family_tree.tree.edit.unsaved_changes') || 'Unsaved changes'}
                        </Badge>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/auth/family-tree/tree')}
                        size="sm"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('back') || 'Back'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={loadTreeData}
                        disabled={isRefreshing}
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {t('refresh')}
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Toolbar */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddRelative}
                            disabled={!editTreeInstanceRef.current}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            {t('family_tree.tree.edit.add_relative') || 'Add Relative'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveRelative}
                            disabled={!editTreeInstanceRef.current}
                        >
                            <UserMinus className="h-4 w-4 mr-2" />
                            {t('family_tree.tree.edit.remove_relative') || 'Remove Relative'}
                        </Button>
                        <div className="h-6 w-px bg-border mx-2" />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUndo}
                            disabled={!historyState.canUndo}
                        >
                            <Undo2 className="h-4 w-4 mr-2" />
                            {t('undo') || 'Undo'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRedo}
                            disabled={!historyState.canRedo}
                        >
                            <Redo2 className="h-4 w-4 mr-2" />
                            {t('redo') || 'Redo'}
                        </Button>
                        <div className="flex-1" />
                        <Button
                            onClick={saveChanges}
                            disabled={!hasUnsavedChanges || isSaving}
                            size="sm"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? (t('saving') || 'Saving...') : (t('save') || 'Save Changes')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle suppressHydrationWarning>
                        {t('family_tree.tree.edit.visualization') || 'Editable Family Tree'}
                    </CardTitle>
                    <CardDescription suppressHydrationWarning>
                        {t('family_tree.tree.edit.visualization_description') || 'Click on any person card to edit their information'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {treeData ? (
                        <div id="editable-family-tree-container" className="w-full h-[700px] border rounded-lg bg-background" />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-muted-foreground mb-4" suppressHydrationWarning>
                                {t('family_tree.tree.no_data')}
                            </p>
                            <Button onClick={() => router.push('/auth/family-tree/persons/create')}>
                                {t('create_item', {item: t('family_tree.persons.person')})}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {treeData && (
                <Card>
                    <CardHeader>
                        <CardTitle suppressHydrationWarning>{t('family_tree.tree.statistics')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <div className="text-2xl font-bold" suppressHydrationWarning>
                                    {treeData.individuals?.length || 0}
                                </div>
                                <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                                    {t('family_tree.tree.individuals')}
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold" suppressHydrationWarning>
                                    {treeData.families?.length || 0}
                                </div>
                                <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                                    {t('family_tree.tree.families')}
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold" suppressHydrationWarning>
                                    {treeData.families?.reduce((acc: number, f: any) => acc + (f.children?.length || 0), 0) || 0}
                                </div>
                                <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                                    {t('family_tree.tree.total_children')}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

