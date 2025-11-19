"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Person } from "@/app/auth/family-tree/persons/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { tablesDB, DATABASE_ID, PERSONS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";

export default function PersonViewPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const personId = params.id as string;

    const [person, setPerson] = useState<Person | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (personId) {
            loadPerson();
        }
    }, [personId]);

    const loadPerson = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: PERSONS_COLLECTION_ID,
                queries: [
                    Query.equal('$id', personId),
                    Query.limit(1),
                ],
            });

            if (!response.rows || response.rows.length === 0) {
                throw new Error('Person not found');
            }

            const personData = response.rows[0] as unknown as Person;
            setPerson(personData);
        } catch (error: any) {
            console.error('Error loading person:', error);
            setError(error.message || t('error'));
            toast.error(error.message || t('error'));
        } finally {
            setIsLoading(false);
        }
    };

    const calculateAge = (birthDate?: string, deathDate?: string): number | null => {
        if (!birthDate) return null;
        const endDate = deathDate ? new Date(deathDate) : new Date();
        const startDate = new Date(birthDate);
        const age = endDate.getFullYear() - startDate.getFullYear();
        const monthDiff = endDate.getMonth() - startDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < startDate.getDate())) {
            return age - 1;
        }
        return age;
    };

    if (translationLoading || isLoading || authLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !person) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                <p suppressHydrationWarning>{error || t('family_tree.persons.not_found')}</p>
            </div>
        );
    }

    const age = calculateAge(person.birthDate, person.deathDate);

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/auth/family-tree/persons')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('back')}
                    </Button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
                        {person.name}
                    </h1>
                </div>
                <Button
                    variant="outline"
                    onClick={() => router.push(`/auth/family-tree/persons/${personId}/edit`)}
                >
                    <Edit className="h-4 w-4 mr-2" />
                    {t('edit')}
                </Button>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview" suppressHydrationWarning>{t('family_tree.persons.overview')}</TabsTrigger>
                    <TabsTrigger value="biography" suppressHydrationWarning>{t('family_tree.persons.biography')}</TabsTrigger>
                    <TabsTrigger value="families" suppressHydrationWarning>{t('family_tree.persons.families')}</TabsTrigger>
                    <TabsTrigger value="relationships" suppressHydrationWarning>{t('family_tree.persons.relationships')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle suppressHydrationWarning>{t('family_tree.persons.personal_info')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.name')}:</span>
                                    <span className="ml-2">{person.name}</span>
                                </div>
                                {person.title && (
                                    <div>
                                        <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.title')}:</span>
                                        <span className="ml-2">{person.title}</span>
                                    </div>
                                )}
                                <div>
                                    <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.gender')}:</span>
                                    <span className="ml-2">
                                        {person.gender === 'M' && t('family_tree.persons.gender_male')}
                                        {person.gender === 'F' && t('family_tree.persons.gender_female')}
                                        {person.gender === 'O' && t('family_tree.persons.gender_other')}
                                        {person.gender === 'U' && t('family_tree.persons.gender_unknown')}
                                    </span>
                                </div>
                                {age !== null && (
                                    <div>
                                        <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.age')}:</span>
                                        <span className="ml-2">{age} {t('family_tree.persons.years')}</span>
                                    </div>
                                )}
                                {person.birthDate && (
                                    <div>
                                        <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.birth_date')}:</span>
                                        <span className="ml-2">{new Date(person.birthDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {person.birthPlace && (
                                    <div>
                                        <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.birth_place')}:</span>
                                        <span className="ml-2">{person.birthPlace}</span>
                                    </div>
                                )}
                                {person.deathDate && (
                                    <div>
                                        <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.death_date')}:</span>
                                        <span className="ml-2">{new Date(person.deathDate).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle suppressHydrationWarning>{t('family_tree.persons.contact_info')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {person.email && (
                                    <div>
                                        <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.email')}:</span>
                                        <span className="ml-2">{person.email}</span>
                                    </div>
                                )}
                                {person.phone && (
                                    <div>
                                        <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.phone')}:</span>
                                        <span className="ml-2">{person.phone}</span>
                                    </div>
                                )}
                                {person.address && (
                                    <div>
                                        <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.address')}:</span>
                                        <span className="ml-2">{person.address}</span>
                                    </div>
                                )}
                                {(person.city || person.state || person.country) && (
                                    <div>
                                        <span className="font-medium" suppressHydrationWarning>{t('family_tree.persons.location')}:</span>
                                        <span className="ml-2">
                                            {[person.city, person.state, person.country].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {person.wikiId && (
                        <Card>
                            <CardHeader>
                                <CardTitle suppressHydrationWarning>{t('family_tree.persons.wikipedia')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <a
                                    href={`https://www.wikidata.org/wiki/${person.wikiId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:underline"
                                >
                                    {t('family_tree.persons.view_wikipedia')}
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="biography" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle suppressHydrationWarning>{t('family_tree.persons.biography')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {person.bio ? (
                                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: person.bio }} />
                            ) : (
                                <p className="text-muted-foreground" suppressHydrationWarning>{t('family_tree.persons.no_bio')}</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="families" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle suppressHydrationWarning>{t('family_tree.persons.families')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground" suppressHydrationWarning>{t('family_tree.persons.families_coming_soon')}</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="relationships" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle suppressHydrationWarning>{t('family_tree.persons.relationships')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground" suppressHydrationWarning>{t('family_tree.persons.relationships_coming_soon')}</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

