"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    MessageSquare,
    Plus,
    RefreshCw,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID, COMMUNITY_TOPICS_COLLECTION_ID } from "@/lib/appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { createPaginationParams, DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { AccessControl } from "@/components/app/auth/community/community-topics/access-control";
import { TopicForm } from "@/components/app/auth/community/community-topics/topic-form";
import { TopicsTable } from "@/components/app/auth/community/community-topics/topics-table";
import { DeleteTopicDialog } from "@/components/app/auth/community/community-topics/delete-topic-dialog";
import { CommunityTopic, TopicFormData, DEFAULT_FORM_DATA } from "@/components/app/auth/community/community-topics/types";
import { generateSlug, generateUniqueSlug } from "@/components/app/auth/community/community-topics/utils";

export default function CommunityTopicsPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Main component state
    const [topics, setTopics] = useState<CommunityTopic[]>([]);
    const [allTopics, setAllTopics] = useState<CommunityTopic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);

    // Dialog states
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [topicToDelete, setTopicToDelete] = useState<CommunityTopic | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<CommunityTopic | null>(null);

    // Form states
    const [formData, setFormData] = useState<TopicFormData>(DEFAULT_FORM_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadTopics = async () => {
        try {
            setIsRefreshing(true);
            const response = await tablesDB.listRows({
                databaseId: DATABASE_ID,
                tableId: COMMUNITY_TOPICS_COLLECTION_ID
            });

            // Sort by displayOrder, then by creation date
            const sortedTopics = response.rows
                .map((row: any) => ({
                    ...row,
                    postCount: row.postCount || 0,
                    replyCount: row.replyCount || 0,
                    displayOrder: row.displayOrder || 0,
                }))
                .sort((a: CommunityTopic, b: CommunityTopic) => {
                    // First sort by displayOrder
                    if (a.displayOrder !== b.displayOrder) {
                        return a.displayOrder - b.displayOrder;
                    }
                    // Then by creation date (newest first)
                    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
                });

            setAllTopics(sortedTopics);

            // Apply pagination
            const paginationParams = createPaginationParams(currentPage, pageSize);
            const paginatedTopics = sortedTopics.slice(
                paginationParams.offset || 0,
                (paginationParams.offset || 0) + (paginationParams.limit || DEFAULT_PAGE_SIZE)
            );

            setTopics(paginatedTopics);
            setError(null);
        } catch (error) {
            console.error('Failed to load topics:', error);
            setError("Error");
            toast.error("Error");
            throw error;
        } finally {
            setIsRefreshing(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        if (!user) {
            router.push('/auth/dashboard');
            return;
        }

        const loadData = async () => {
            try {
                await loadTopics();
            } catch (error) {
                console.error('Failed to load data:', error);
                setError("Failed to load community topics");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user, router, currentPage, pageSize]);

    const handleCreateTopic = async () => {
        if (!formData.name.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            // Ensure slug is unique before creating
            const baseSlug = generateSlug(formData.name);
            const uniqueSlug = generateUniqueSlug(baseSlug, allTopics);

            const newTopic = {
                name: formData.name.trim(),
                slug: uniqueSlug,
                description: formData.description.trim() || null,
                parentId: formData.parentId === 'none' ? null : formData.parentId,
                color: formData.color,
                icon: formData.icon,
                isActive: formData.isActive,
                isPublic: formData.isPublic,
                displayOrder: formData.displayOrder || 0,
                rules: formData.rules.trim() || null,
                postCount: 0,
                replyCount: 0,
            };

            await tablesDB.createRow({
                databaseId: DATABASE_ID,
                tableId: COMMUNITY_TOPICS_COLLECTION_ID,
                rowId: `topic_${Date.now()}`,
                data: newTopic,
            });

            // Log audit event
            await auditLogger.log({
                action: 'COMMUNITY_TOPIC_CREATED',
                resource: 'community_topics',
                resourceId: `topic_${Date.now()}`,
                userId: user?.$id || '',
                metadata: {
                    topicName: newTopic.name,
                    topicSlug: uniqueSlug,
                    description: `Created community topic: ${newTopic.name}`
                }
            });

            toast.success("Topic created successfully");
            setCreateDialogOpen(false);
            resetForm();
            await loadTopics();
        } catch (error) {
            console.error('Failed to create topic:', error);
            toast.error("Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditTopic = async () => {
        if (!selectedTopic || !formData.name.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            // Ensure slug is unique before updating (exclude current topic)
            const baseSlug = generateSlug(formData.name);
            const uniqueSlug = generateUniqueSlug(baseSlug, allTopics, selectedTopic.$id);

            const updatedTopic = {
                name: formData.name.trim(),
                slug: uniqueSlug,
                description: formData.description.trim() || null,
                parentId: formData.parentId === 'none' ? null : formData.parentId,
                color: formData.color,
                icon: formData.icon,
                isActive: formData.isActive,
                isPublic: formData.isPublic,
                displayOrder: formData.displayOrder || 0,
                rules: formData.rules.trim() || null,
            };

            await tablesDB.updateRow({
                databaseId: DATABASE_ID,
                tableId: COMMUNITY_TOPICS_COLLECTION_ID,
                rowId: selectedTopic.$id,
                data: updatedTopic,
            });

            // Log audit event
            await auditLogger.log({
                action: 'COMMUNITY_TOPIC_UPDATED',
                resource: 'community_topics',
                resourceId: selectedTopic.$id,
                userId: user?.$id || '',
                oldValues: {
                    name: selectedTopic.name,
                    slug: selectedTopic.slug,
                    description: selectedTopic.description,
                    color: selectedTopic.color,
                    isActive: selectedTopic.isActive,
                    isPublic: selectedTopic.isPublic,
                },
                newValues: updatedTopic,
                metadata: {
                    topicName: updatedTopic.name,
                    topicSlug: uniqueSlug,
                    description: `Updated community topic: ${updatedTopic.name}`
                }
            });

            toast.success("Topic updated successfully");
            setEditDialogOpen(false);
            setSelectedTopic(null);
            resetForm();
            await loadTopics();
        } catch (error) {
            console.error('Failed to update topic:', error);
            toast.error("Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTopic = async () => {
        if (!topicToDelete) return;

        try {
            await tablesDB.deleteRow({
                databaseId: DATABASE_ID,
                tableId: COMMUNITY_TOPICS_COLLECTION_ID,
                rowId: topicToDelete.$id,
            });

            // Log audit event
            await auditLogger.log({
                action: 'COMMUNITY_TOPIC_DELETED',
                resource: 'community_topics',
                resourceId: topicToDelete.$id,
                userId: user?.$id || '',
                metadata: {
                    topicName: topicToDelete.name,
                    topicSlug: topicToDelete.slug,
                    postCount: topicToDelete.postCount,
                    description: `Deleted community topic: ${topicToDelete.name}`
                }
            });

            toast.success("Topic deleted successfully");
            setDeleteDialogOpen(false);
            setTopicToDelete(null);
            await loadTopics();
        } catch (error) {
            console.error('Failed to delete topic:', error);
            toast.error("Error");
        }
    };

    const openEditDialog = (topic: CommunityTopic) => {
        setSelectedTopic(topic);
        setFormData({
            name: topic.name,
            slug: topic.slug,
            description: topic.description || '',
            parentId: topic.parentId || 'none',
            color: topic.color || '#3B82F6',
            icon: topic.icon || 'message-circle',
            isActive: topic.isActive,
            isPublic: topic.isPublic,
            displayOrder: topic.displayOrder || 0,
            rules: topic.rules || '',
        });
        setEditDialogOpen(true);
    };

    const openDeleteDialog = (topic: CommunityTopic) => {
        setTopicToDelete(topic);
        setDeleteDialogOpen(true);
    };

    const resetForm = () => {
        setFormData(DEFAULT_FORM_DATA);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <AccessControl>
            <div className="flex-1 space-y-4 p-4 pt-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Community Topics</h1>
                        <p className="text-muted-foreground">
                            Manage discussion topics for your community
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={loadTopics}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Create New Topic</DialogTitle>
                                    <DialogDescription>
                                        Create a new discussion topic for your community
                                    </DialogDescription>
                                </DialogHeader>
                                <TopicForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    allTopics={allTopics}
                                    mode="create"
                                />
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreateTopic} disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                        Create
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Community Topics ({allTopics.length})
                        </CardTitle>
                        <CardDescription>
                            Showing {topics.length} of {allTopics.length} entries (Total: {allTopics.length})
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TopicsTable
                            topics={topics}
                            allTopics={allTopics}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onEdit={openEditDialog}
                            onDelete={openDeleteDialog}
                        />
                    </CardContent>
                </Card>

                {/* Edit Topic Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Topic</DialogTitle>
                            <DialogDescription>
                                Update the topic information
                            </DialogDescription>
                        </DialogHeader>
                        <TopicForm
                            formData={formData}
                            setFormData={setFormData}
                            allTopics={allTopics}
                            selectedTopic={selectedTopic}
                            mode="edit"
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditTopic} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Update
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <DeleteTopicDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    topic={topicToDelete}
                    onConfirm={handleDeleteTopic}
                />
            </div>
        </AccessControl>
    );
}
