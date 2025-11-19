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
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { tablesDB, DATABASE_ID, FAMILIES_COLLECTION_ID, PERSONS_COLLECTION_ID, account } from "@/lib/appwrite";
import { ID } from "appwrite";
import { Person } from "../../persons/types";

export default function CreateFamilyPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
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

        // At least one partner or child required
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
                createdBy: currentUser.$id,
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

            const family = await tablesDB.createRow({
                databaseId: DATABASE_ID,
                tableId: FAMILIES_COLLECTION_ID,
                rowId: ID.unique(),
                data: familyData,
            });

            toast.success(t('family_tree.families.created_success'));
            router.push(`/auth/family-tree/families/${family.$id}`);
        } catch (error: any) {
            console.error('Error creating family:', error);
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

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
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
                    {t('family_tree.families.create_title')}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="marriageDate" suppressHydrationWarning>{t('family_tree.families.marriage_date')}</Label>
                                <Input
                                    id="marriageDate"
                                    type="date"
                                    value={formData.marriageDate}
                                    onChange={(e) => setFormData({ ...formData, marriageDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="marriagePlace" suppressHydrationWarning>{t('family_tree.families.marriage_place')}</Label>
                                <Input
                                    id="marriagePlace"
                                    value={formData.marriagePlace}
                                    onChange={(e) => setFormData({ ...formData, marriagePlace: e.target.value })}
                                    maxLength={300}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isDivorced"
                                    checked={formData.isDivorced}
                                    onChange={(e) => setFormData({ ...formData, isDivorced: e.target.checked })}
                                />
                                <Label htmlFor="isDivorced" suppressHydrationWarning>{t('family_tree.families.is_divorced')}</Label>
                            </div>
                        </div>

                        {formData.isDivorced && (
                            <div className="space-y-2">
                                <Label htmlFor="divorceDate" suppressHydrationWarning>{t('family_tree.families.divorce_date')}</Label>
                                <Input
                                    id="divorceDate"
                                    type="date"
                                    value={formData.divorceDate}
                                    onChange={(e) => setFormData({ ...formData, divorceDate: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isHistoric"
                                    checked={formData.isHistoric}
                                    onChange={(e) => setFormData({ ...formData, isHistoric: e.target.checked })}
                                />
                                <Label htmlFor="isHistoric" suppressHydrationWarning>{t('family_tree.families.is_historic')}</Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status" suppressHydrationWarning>{t('family_tree.families.status')}</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: 'active' | 'inactive' | 'archived' | 'draft') => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">{t('family_tree.families.status_active')}</SelectItem>
                                    <SelectItem value="inactive">{t('family_tree.families.status_inactive')}</SelectItem>
                                    <SelectItem value="archived">{t('family_tree.families.status_archived')}</SelectItem>
                                    <SelectItem value="draft">{t('family_tree.families.status_draft')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/auth/family-tree/families')}
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

