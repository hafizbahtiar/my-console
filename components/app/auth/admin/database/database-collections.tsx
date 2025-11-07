"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatabaseCollectionStatusBadge } from "@/components/custom/status-badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertTriangle,
    Shield,
    AlertCircle,
    Ban,
    CheckCircle,
    RefreshCw,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/language-context";
import type { CollectionInfo, ColumnInfo, CollectionSchema } from "@/app/auth/admin/database/types";
import { tablesDB } from '@/lib/appwrite';
import { COLLECTION_NAMES } from "@/app/auth/admin/database/types";


interface DatabaseCollectionsProps {
    collections: CollectionInfo[];
    onRefresh: () => void;
}

async function getCollectionSchema(collectionId: string): Promise<CollectionSchema> {
    try {
        const response = await tablesDB.listRows({
            databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'console-db',
            tableId: collectionId
        });

        const documents = response.rows as Record<string, unknown>[];
        const columnMap = new Map<string, { type: string; nullable: boolean; values: unknown[] }>();

        // Sample up to 10 documents to analyze schema
        const sampleSize = Math.min(10, documents.length);

        for (let i = 0; i < sampleSize; i++) {
            const doc = documents[i];
            Object.keys(doc).forEach(key => {
                const value = doc[key];
                const existing = columnMap.get(key);

                if (!existing) {
                    columnMap.set(key, {
                        type: getValueType(value),
                        nullable: value === null || value === undefined,
                        values: [value]
                    });
                } else {
                    // Update type if more specific
                    const newType = getValueType(value);
                    if (isMoreSpecificType(existing.type, newType)) {
                        existing.type = newType;
                    }
                    // Check nullability
                    if (value !== null && value !== undefined) {
                        existing.nullable = false;
                    }
                    // Add to sample values (keep unique)
                    if (!existing.values.some(v => JSON.stringify(v) === JSON.stringify(value))) {
                        existing.values.push(value);
                    }
                }
            });
        }

        const columns: ColumnInfo[] = Array.from(columnMap.entries()).map(([name, info]) => ({
            name,
            type: info.type,
            nullable: info.nullable,
            sampleValues: info.values.slice(0, 3), // Keep only first 3 sample values
            length: getValueLength(info.values[0])
        }));

        return {
            id: collectionId,
            name: COLLECTION_NAMES[collectionId] || collectionId,
            columns,
            totalDocuments: documents.length
        };
    } catch (error) {
        console.error(`Failed to analyze schema for collection ${collectionId}:`, error);
        throw error;
    }
}

// Helper function to determine value type
function getValueType(value: unknown): string {
    if (value === null || value === undefined) return 'null';

    const type = typeof value;
    switch (type) {
        case 'string':
            // Check if it looks like a date
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value as string)) {
                return 'datetime';
            }
            return 'string';
        case 'number':
            return Number.isInteger(value) ? 'integer' : 'float';
        case 'boolean':
            return 'boolean';
        case 'object':
            if (Array.isArray(value)) {
                return 'array';
            }
            return 'object';
        default:
            return type;
    }
}

// Helper function to check if new type is more specific
function isMoreSpecificType(currentType: string, newType: string): boolean {
    const specificityOrder = ['null', 'string', 'float', 'integer', 'boolean', 'datetime', 'array', 'object'];
    return specificityOrder.indexOf(newType) > specificityOrder.indexOf(currentType);
}

// Helper function to get value length for strings/arrays
function getValueLength(value: unknown): number | undefined {
    if (typeof value === 'string') {
        return value.length;
    }
    if (Array.isArray(value)) {
        return value.length;
    }
    return undefined;
}

