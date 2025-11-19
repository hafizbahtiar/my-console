"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Family, Person } from "../../../persons/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { tablesDB, DATABASE_ID, FAMILIES_COLLECTION_ID, PERSONS_COLLECTION_ID, account } from "@/lib/appwrite";
import { Query } from "appwrite";

export default function EditFamilyPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const familyId = params.id as string;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [family, setFamily] = useState<Family | null>(null);
    const [persons, setPersons] = useState<Person[]>([]);

    const [formData, setFormData] = useState({
        husband: '',
        wife: '',
        partners: [] as string[],
        children: [] as string[],
        familyName: '',
        marriageDate: '',
        marriagePlace: '',
        divorceDate: '',
        isDivorced: false,
        isHistoric: false,
        notes: '',
        metadata: '',
        status: 'active' as 'active' | 'inactive' | 'archived' | 'draft',
        displayOrder: 0,
    });

    useEffect(() => {
        if (familyId) {
            loadFamily();
            loadPersons();
        }
    }, [familyId]);

    const loadFamily = async () => {
        try {
            setIsLoading(true);
            const response = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: FAMILIES_COLLECTION_ID,
                queries: [
                    Query.equal('$id', familyId),
                    Query.limit(1),
                ],
            });

            if (!response.rows || response.rows.length === 0) {
                throw new Error('Family not found');
            }

            const familyData = response.rows[0] as unknown as Family;
            setFamily(familyData);

            setFormData({
                husband: familyData.husband || '',
                wife: familyData.wife || '',
                partners: familyData.partners || [],
                children: familyData.children || [],
                familyName: familyData.familyName || '',
                marriageDate: familyData.marriageDate ? familyData.marriageDate.split('T')[0] : '',
                marriagePlace: familyData.marriagePlace || '',
                divorceDate: familyData.divorceDate ? familyData.divorceDate.split('T')[0] : '',
                isDivorced: familyData.isDivorced || false,
                isHistoric: familyData.isHistoric || false,
                notes: familyData.notes || '',
                metadata: familyData.metadata || '',
                status: familyData.status || 'active',
                displayOrder: familyData.displayOrder || 0,
            });
        } catch (error: any) {
            console.error('Error loading family:', error);
            toast.error(error.message || t('error'));
            router.push('/auth/family-tree/families');
        } finally {
            setIsLoading(false);
        }
    };

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

        const allPartners = [
            ...(formData.husband ? [formData.husband] : []),
            ...(formData.wife ? [formData.wife] : []),
            ...formData.partners,
        ];
        if (allPartners.length === 0 && formData.children.length === 0) {
            toast.error(t('family_tree.families.validation.requires_partner_or_child'));
            return;
        }

        setIsSubmitting(true);

        try {
            const currentUser = await account.get();

            const familyData: any = {
                status: formData.status,
                displayOrder: formData.displayOrder,
                isDivorced: formData.isDivorced,
                isHistoric: formData.isHistoric,
                updatedBy: currentUser.$id,
            };

            if (formData.husband) familyData.husband = formData.husband;
            if (formData.wife) familyData.wife = formData.wife;
            if (formData.partners.length > 0) familyData.partners = formData.partners;
            if (formData.children.length > 0) familyData.children = formData.children;
            if (formData.familyName) familyData.familyName = formData.familyName;
            if (formData.marriageDate) familyData.marriageDate = formData.marriageDate;
            if (formData.marriagePlace) familyData.marriagePlace = formData.marriagePlace;
            if (formData.divorceDate) familyData.divorceDate = formData.divorceDate;
            if (formData.notes) familyData.notes = formData.notes;
            if (formData.metadata) familyData.metadata = formData.metadata;

            await tablesDB.updateRow({
                databaseId: DATABASE_ID,
                tableId: FAMILIES_COLLECTION_ID,
                rowId: familyId,
                data: familyData,
            });

            toast.success(t('family_tree.families.updated_success'));
            router.push(`/auth/family-tree/families/${familyId}`);
        } catch (error: any) {
            console.error('Error updating family:', error);
            toast.error(error.message || t('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const addPartner = () => {
        setFormData({ ...formData, partners: [...formData.partners, ''] });
    };

    const removePartner = (index: number) => {
        setFormData({ ...formData, partners: formData.partners.filter((_, i) => i !== index) });
    };

    const updatePartner = (index: number, value: string) => {
        const newPartners = [...formData.partners];
        newPartners[index] = value;
        setFormData({ ...formData, partners: newPartners });
    };

    const addChild = () => {
        setFormData({ ...formData, children: [...formData.children, ''] });
    };

    const removeChild = (index: number) => {
        setFormData({ ...formData, children: formData.children.filter((_, i) => i !== index) });
    };

    const updateChild = (index: number, value: string) => {
        const newChildren = [...formData.children];
        newChildren[index] = value;
        setFormData({ ...formData, children: newChildren });
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
        return null;
    }

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/auth/family-tree/families/${familyId}`)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('back')}
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
                    {t('family_tree.families.edit_title')}
                </h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle suppressHydrationWarning>{t('family_tree.families.family_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="familyName" suppressHydrationWarning>{t('family_tree.families.family_name')}</Label>
                            <Input
                                id="familyName"
                                value={formData.familyName}
                                onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                                maxLength={200}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="husband" suppressHydrationWarning>{t('family_tree.families.husband')}</Label>
                                <Select
                                    value={formData.husband || '__none__'}
                                    onValueChange={(value) => setFormData({ ...formData, husband: value === '__none__' ? '' : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('family_tree.families.select_person')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">{t('none')}</SelectItem>
                                        {persons.filter(p => p.gender === 'M').map((person) => (
                                            <SelectItem key={person.$id} value={person.$id}>
                                                {person.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wife" suppressHydrationWarning>{t('family_tree.families.wife')}</Label>
                                <Select
                                    value={formData.wife || '__none__'}
                                    onValueChange={(value) => setFormData({ ...formData, wife: value === '__none__' ? '' : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('family_tree.families.select_person')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">{t('none')}</SelectItem>
                                        {persons.filter(p => p.gender === 'F').map((person) => (
                                            <SelectItem key={person.$id} value={person.$id}>
                                                {person.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label suppressHydrationWarning>{t('family_tree.families.additional_partners')}</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addPartner}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('add')}
                                </Button>
                            </div>
                            {formData.partners.map((partner, index) => (
                                <div key={index} className="flex gap-2">
                                    <Select
                                        value={partner || '__none__'}
                                        onValueChange={(value) => updatePartner(index, value === '__none__' ? '' : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('family_tree.families.select_person')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">{t('none')}</SelectItem>
                                            {persons.map((person) => (
                                                <SelectItem key={person.$id} value={person.$id}>
                                                    {person.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removePartner(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label suppressHydrationWarning>{t('family_tree.families.children')}</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addChild}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    {t('add')}
                                </Button>
                            </div>
                            {formData.children.map((child, index) => (
                                <div key={index} className="flex gap-2">
                                    <Select
                                        value={child || '__none__'}
                                        onValueChange={(value) => updateChild(index, value === '__none__' ? '' : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('family_tree.families.select_person')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">{t('none')}</SelectItem>
                                            {persons.map((person) => (
                                                <SelectItem key={person.$id} value={person.$id}>
                                                    {person.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeChild(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/auth/family-tree/families/${familyId}`)}
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

