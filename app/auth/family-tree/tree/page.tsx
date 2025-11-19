"use client"

import React, { useState, useEffect, useRef } from "react";
import * as d3 from 'd3';
import * as f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';
import { tablesDB, DATABASE_ID, PERSONS_COLLECTION_ID, FAMILIES_COLLECTION_ID, RELATIONSHIPS_COLLECTION_ID } from "@/lib/appwrite";
import { transformFamilyTreeData, FamilyTreeTransformer } from "@/lib/family-tree-transform";
import { saveFamilyTreeChanges, validateFamilyTreeData } from "@/lib/family-tree-save";
import { FamilyChartDataArray } from "@/lib/family-tree-types";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";

export default function FamilyTreePage() {
    const cont = useRef<HTMLDivElement>(null);
    const chartRef = useRef<any>(null);
    const editTreeRef = useRef<any>(null);
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [treeData, setTreeData] = useState<f3.Data | null>(null);
    const [originalData, setOriginalData] = useState<f3.Data | null>(null);
    const [currentChartData, setCurrentChartData] = useState<f3.Data | null>(null); // Track current chart state
    const [originalPersons, setOriginalPersons] = useState<any[]>([]);
    const [originalFamilies, setOriginalFamilies] = useState<any[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (authLoading || !user) return;
        loadData();
    }, [user, authLoading]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch from Appwrite (following blog pattern)
            const [personsRes, familiesRes, relationshipsRes] = await Promise.all([
                tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: PERSONS_COLLECTION_ID,
                }),
                tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: FAMILIES_COLLECTION_ID,
                }),
                tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: RELATIONSHIPS_COLLECTION_ID,
                }),
            ]);

            const persons = personsRes.rows || [];
            const families = familiesRes.rows || [];
            const relationships = relationshipsRes.rows || [];

            console.log('Fetched data:', { persons: persons.length, families: families.length, relationships: relationships.length });

            // Transform to family-chart datum format
            const data = transformToFamilyChartData(persons, families, relationships);

            console.log('Transformed data:', data);

            // Store the transformed data
            setTreeData(data);
            setOriginalData(JSON.parse(JSON.stringify(data)));

            // Store original data for comparison
            setOriginalPersons(persons);
            setOriginalFamilies(families);
        } catch (err: any) {
            console.error('Failed to load family tree data:', err);

            if (err?.code === 401 || err?.code === 403 || err?.message?.includes('not authorized') || err?.message?.includes('Unauthorized')) {
                const errorMsg = `Permission denied. Please set Read permission to "users" (authenticated users) on the family tree tables in Appwrite Console.`;
                setError(errorMsg);
                toast.error('Unauthorized: Check table permissions in Appwrite Console');
            } else {
                const errorMsg = t('family_tree.tree.load_error') || t('error') || 'Failed to load family tree data';
                setError(errorMsg);
                toast.error(errorMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Create chart when data is ready and container is mounted
    useEffect(() => {
        if (!treeData || !cont.current || isLoading) return;

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            createChart(treeData);
        }, 100);

        return () => {
            clearTimeout(timer);
            if (chartRef.current) {
                try {
                    // Clear change detection interval
                    if ((chartRef.current as any).changeInterval) {
                        clearInterval((chartRef.current as any).changeInterval);
                    }
                    chartRef.current.destroy?.();
                } catch (e) {
                    console.warn('Error destroying chart:', e);
                }
            }
        };
    }, [treeData, isLoading]);

    const transformToFamilyChartData = (persons: any[], families: any[], relationships: any[]): f3.Data => {
        try {
            // Use the new transformation utility
            const result = transformFamilyTreeData(persons, families, relationships, {
                includePrivate: true // Include private data since this is an authenticated user
            });

            // Log any transformation errors
            if (result.metadata.errors.length > 0) {
                console.warn('Family tree transformation warnings:', result.metadata.errors);
            }

            console.log('Family tree transformation completed:', {
                personCount: result.metadata.personCount,
                familyCount: result.metadata.familyCount,
                relationshipCount: result.metadata.relationshipCount,
                transformationTime: `${result.metadata.transformationTime}ms`
            });

            return result.data;
        } catch (error) {
            console.error('Family tree transformation failed:', error);
            toast.error(t('family_tree.tree.transform_error') || t('error') || 'Failed to transform family tree data');
            return [];
        }
    };

    const createChart = (data: f3.Data) => {
        try {
            const container = document.getElementById('FamilyChart');
            if (!container) {
                throw new Error('Container #FamilyChart not found');
            }

            // Validate data before creating chart
            if (!data || !Array.isArray(data) || data.length === 0) {
                throw new Error(t('family_tree.tree.no_data') || 'No valid family tree data available');
            }

            // Clear previous chart if exists
            if (chartRef.current) {
                try {
                    // Clear change detection interval
                    if ((chartRef.current as any).changeInterval) {
                        clearInterval((chartRef.current as any).changeInterval);
                    }
                    chartRef.current.destroy?.();
                } catch (e) {
                    console.warn('Error destroying previous chart:', e);
                }
            }

            // Clear container
            container.innerHTML = '';

            // Create chart with error handling
            const f3Chart = f3.createChart('#FamilyChart', data)
                .setTransitionTime(750) // Faster transitions for better UX
                .setCardXSpacing(280)   // Slightly wider spacing
                .setCardYSpacing(180);  // More vertical space

            const f3Card = f3Chart.setCardSvg()
                .setCardDisplay([
                    ["first name", "last name"], // Show full name as primary display
                    ["birthday"],
                    ["occupation"]
                ])
                .setCardDim({ w: 200, h: 70, text_x: 75, text_y: 15, img_w: 60, img_h: 60, img_x: 5, img_y: 5 })
                .setOnCardUpdate(function (this: any) {
                    const card = this;  // here you can modify the card element if needed
                })

            // Configure editing
            const f3EditTree = (f3Chart.editTree() as any)
                .fixed(true)
                .setEditFirst(true)
                .setFields([
                    "name", "first name", "last name", "middle name", "nickname",
                    "birthday", "birth place", "occupation", "avatar"
                ])
                .setOnChange(() => {
                    // Mark that changes have been made
                    setHasUnsavedChanges(true);

                    const updatedDataT = f3EditTree.exportData()
                    console.log('[Updated Data Tracking]', updatedDataT)

                    // Try to update our tracked chart data
                    try {
                        let updatedData = null;

                        // Try edit tree export first
                        if (typeof f3EditTree.exportData === 'function') {
                            updatedData = f3EditTree.exportData();
                        }

                        // Skip getDatum as it has parameter issues - exportData should be sufficient

                        if (updatedData && Array.isArray(updatedData) && updatedData.length > 0) {
                            setCurrentChartData([...updatedData]);
                        }
                    } catch (e) {
                        // Ignore errors in data tracking - we still mark as changed
                        console.warn('Could not track chart data changes');
                    }
                });

            // Set up card click handler with error handling
            f3Card.setOnCardClick((e: MouseEvent, d: f3.TreeDatum) => {
                try {
                    if (f3EditTree && d?.data) {
                        f3EditTree.open(d.data);
                    }
                    f3Card.onCardClickDefault(e, d)
                } catch (error) {
                    console.error('Error opening edit form:', error);
                    toast.error(t('family_tree.tree.edit_form_error') || t('error') || 'Failed to open edit form');
                }
            });

            // Store edit tree reference
            editTreeRef.current = f3EditTree;

            // Enable editing
            f3EditTree.setEdit();

            // Find main datum with better logic
            const mainDatum = findMainDatum(data);
            if (mainDatum?.id) {
                f3Chart.updateMainId(mainDatum.id);
            }

            // Update tree with initial render
            f3Chart.updateTree({ initial: true });

            chartRef.current = f3Chart;

            // Change detection is now handled by edit tree setOnChange

            // Store initial chart data
            setCurrentChartData([...data]);

        } catch (error) {
            console.error('Error creating family tree chart:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            toast.error(t('family_tree.tree.create_error', { error: errorMsg }) || `Failed to create family tree: ${errorMsg}`);

            // Ensure container shows error state
            const container = document.getElementById('FamilyChart');
            if (container) {
                const errorText = t('family_tree.tree.load_error') || 'Failed to load family tree';
                container.innerHTML = `<div class="flex items-center justify-center h-64 text-muted-foreground">${errorText}</div>`;
            }
        }
    };

    // Helper function to find the best main datum
    const findMainDatum = (data: f3.Data): f3.Datum | null => {
        if (!data || data.length === 0) return null;

        // Prefer person with most relationships
        let bestDatum = data[0];
        let maxRelationships = 0;

        for (const datum of data) {
            if (!datum?.rels) continue;

            const relationshipCount =
                (datum.rels.parents?.length || 0) +
                (datum.rels.spouses?.length || 0) +
                (datum.rels.children?.length || 0);

            if (relationshipCount > maxRelationships) {
                maxRelationships = relationshipCount;
                bestDatum = datum;
            }
        }

        return bestDatum;
    };



    // Helper function to get all partners from a family
    const getAllPartners = (family: any): string[] => {
        const partners: string[] = [];
        if (family.husband) partners.push(family.husband);
        if (family.wife) partners.push(family.wife);
        if (family.partners && Array.isArray(family.partners)) {
            partners.push(...family.partners);
        }
        // Remove duplicates
        return [...new Set(partners)];
    };

    const saveChanges = async () => {
        if (!originalData) {
            toast.error(t('family_tree.tree.no_data_to_save') || t('error') || 'No data to save');
            return;
        }

        setIsSaving(true);
        try {
            const currentUser = await account.get();
            const userId = String(currentUser.$id);

            // Get current chart data - use multiple fallback methods
            let currentData = currentChartData;

            // If state tracking failed, try to get data from chart directly
            if (!currentData || currentData.length === 0) {
                if (chartRef.current) {
                    try {
                        // Skip getDatum - use exportData instead

                        if ((!currentData || currentData.length === 0) && chartRef.current.datum) {
                            currentData = chartRef.current.datum;
                        }

                        // Try edit tree export if available
                        if ((!currentData || currentData.length === 0) && editTreeRef.current?.exportData) {
                            currentData = editTreeRef.current.exportData();
                        }

                    } catch (e) {
                        console.error('Error getting data from chart:', e);
                    }
                }

                // If we still don't have data, assume no changes were made
                if (!currentData || currentData.length === 0) {
                    console.warn('Could not get current data, using original data');
                    currentData = originalData;
                }
            }

            // Validate data before saving
            const validation = validateFamilyTreeData(currentData as FamilyChartDataArray);
            if (!validation.isValid) {
                console.warn('Data validation warnings:', validation.errors);
                // Don't block saving for warnings, but log them
            }

            // Save changes using the new utility
            const saveResult = await saveFamilyTreeChanges(
                currentData as FamilyChartDataArray,
                originalData as FamilyChartDataArray,
                {
                    userId,
                    createMissingFamilies: false, // For now, don't auto-create families
                    validateRelationships: true
                }
            );

            console.log('Save result:', saveResult);

            if (saveResult.success) {
                let message = '';
                if (saveResult.savedPersons > 0 || saveResult.savedRelationships > 0) {
                    message = t('family_tree.tree.edit.saved_success_with_details', {
                        persons: String(saveResult.savedPersons),
                        relationships: String(saveResult.savedRelationships)
                    }) || `Changes saved successfully (${saveResult.savedPersons} persons, ${saveResult.savedRelationships} relationships)`;
                } else {
                    message = t('family_tree.tree.no_changes_to_save') || 'No changes to save';
                }

                toast.success(message || t('family_tree.tree.edit.saved_success') || 'Changes saved successfully');
                setHasUnsavedChanges(false);

                // Update original data for next comparison
                setCurrentChartData([...currentData]);

                // Reload data to get updated state
                await loadData();
            } else {
                const errorMsg = saveResult.errors.join(', ');
                toast.error(t('family_tree.tree.save_failed', { error: errorMsg }) || `Save failed: ${errorMsg}`);
            }
        } catch (error: any) {
            console.error('Save error:', error);
            const errorMsg = error.message || t('family_tree.tree.save_error') || t('error') || 'Failed to save changes';
            toast.error(errorMsg);
        } finally {
            setIsSaving(false);
        }
    };


    if (translationLoading || isLoading || authLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[900px] w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription suppressHydrationWarning>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
            {/* Header with Save and Refresh buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
                        {t('family_tree.tree.title') || 'Family Tree'}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base" suppressHydrationWarning>
                        {t('family_tree.tree.edit.description') || t('family_tree.tree.description') || 'Edit your family tree directly on the chart'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={loadData}
                        disabled={isLoading}
                        size="sm"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {t('refresh') || 'Refresh'}
                    </Button>
                    <Button
                        onClick={saveChanges}
                        disabled={!hasUnsavedChanges || isSaving || isLoading}
                        size="sm"
                    >
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />}
                        <Save className="h-4 w-4 mr-2 shrink-0" />
                        {t('save') || 'Save Changes'}
                    </Button>
                </div>
            </div>

            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && !isSaving && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription suppressHydrationWarning>
                        {t('family_tree.tree.edit.unsaved_changes') || t('family_tree.tree.unsaved_changes') || 'You have unsaved changes. Click Save to persist them.'}
                    </AlertDescription>
                </Alert>
            )}

            {/* Tree Chart */}
            <div className="f3" id="FamilyChart" ref={cont} style={{ width: '100%', height: '900px', margin: 'auto', backgroundColor: 'rgb(33,33,33)', color: '#fff' }}></div>
        </div>
    );
}