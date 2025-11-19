"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { tablesDB, DATABASE_ID, PERSONS_COLLECTION_ID, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Person } from "@/app/auth/family-tree/persons/types";

export default function EditPersonPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();
    const params = useParams();
    const personId = params.id as string;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [person, setPerson] = useState<Person | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        firstName: '',
        lastName: '',
        middleName: '',
        maidenName: '',
        nickname: '',
        title: '',
        gender: 'U' as 'M' | 'F' | 'O' | 'U',
        birthDate: '',
        birthPlace: '',
        birthCountry: '',
        deathDate: '',
        deathPlace: '',
        deathCountry: '',
        isDeceased: false,
        photo: '',
        photoThumbnail: '',
        bio: '',
        wikiId: '',
        occupation: '',
        education: '',
        nationality: '',
        ethnicity: '',
        religion: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        notes: '',
        metadata: '',
        status: 'active' as 'active' | 'inactive' | 'archived' | 'draft',
        isPublic: false,
        displayOrder: 0,
    });

    useEffect(() => {
        if (personId) {
            loadPerson();
        }
    }, [personId]);

    const loadPerson = async () => {
        try {
            setIsLoading(true);
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

            // Populate form
            setFormData({
                name: personData.name || '',
                firstName: personData.firstName || '',
                lastName: personData.lastName || '',
                middleName: personData.middleName || '',
                maidenName: personData.maidenName || '',
                nickname: personData.nickname || '',
                title: personData.title || '',
                gender: personData.gender || 'U',
                birthDate: personData.birthDate ? personData.birthDate.split('T')[0] : '',
                birthPlace: personData.birthPlace || '',
                birthCountry: personData.birthCountry || '',
                deathDate: personData.deathDate ? personData.deathDate.split('T')[0] : '',
                deathPlace: personData.deathPlace || '',
                deathCountry: personData.deathCountry || '',
                isDeceased: personData.isDeceased || false,
                photo: personData.photo || '',
                photoThumbnail: personData.photoThumbnail || '',
                bio: personData.bio || '',
                wikiId: personData.wikiId || '',
                occupation: personData.occupation || '',
                education: personData.education || '',
                nationality: personData.nationality || '',
                ethnicity: personData.ethnicity || '',
                religion: personData.religion || '',
                email: personData.email || '',
                phone: personData.phone || '',
                address: personData.address || '',
                city: personData.city || '',
                state: personData.state || '',
                country: personData.country || '',
                zipCode: personData.zipCode || '',
                notes: personData.notes || '',
                metadata: personData.metadata || '',
                status: personData.status || 'active',
                isPublic: personData.isPublic || false,
                displayOrder: personData.displayOrder || 0,
            });
        } catch (error: any) {
            console.error('Error loading person:', error);
            toast.error(error.message || t('error'));
            router.push('/auth/family-tree/persons');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error(t('family_tree.persons.validation.name_required'));
            return;
        }

        setIsSubmitting(true);

        try {
            // Get current user
            const currentUser = await account.get();

            // Prepare data (remove undefined values)
            const personData: any = {
                name: formData.name,
                gender: formData.gender,
                status: formData.status,
                isPublic: formData.isPublic,
                displayOrder: formData.displayOrder,
                isDeceased: formData.isDeceased,
                updatedBy: currentUser.$id,
            };

            // Add optional fields only if they have values
            if (formData.firstName) personData.firstName = formData.firstName;
            if (formData.lastName) personData.lastName = formData.lastName;
            if (formData.middleName) personData.middleName = formData.middleName;
            if (formData.maidenName) personData.maidenName = formData.maidenName;
            if (formData.nickname) personData.nickname = formData.nickname;
            if (formData.title) personData.title = formData.title;
            if (formData.birthDate) personData.birthDate = formData.birthDate;
            if (formData.birthPlace) personData.birthPlace = formData.birthPlace;
            if (formData.birthCountry) personData.birthCountry = formData.birthCountry;
            if (formData.deathDate) personData.deathDate = formData.deathDate;
            if (formData.deathPlace) personData.deathPlace = formData.deathPlace;
            if (formData.deathCountry) personData.deathCountry = formData.deathCountry;
            if (formData.photo) personData.photo = formData.photo;
            if (formData.photoThumbnail) personData.photoThumbnail = formData.photoThumbnail;
            if (formData.bio) personData.bio = formData.bio;
            if (formData.wikiId) personData.wikiId = formData.wikiId;
            if (formData.occupation) personData.occupation = formData.occupation;
            if (formData.education) personData.education = formData.education;
            if (formData.nationality) personData.nationality = formData.nationality;
            if (formData.ethnicity) personData.ethnicity = formData.ethnicity;
            if (formData.religion) personData.religion = formData.religion;
            if (formData.email) personData.email = formData.email;
            if (formData.phone) personData.phone = formData.phone;
            if (formData.address) personData.address = formData.address;
            if (formData.city) personData.city = formData.city;
            if (formData.state) personData.state = formData.state;
            if (formData.country) personData.country = formData.country;
            if (formData.zipCode) personData.zipCode = formData.zipCode;
            if (formData.notes) personData.notes = formData.notes;
            if (formData.metadata) personData.metadata = formData.metadata;

            await tablesDB.updateRow({
                databaseId: DATABASE_ID,
                tableId: PERSONS_COLLECTION_ID,
                rowId: personId,
                data: personData,
            });

            toast.success(t('family_tree.persons.updated_success'));
            router.push(`/auth/family-tree/persons/${personId}`);
        } catch (error: any) {
            console.error('Error updating person:', error);
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

    if (!person) {
        return (
            <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
                <p suppressHydrationWarning>{t('family_tree.persons.not_found')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 sm:p-6 pt-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/auth/family-tree/persons/${personId}`)}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('back')}
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" suppressHydrationWarning>
                    {t('family_tree.persons.edit_title')}
                </h1>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle suppressHydrationWarning>{t('family_tree.persons.basic_info')}</CardTitle>
                        <CardDescription suppressHydrationWarning>{t('family_tree.persons.basic_info_description')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Same form fields as create page */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" suppressHydrationWarning>{t('family_tree.persons.name')} *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    maxLength={200}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title" suppressHydrationWarning>{t('family_tree.persons.title')}</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    maxLength={50}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" suppressHydrationWarning>{t('family_tree.persons.first_name')}</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    maxLength={100}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="middleName" suppressHydrationWarning>{t('family_tree.persons.middle_name')}</Label>
                                <Input
                                    id="middleName"
                                    value={formData.middleName}
                                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                                    maxLength={100}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" suppressHydrationWarning>{t('family_tree.persons.last_name')}</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    maxLength={100}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender" suppressHydrationWarning>{t('family_tree.persons.gender')} *</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(value: 'M' | 'F' | 'O' | 'U') => setFormData({ ...formData, gender: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="M">{t('family_tree.persons.gender_male')}</SelectItem>
                                    <SelectItem value="F">{t('family_tree.persons.gender_female')}</SelectItem>
                                    <SelectItem value="O">{t('family_tree.persons.gender_other')}</SelectItem>
                                    <SelectItem value="U">{t('family_tree.persons.gender_unknown')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="birthDate" suppressHydrationWarning>{t('family_tree.persons.birth_date')}</Label>
                                <Input
                                    id="birthDate"
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthPlace" suppressHydrationWarning>{t('family_tree.persons.birth_place')}</Label>
                                <Input
                                    id="birthPlace"
                                    value={formData.birthPlace}
                                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                                    maxLength={300}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birthCountry" suppressHydrationWarning>{t('family_tree.persons.birth_country')}</Label>
                                <Input
                                    id="birthCountry"
                                    value={formData.birthCountry}
                                    onChange={(e) => setFormData({ ...formData, birthCountry: e.target.value })}
                                    maxLength={100}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isDeceased"
                                    checked={formData.isDeceased}
                                    onChange={(e) => setFormData({ ...formData, isDeceased: e.target.checked })}
                                />
                                <Label htmlFor="isDeceased" suppressHydrationWarning>{t('family_tree.persons.is_deceased')}</Label>
                            </div>
                        </div>

                        {formData.isDeceased && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="deathDate" suppressHydrationWarning>{t('family_tree.persons.death_date')}</Label>
                                    <Input
                                        id="deathDate"
                                        type="date"
                                        value={formData.deathDate}
                                        onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deathPlace" suppressHydrationWarning>{t('family_tree.persons.death_place')}</Label>
                                    <Input
                                        id="deathPlace"
                                        value={formData.deathPlace}
                                        onChange={(e) => setFormData({ ...formData, deathPlace: e.target.value })}
                                        maxLength={300}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="deathCountry" suppressHydrationWarning>{t('family_tree.persons.death_country')}</Label>
                                    <Input
                                        id="deathCountry"
                                        value={formData.deathCountry}
                                        onChange={(e) => setFormData({ ...formData, deathCountry: e.target.value })}
                                        maxLength={100}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="bio" suppressHydrationWarning>{t('family_tree.persons.bio')}</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={6}
                                maxLength={10000}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="wikiId" suppressHydrationWarning>{t('family_tree.persons.wiki_id')}</Label>
                            <Input
                                id="wikiId"
                                value={formData.wikiId}
                                onChange={(e) => setFormData({ ...formData, wikiId: e.target.value })}
                                placeholder="Q75383737"
                                maxLength={50}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="status" suppressHydrationWarning>{t('family_tree.persons.status')}</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: 'active' | 'inactive' | 'archived' | 'draft') => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('family_tree.persons.status_active')}</SelectItem>
                                        <SelectItem value="inactive">{t('family_tree.persons.status_inactive')}</SelectItem>
                                        <SelectItem value="archived">{t('family_tree.persons.status_archived')}</SelectItem>
                                        <SelectItem value="draft">{t('family_tree.persons.status_draft')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={formData.isPublic}
                                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                    />
                                    <Label htmlFor="isPublic" suppressHydrationWarning>{t('family_tree.persons.is_public')}</Label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/auth/family-tree/persons/${personId}`)}
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

