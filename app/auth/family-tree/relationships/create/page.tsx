"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { tablesDB, DATABASE_ID, RELATIONSHIPS_COLLECTION_ID, PERSONS_COLLECTION_ID, account } from "@/lib/appwrite";
import { ID } from "appwrite";
import { Person, Relationship } from "../../persons/types";

export default function CreateRelationshipPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [persons, setPersons] = useState<Person[]>([]);

    const [formData, setFormData] = useState({
        personA: '',
        personB: '',
        type: 'other' as Relationship['type'],
        date: '',
        place: '',
        note: '',
        isBidirectional: true,
        status: 'active' as 'active' | 'inactive' | 'archived' | 'draft',
        metadata: '',
    });

    useEffect(() => {
        if (!authLoading && user) {
            loadPersons();
            setIsLoading(false);
        }
    }, [authLoading, user]);

    const loadPersons = async () => {
        try {
            const response = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: PERSONS_COLLECTION_ID,
            });
            setPersons(response.rows as unknown as Person[]);
        } catch (error) {
            console.error('Error loading persons:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.personA || !formData.personB) {
            toast.error(t('family_tree.relationships.validation.both_persons_required'));
            return;
        }

        if (formData.personA === formData.personB) {
            toast.error(t('family_tree.relationships.validation.different_persons'));
            return;
        }

        setIsSubmitting(true);

        try {
            const currentUser = await account.get();

            const relationshipData: any = {
                personA: formData.personA,
                personB: formData.personB,
                type: formData.type,
                isBidirectional: formData.isBidirectional,
                status: formData.status,
            };

            if (formData.date) relationshipData.date = formData.date;
            if (formData.place) relationshipData.place = formData.place;
            if (formData.note) relationshipData.note = formData.note;
            if (formData.metadata) relationshipData.metadata = formData.metadata;

            await tablesDB.createRow({
                databaseId: DATABASE_ID,
                tableId: RELATIONSHIPS_COLLECTION_ID,
                rowId: ID.unique(),
                data: relationshipData,
            });

            toast.success(t('family_tree.relationships.created_success'));
            router.push('/auth/family-tree/relationships');
        } catch (error: any) {
            console.error('Error creating relationship:', error);
            toast.error(error.message || t('error'));
        } finally {
            setIsSubmitting(false);
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
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/auth/family-tree/relationships')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('back')}
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
                    {t('family_tree.relationships.create_title')}
                </h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle suppressHydrationWarning>{t('family_tree.relationships.relationship_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="personA" suppressHydrationWarning>{t('family_tree.relationships.person_a')} *</Label>
                                <Select
                                    value={formData.personA}
                                    onValueChange={(value) => setFormData({ ...formData, personA: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('family_tree.relationships.select_person')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {persons.map((person) => (
                                            <SelectItem key={person.$id} value={person.$id}>
                                                {person.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="personB" suppressHydrationWarning>{t('family_tree.relationships.person_b')} *</Label>
                                <Select
                                    value={formData.personB}
                                    onValueChange={(value) => setFormData({ ...formData, personB: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('family_tree.relationships.select_person')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {persons.map((person) => (
                                            <SelectItem key={person.$id} value={person.$id}>
                                                {person.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type" suppressHydrationWarning>{t('family_tree.relationships.type')} *</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: Relationship['type']) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="married">{t('family_tree.relationships.type_married')}</SelectItem>
                                    <SelectItem value="divorced">{t('family_tree.relationships.type_divorced')}</SelectItem>
                                    <SelectItem value="parent">{t('family_tree.relationships.type_parent')}</SelectItem>
                                    <SelectItem value="child">{t('family_tree.relationships.type_child')}</SelectItem>
                                    <SelectItem value="sibling">{t('family_tree.relationships.type_sibling')}</SelectItem>
                                    <SelectItem value="cousin">{t('family_tree.relationships.type_cousin')}</SelectItem>
                                    <SelectItem value="other">{t('family_tree.relationships.type_other')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date" suppressHydrationWarning>{t('family_tree.relationships.date')}</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="place" suppressHydrationWarning>{t('family_tree.relationships.place')}</Label>
                                <Input
                                    id="place"
                                    value={formData.place}
                                    onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                                    maxLength={300}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="note" suppressHydrationWarning>{t('family_tree.relationships.note')}</Label>
                            <Textarea
                                id="note"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                rows={3}
                                maxLength={2000}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isBidirectional"
                                    checked={formData.isBidirectional}
                                    onChange={(e) => setFormData({ ...formData, isBidirectional: e.target.checked })}
                                />
                                <Label htmlFor="isBidirectional" suppressHydrationWarning>{t('family_tree.relationships.is_bidirectional')}</Label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/auth/family-tree/relationships')}
                            >
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {t('saving')}
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {t('save')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

