"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CommunityPostFormData } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TipTap } from "@/components/ui/tiptap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Loader2,
    Save,
    MessageSquare,
    Hash,
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

const MAX_CONTENT_LENGTH = 5000;
const MAX_TAG_LENGTH = 20;

const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .substring(0, 200);
};

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
    const { user } = useAuth();
    const router = useRouter();

    // State
    const [topics, setTopics] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contentLength, setContentLength] = useState(0);

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
            if (!user) {
                router.push('/auth/dashboard');
                return;
            }

            // Initialize form with user data
            setFormData(prev => ({
                ...prev,
                author: user.name || user.email || '',
                authorId: user.$id || '',
                authorEmail: user.email || '',
            }));

            await loadTopics();
        };

        loadData();
    }, [user, router]);

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
            toast.error("Failed to load topics");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title.trim()) {
            toast.error("Title is required");
            return;
        }
        if (!formData.slug.trim()) {
            toast.error("Slug is required");
            return;
        }
        if (!formData.content.trim()) {
            toast.error("Content is required");
            return;
        }
        if (formData.content.length > MAX_CONTENT_LENGTH) {
            toast.error(`Content must be less than ${MAX_CONTENT_LENGTH} characters`);
            return;
        }
        if (!formData.authorId) {
            toast.error("Author ID is required");
            return;
        }

        // Validate tags
        const invalidTags = formData.tags.filter(tag => tag.length > MAX_TAG_LENGTH);
        if (invalidTags.length > 0) {
            toast.error(`Tags must be less than ${MAX_TAG_LENGTH} characters each`);
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

            toast.success("Post created successfully");
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
                toast.error("You do not have permission to create community posts");
            } else {
                toast.error("Error");
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
            toast.error(`Tags must be less than ${MAX_TAG_LENGTH} characters each`);
            return;
        }

        if (formData.tags.includes(trimmedTag)) {
            toast.error("Tag already exists");
            return;
        }

        if (formData.tags.length >= 10) {
            toast.error("Maximum 10 tags allowed");
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

    return (
        <div className="min-h-screen bg-background">
            {/* Breadcrumb Navigation */}
            <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-6 py-3">
                    <nav className="flex items-center space-x-2 text-sm">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" asChild>
                            <Link href="/auth/community/community-posts">
                                <ArrowLeft className="h-3 w-3 mr-1" />
                                Community Posts
                            </Link>
                        </Button>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-foreground font-medium">Create</span>
                    </nav>
                </div>
            </div>

            {/* Header */}
            <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Create Community Post</h1>
                            <p className="text-sm text-muted-foreground">
                                Create a new discussion post for the community
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid gap-8 xl:grid-cols-12">
                        {/* Main Content Column */}
                        <div className="xl:col-span-8 space-y-8">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Post Information</CardTitle>
                                    <CardDescription>
                                        Basic information about your post
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => handleTitleChange(e.target.value)}
                                            placeholder="Enter post title"
                                            required
                                            maxLength={200}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Slug *</Label>
                                        <Input
                                            id="slug"
                                            value={formData.slug}
                                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                            placeholder="url-friendly-slug"
                                            required
                                            maxLength={200}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="excerpt">Excerpt</Label>
                                        <Textarea
                                            id="excerpt"
                                            value={formData.excerpt || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                                            placeholder="Brief description of your post"
                                            rows={3}
                                            maxLength={500}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="content">Content *</Label>
                                            <span className={`text-xs ${contentLength > MAX_CONTENT_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                {contentLength} / {MAX_CONTENT_LENGTH} characters
                                            </span>
                                        </div>
                                        <TipTap
                                            value={formData.content}
                                            stickyTop="top-48"
                                            onChange={handleContentChange}
                                            placeholder="Write your post content here..."
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Maximum {MAX_CONTENT_LENGTH} characters
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="xl:col-span-4 space-y-6">
                            {/* Topic Selection */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" />
                                        Topic
                                    </CardTitle>
                                    <CardDescription>
                                        Select a topic for your post
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label htmlFor="topic">Topic (Optional)</Label>
                                        <Select
                                            value={formData.communityTopics?.$id || ''}
                                            onValueChange={(value) => {
                                                const selectedTopic = topics.find(topic => topic.$id === value);
                                                setFormData(prev => ({ ...prev, communityTopics: selectedTopic || null }));
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a topic" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {topics.map((topic) => (
                                                    <SelectItem key={topic.$id} value={topic.$id}>
                                                        {topic.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {topics.length === 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                No topics available
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tags */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        Tags
                                    </CardTitle>
                                    <CardDescription>
                                        Add tags (max {MAX_TAG_LENGTH} characters each)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label>Add Tags</Label>
                                            <Input
                                                placeholder={`Enter tag (max ${MAX_TAG_LENGTH} chars) and press Enter`}
                                                maxLength={MAX_TAG_LENGTH}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const value = (e.target as HTMLInputElement).value.trim();
                                                        if (value) {
                                                            addTag(value);
                                                            (e.target as HTMLInputElement).value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Press Enter to add a tag. Maximum 10 tags allowed.
                                            </p>
                                        </div>

                                        {/* Display current tags */}
                                        {formData.tags.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-sm text-muted-foreground">Current Tags</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.tags.map((tag, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="secondary"
                                                            className="flex items-center gap-1"
                                                        >
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTag(index)}
                                                                className="ml-1 hover:text-destructive"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Post Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Post Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <div className="p-3 bg-muted rounded-md">
                                            <Badge variant="secondary">Pending Review</Badge>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Your post will be reviewed before being published
                                            </p>
                                        </div>
                                    </div>

                                    {formData.author && (
                                        <div className="space-y-2">
                                            <Label>Author</Label>
                                            <Input
                                                value={formData.author}
                                                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                                                placeholder="Author name"
                                                maxLength={100}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="sticky z-40 bottom-0 -mb-8 px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-x">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {contentLength > 0 && (
                                    <span>
                                        {contentLength} / {MAX_CONTENT_LENGTH} characters
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" type="button" size="lg" asChild>
                                    <Link href="/auth/community/community-posts">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={isSubmitting || contentLength > MAX_CONTENT_LENGTH} size="lg">
                                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    <Save className="h-4 w-4 mr-2" />
                                    Create Post
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

