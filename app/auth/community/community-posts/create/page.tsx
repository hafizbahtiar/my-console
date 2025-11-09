"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CommunityPostFormData } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Loader2,
    Save,
} from "lucide-react";
import { toast } from "sonner";
import {
    tablesDB,
    DATABASE_ID,
    COMMUNITY_POSTS_COLLECTION_ID,
    COMMUNITY_TOPICS_COLLECTION_ID
} from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import {
    CreateBreadcrumbNav,
    BasicInfoSection,
    TopicSection,
    TagsSection,
    PostSettingsSection,
    generateSlug,
} from "@/components/app/auth/community/community-posts/create";

const MAX_CONTENT_LENGTH = 5000;
const MAX_TAG_LENGTH = 20;

const getClientIP = (): string => {
    // This would typically come from the server-side request
    // For now, return empty string as it will be set server-side if needed
    return '';
};

const getUserAgent = (): string => {
    if (typeof window !== 'undefined') {
        return navigator.userAgent;
    }
    return '';
};

export default function CreateCommunityPostPage() {
    const { user, loading: authLoading } = useAuth();
    const { t, loading: translationLoading } = useTranslation();
    const router = useRouter();

    // State
    const [topics, setTopics] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contentLength, setContentLength] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Form states
    const [formData, setFormData] = useState<CommunityPostFormData>({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        author: user?.name || user?.email || '',
        authorId: user?.$id || '',
        authorEmail: user?.email || '',
        communityTopics: null,
        status: 'pending',
        isPinned: false,
        isLocked: false,
        isFeatured: false,
        views: 0,
        upvotes: 0,
        downvotes: 0,
        replyCount: 0,
        tags: [],
        ipAddress: getClientIP(),
        userAgent: getUserAgent(),
    });

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            // Wait for auth to finish loading before proceeding
            if (authLoading) {
                return;
            }

            // Don't redirect on refresh - allow skeleton/error state to show
            if (!user) {
                setIsLoading(false);
                return;
            }

            // Initialize form with user data
            setFormData(prev => ({
                ...prev,
                author: user.name || user.email || '',
                authorId: user.$id || '',
                authorEmail: user.email || '',
            }));

            try {
                await loadTopics();
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user, authLoading, router]);

    const loadTopics = async () => {
        try {
            const topicsData = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: COMMUNITY_TOPICS_COLLECTION_ID,
                queries: [
                    // Only load active topics
                ],
            });
            // Filter active topics
            const activeTopics = (topicsData.rows || []).filter((topic: any) => topic.isActive);
            setTopics(activeTopics);
        } catch (error) {
            console.error('Failed to load topics:', error);
            toast.error(t('error'));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            toast.error(t('community_posts_page.create_page.validation.title_required'));
            return;
        }
        if (!formData.slug.trim()) {
            toast.error(t('community_posts_page.create_page.validation.slug_required'));
            return;
        }
        if (!formData.content.trim()) {
            toast.error(t('community_posts_page.create_page.validation.content_required'));
            return;
        }
        if (formData.content.length > MAX_CONTENT_LENGTH) {
            toast.error(t('community_posts_page.create_page.validation.content_too_long', { max: MAX_CONTENT_LENGTH.toString() }));
            return;
        }
        if (!formData.authorId) {
            toast.error(t('community_posts_page.create_page.validation.author_id_required'));
            return;
        }

        // Validate tags
        const invalidTags = formData.tags.filter(tag => tag.length > MAX_TAG_LENGTH);
        if (invalidTags.length > 0) {
            toast.error(t('community_posts_page.create_page.validation.tag_too_long', { max: MAX_TAG_LENGTH.toString() }));
            return;
        }

        setIsSubmitting(true);
        try {
            // Sanitize HTML content before saving
            const { sanitizeHTMLForStorage } = await import('@/lib/html-sanitizer');

            const newPost = {
                title: formData.title.trim(),
                slug: formData.slug.trim(),
                content: sanitizeHTMLForStorage(formData.content.trim()), // Sanitize HTML content
                excerpt: formData.excerpt?.trim() || null,
                author: formData.author?.trim() || null,
                authorId: formData.authorId,
                authorEmail: formData.authorEmail || null,
                communityTopics: formData.communityTopics?.$id || null,
                status: 'pending', // Always start as pending for moderation
                isPinned: false,
                isLocked: false,
                isFeatured: false,
                views: 0,
                upvotes: 0,
                downvotes: 0,
                replyCount: 0,
                tags: formData.tags.filter(tag => tag.trim().length > 0),
                ipAddress: formData.ipAddress || null,
                userAgent: formData.userAgent || null,
            };

            const createdPost = await tablesDB.createRow({
                databaseId: DATABASE_ID,
                tableId: COMMUNITY_POSTS_COLLECTION_ID,
                rowId: `community_post_${Date.now()}`,
                data: newPost,
            });

            // Log audit event
            await auditLogger.log({
                action: 'COMMUNITY_POST_CREATED',
                resource: 'community_posts',
                resourceId: createdPost.$id,
                userId: user!.$id,
                metadata: {
                    postTitle: newPost.title,
                    postSlug: newPost.slug,
                    description: `Created community post: ${newPost.title}`
                }
            });

            toast.success(t('community_posts_page.create_page.success'));
            router.push('/auth/community/community-posts');
        } catch (error: any) {
            console.error('Failed to create community post:', error);

            // Check for authorization errors
            const isAuthError = error?.code === 401 ||
                error?.code === 403 ||
                error?.message?.includes('not authorized') ||
                error?.message?.includes('authorized') ||
                error?.type === 'AppwriteException';

            if (isAuthError) {
                toast.error(t('community_posts_page.create_page.permission_denied'));
            } else {
                toast.error(t('community_posts_page.create_page.failed'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTitleChange = (title: string) => {
        setFormData(prev => ({
            ...prev,
            title,
            slug: generateSlug(title)
        }));
    };

    const handleContentChange = (content: string) => {
        // Strip HTML to count actual text length
        const textContent = content.replace(/<[^>]*>/g, '');
        setContentLength(textContent.length);

        setFormData(prev => ({
            ...prev,
            content
        }));
    };

    const addTag = (tagName: string) => {
        const trimmedTag = tagName.trim();
        if (!trimmedTag) return;

        if (trimmedTag.length > MAX_TAG_LENGTH) {
            toast.error(t('community_posts_page.create_page.validation.tag_too_long', { max: MAX_TAG_LENGTH.toString() }));
            return;
        }

        if (formData.tags.includes(trimmedTag)) {
            toast.error(t('community_posts_page.create_page.validation.tag_exists'));
            return;
        }

        if (formData.tags.length >= 10) {
            toast.error(t('community_posts_page.create_page.validation.max_tags'));
            return;
        }

        setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, trimmedTag]
        }));
    };

    const removeTag = (tagIndex: number) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter((_, index) => index !== tagIndex)
        }));
    };

    // Wrapper function to handle partial updates
    const handleFormDataChange = (data: Partial<CommunityPostFormData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    // Show skeleton while translations or data is loading
    if (translationLoading || isLoading || authLoading) {
        return (
            <div className="min-h-screen bg-background">
                {/* Breadcrumb Skeleton */}
                <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="px-4 sm:px-6 py-2 sm:py-3">
                        <Skeleton className="h-8 w-full" />
                    </div>
                </div>

                {/* Header Skeleton */}
                <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="px-4 sm:px-6 py-4">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
                            <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
                        </div>
                    </div>
                </div>

                {/* Main Content Skeleton */}
                <div className="px-4 sm:px-6 py-8">
                    <div className="grid gap-8 xl:grid-cols-12">
                        <div className="xl:col-span-8 space-y-8">
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-64 w-full" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="xl:col-span-4 space-y-6">
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-20 w-full" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Breadcrumb Navigation */}
            <CreateBreadcrumbNav />

            {/* Header */}
            <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight" suppressHydrationWarning>
                                {t('community_posts_page.create_page.title')}
                            </h1>
                            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                                {t('community_posts_page.create_page.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 sm:px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid gap-8 xl:grid-cols-12">
                        {/* Main Content Column */}
                        <div className="xl:col-span-8 space-y-8">
                            <BasicInfoSection
                                formData={formData}
                                contentLength={contentLength}
                                maxContentLength={MAX_CONTENT_LENGTH}
                                onFormDataChange={handleFormDataChange}
                                onTitleChange={handleTitleChange}
                                onContentChange={handleContentChange}
                            />
                        </div>

                        {/* Sidebar */}
                        <div className="xl:col-span-4 space-y-6">
                            <TopicSection
                                formData={formData}
                                topics={topics}
                                onFormDataChange={handleFormDataChange}
                            />

                            <TagsSection
                                formData={formData}
                                maxTagLength={MAX_TAG_LENGTH}
                                onAddTag={addTag}
                                onRemoveTag={removeTag}
                            />

                            <PostSettingsSection
                                formData={formData}
                                onFormDataChange={handleFormDataChange}
                            />
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="sticky z-40 bottom-0 -mb-8 px-4 sm:px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-x">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                                {contentLength > 0 && (
                                    <span>
                                        {contentLength} / {MAX_CONTENT_LENGTH} {t('community_posts_page.create_page.basic_info.characters')}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" type="button" size="lg" asChild>
                                    <Link href="/auth/community/community-posts">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        <span suppressHydrationWarning>{t('cancel')}</span>
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={isSubmitting || contentLength > MAX_CONTENT_LENGTH} size="lg">
                                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    <Save className="h-4 w-4 mr-2" />
                                    <span suppressHydrationWarning>{t('community_posts_page.create_page.submit.create')}</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