export function DatabaseCollections({ collections, onRefresh }: DatabaseCollectionsProps) {
    const { t } = useTranslation();
    const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<CollectionSchema | null>(null);
    const [schemaLoading, setSchemaLoading] = useState(false);

    const handleViewSchema = async (collectionId: string) => {
        setSchemaLoading(true);
        setSchemaDialogOpen(true);

        try {
            const schema = await getCollectionSchema(collectionId);
            setSelectedCollection(schema);
        } catch (error) {
            console.error('Failed to load collection schema:', error);
            toast.error(t("database.failed_to_load_schema"));
            setSchemaDialogOpen(false);
        } finally {
            setSchemaLoading(false);
        }
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />
            case 'policy_violation': return <Shield className="h-4 w-4" />
            default: return <AlertCircle className="h-4 w-4" />
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{t("database.database_collections")}</CardTitle>
                    <CardDescription>
                        {t("database.overview_of_all_collections")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("database.collection_id")}</TableHead>
                                <TableHead>{t("database.name")}</TableHead>
                                <TableHead>{t("database.documents")}</TableHead>
                                <TableHead>{t("database.size")}</TableHead>
                                <TableHead>{t("database.last_modified")}</TableHead>
                                <TableHead>{t("general_use.status")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collections.length > 0 ? (
                                collections.map((collection) => (
                                    <TableRow
                                        key={collection.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleViewSchema(collection.id)}
                                    >
                                        <TableCell className="font-mono text-sm">{collection.id}</TableCell>
                                        <TableCell className="font-medium">{collection.name}</TableCell>
                                        <TableCell>{collection.documents.toLocaleString()}</TableCell>
                                        <TableCell>{collection.size}</TableCell>
                                        <TableCell>{new Date(collection.lastModified).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <DatabaseCollectionStatusBadge status="active" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        {t("database.no_collections_found")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Collection Schema Dialog */}
            <Dialog open={schemaDialogOpen} onOpenChange={setSchemaDialogOpen}>
                <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCollection ? t("database.collection_schema", { name: selectedCollection.name }) : t("database.collection_schema_title")}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedCollection ? t("database.collection_schema_description", { count: selectedCollection.totalDocuments.toLocaleString() }) : t("database.collection_schema_loading")}
                        </DialogDescription>
                    </DialogHeader>

                    {schemaLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">{t("database.loading_schema")}</span>
                        </div>
                    ) : selectedCollection ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">{t("database.collection_info")}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t("database.collection_id")}:</span>
                                            <span className="font-mono text-sm">{selectedCollection.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t("database.total_documents")}:</span>
                                            <span className="text-sm font-medium">{selectedCollection.totalDocuments.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">{t("database.total_columns")}:</span>
                                            <span className="text-sm font-medium">{selectedCollection.columns.length}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">{t("database.schema_summary")}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {Object.entries(
                                            selectedCollection.columns.reduce((acc, col) => {
                                                acc[col.type] = (acc[col.type] || 0) + 1;
                                                return acc;
                                            }, {} as Record<string, number>)
                                        ).map(([type, count]) => (
                                            <div key={type} className="flex justify-between">
                                                <span className="text-sm text-muted-foreground capitalize">{type}:</span>
                                                <Badge variant="secondary">{count}</Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t("database.column_details")}</CardTitle>
                                    <CardDescription>{t("database.column_details_description")}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table className="w-full">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[150px]">{t("database.column_name")}</TableHead>
                                                <TableHead className="min-w-[100px]">{t("database.data_type")}</TableHead>
                                                <TableHead className="min-w-[80px]">{t("database.nullable")}</TableHead>
                                                <TableHead className="min-w-[80px]">{t("database.length")}</TableHead>
                                                <TableHead className="min-w-[200px]">{t("database.sample_values")}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedCollection.columns.map((column) => (
                                                <TableRow key={column.name}>
                                                    <TableCell className="font-mono text-sm font-medium">{column.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {column.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {column.nullable ? (
                                                            <Badge variant="secondary">{t("general_use.yes")}</Badge>
                                                        ) : (
                                                            <Badge variant="outline">{t("general_use.no")}</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {column.length !== undefined ? column.length : '-'}
                                                    </TableCell>
                                                    <TableCell className="max-w-sm">
                                                        <div className="flex flex-wrap gap-1">
                                                            {column.sampleValues.slice(0, 2).map((value, index) => (
                                                                <Badge key={index} variant="secondary" className="text-xs max-w-32 truncate">
                                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                </Badge>
                                                            ))}
                                                            {column.sampleValues.length > 2 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    +{column.sampleValues.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}
