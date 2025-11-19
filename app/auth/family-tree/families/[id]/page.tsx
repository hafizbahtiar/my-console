"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Family, Person } from "../../persons/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { tablesDB, DATABASE_ID, FAMILIES_COLLECTION_ID, PERSONS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";

export default function FamilyViewPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const familyId = params.id as string;

    const [family, setFamily] = useState<Family | null>(null);
    const [persons, setPersons] = useState<Record<string, Person>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (familyId) {
            loadFamily();
        }
    }, [familyId]);

    const loadFamily = async () => {
        try {
            setIsLoading(true);

            const [familyResponse, personsResponse] = await Promise.all([
                tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: FAMILIES_COLLECTION_ID,
                    queries: [
                        Query.equal('$id', familyId),
                        Query.limit(1),
                    ],
                }),
                tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: PERSONS_COLLECTION_ID,
                }),
            ]);

            if (!familyResponse.rows || familyResponse.rows.length === 0) {
                throw new Error('Family not found');
            }

            const familyData = familyResponse.rows[0] as unknown as Family;
            setFamily(familyData);

            const personsMap: Record<string, Person> = {};
            personsResponse.rows.forEach((person: any) => {
                personsMap[person.$id] = person as Person;
            });
            setPersons(personsMap);
        } catch (error: any) {
            console.error('Error loading family:', error);
            toast.error(error.message || t('error'));
        } finally {
            setIsLoading(false);
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

    if (!family) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                <p suppressHydrationWarning>{t('family_tree.families.not_found')}</p>
            </div>
        );
    }

    const allPartners = [
        ...(family.husband ? [family.husband] : []),
        ...(family.wife ? [family.wife] : []),
        ...(family.partners || []),
    ];

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/auth/family-tree/families')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('back')}
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
                        {family.familyName || t('family_tree.families.unnamed_family')}
                    </h1>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push(`/auth/family-tree/families/${familyId}/edit`)}
                >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('edit')}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle suppressHydrationWarning>{t('family_tree.families.partners')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {allPartners.length === 0 ? (
                            <p className="text-muted-foreground" suppressHydrationWarning>{t('family_tree.families.no_partners')}</p>
                        ) : (
                            allPartners.map((partnerId) => (
                                <div key={partnerId}>
                                    {persons[partnerId] ? (
                                        <a
                                            href={`/auth/family-tree/persons/${partnerId}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {persons[partnerId].name}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">{partnerId}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle suppressHydrationWarning>{t('family_tree.families.children')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {(family.children || []).length === 0 ? (
                            <p className="text-muted-foreground" suppressHydrationWarning>{t('family_tree.families.no_children')}</p>
                        ) : (
                            family.children.map((childId) => (
                                <div key={childId}>
                                    {persons[childId] ? (
                                        <a
                                            href={`/auth/family-tree/persons/${childId}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {persons[childId].name}
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">{childId}</span>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {family.marriageDate && (
                <Card>
                    <CardHeader>
                        <CardTitle suppressHydrationWarning>{t('family_tree.families.marriage_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="font-medium" suppressHydrationWarning>{t('family_tree.families.marriage_date')}:</span>
                            <span className="ml-2">{new Date(family.marriageDate).toLocaleDateString()}</span>
                        </div>
                        {family.marriagePlace && (
                            <div>
                                <span className="font-medium" suppressHydrationWarning>{t('family_tree.families.marriage_place')}:</span>
                                <span className="ml-2">{family.marriagePlace}</span>
                            </div>
                        )}
                        {family.isDivorced && family.divorceDate && (
                            <div>
                                <span className="font-medium" suppressHydrationWarning>{t('family_tree.families.divorce_date')}:</span>
                                <span className="ml-2">{new Date(family.divorceDate).toLocaleDateString()}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

