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
            toast.error("Failed to load schema");
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
                    <CardTitle className="text-base sm:text-lg">Database Collections</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                        Overview of all collections
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs sm:text-sm">Collection ID</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Name</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Documents</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Size</TableHead>
                                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Last Modified</TableHead>
                                    <TableHead className="text-xs sm:text-sm">Status</TableHead>
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
                                            <TableCell className="font-mono text-xs sm:text-sm max-w-[120px] sm:max-w-none truncate">{collection.id}</TableCell>
                                            <TableCell className="font-medium text-xs sm:text-sm truncate">{collection.name}</TableCell>
                                            <TableCell className="text-xs sm:text-sm">{collection.documents.toLocaleString()}</TableCell>
                                            <TableCell className="text-xs sm:text-sm">{collection.size}</TableCell>
                                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{new Date(collection.lastModified).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <DatabaseCollectionStatusBadge status="active" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            <p className="text-xs sm:text-sm">No collections found</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Collection Schema Dialog */}
            <Dialog open={schemaDialogOpen} onOpenChange={setSchemaDialogOpen}>
                <DialogContent className="w-[95vw] sm:w-full sm:max-w-[1200px] max-h-[90vh] sm:max-h-[85vh] p-4 sm:p-6">
                    <DialogHeader className="px-0 sm:px-0">
                        <DialogTitle className="text-base sm:text-lg pr-8">
                            {selectedCollection ? `Collection Schema: ${selectedCollection.name}` : "Collection Schema"}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                            {selectedCollection ? `Schema for ${selectedCollection.totalDocuments.toLocaleString()} documents` : "Loading schema..."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-120px)] -mx-4 sm:-mx-6 px-4 sm:px-6">
                        {schemaLoading ? (
                            <div className="flex items-center justify-center py-8 sm:py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="ml-2 text-xs sm:text-sm">Loading schema...</span>
                            </div>
                        ) : selectedCollection ? (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <Card className="p-3 sm:p-4">
                                        <CardHeader className="pb-2 px-0 pt-0">
                                            <CardTitle className="text-xs sm:text-sm font-semibold">Collection Info</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2.5 sm:space-y-3 px-0 pt-0">
                                            <div className="flex flex-col gap-1 sm:gap-2">
                                                <span className="text-xs sm:text-sm text-muted-foreground font-medium">Collection ID</span>
                                                <span className="font-mono text-xs sm:text-sm break-all bg-muted/50 p-2 rounded-md">{selectedCollection.id}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 pt-1 border-t">
                                                <span className="text-xs sm:text-sm text-muted-foreground">Total Documents</span>
                                                <span className="text-xs sm:text-sm font-semibold">{selectedCollection.totalDocuments.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 pt-1 border-t">
                                                <span className="text-xs sm:text-sm text-muted-foreground">Total Columns</span>
                                                <span className="text-xs sm:text-sm font-semibold">{selectedCollection.columns.length}</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="p-3 sm:p-4">
                                        <CardHeader className="pb-2 px-0 pt-0">
                                            <CardTitle className="text-xs sm:text-sm font-semibold">Schema Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2.5 sm:space-y-3 px-0 pt-0">
                                            {Object.entries(
                                                selectedCollection.columns.reduce((acc, col) => {
                                                    acc[col.type] = (acc[col.type] || 0) + 1;
                                                    return acc;
                                                }, {} as Record<string, number>)
                                            ).map(([type, count], index) => (
                                                <div key={type} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 ${index > 0 ? 'pt-1 border-t' : ''}`}>
                                                    <span className="text-xs sm:text-sm text-muted-foreground capitalize">{type}</span>
                                                    <Badge variant="secondary" className="text-xs w-fit">{count}</Badge>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card className="p-3 sm:p-4">
                                    <CardHeader className="px-0 pt-0 pb-3 sm:pb-4">
                                        <CardTitle className="text-sm sm:text-base">Column Details</CardTitle>
                                        <CardDescription className="text-xs sm:text-sm mt-1">Detailed information about each column in the collection</CardDescription>
                                    </CardHeader>
                                    <CardContent className="px-0 pt-0">
                                        <div className="w-full overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4">
                                            <Table className="w-full min-w-[600px]">
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs sm:text-sm min-w-[120px] sm:min-w-[150px]">Column Name</TableHead>
                                                        <TableHead className="text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]">Data Type</TableHead>
                                                        <TableHead className="text-xs sm:text-sm min-w-[60px] sm:min-w-[80px]">Nullable</TableHead>
                                                        <TableHead className="text-xs sm:text-sm min-w-[60px] sm:min-w-[80px]">Length</TableHead>
                                                        <TableHead className="text-xs sm:text-sm min-w-[150px] sm:min-w-[200px]">Sample Values</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedCollection.columns.map((column) => (
                                                        <TableRow key={column.name}>
                                                            <TableCell className="font-mono text-xs sm:text-sm font-medium break-all max-w-[150px] sm:max-w-none">{column.name}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="capitalize text-xs whitespace-nowrap">
                                                                    {column.type}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                {column.nullable ? (
                                                                    <Badge variant="secondary" className="text-xs whitespace-nowrap">Yes</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-xs whitespace-nowrap">No</Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                                                {column.length !== undefined ? column.length : '-'}
                                                            </TableCell>
                                                            <TableCell className="max-w-[150px] sm:max-w-sm">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {column.sampleValues.slice(0, 2).map((value, index) => (
                                                                        <Badge key={index} variant="secondary" className="text-xs max-w-[100px] sm:max-w-32 truncate">
                                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                        </Badge>
                                                                    ))}
                                                                    {column.sampleValues.length > 2 && (
                                                                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                                                            +{column.sampleValues.length - 2}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
