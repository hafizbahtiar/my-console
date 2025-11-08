"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { IconPicker } from "./icon-picker";
import { TopicFormData, CommunityTopic } from "./types";
import { generateSlug, generateUniqueSlug, getAvailableParents } from "./utils";

interface TopicFormProps {
    formData: TopicFormData;
    setFormData: React.Dispatch<React.SetStateAction<TopicFormData>>;
    allTopics: CommunityTopic[];
    selectedTopic?: CommunityTopic | null;
    onNameChange?: (name: string) => void;
    mode?: 'create' | 'edit';
}

export function TopicForm({
    formData,
    setFormData,
    allTopics,
    selectedTopic,
    onNameChange,
    mode = 'create'
}: TopicFormProps) {
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

    const handleNameChange = (name: string) => {
        const baseSlug = generateSlug(name);
        const uniqueSlug = generateUniqueSlug(baseSlug, allTopics, selectedTopic?.$id);
        const updatedFormData = {
            ...formData,
            name,
            slug: uniqueSlug,
        };
        setFormData(updatedFormData);
        if (onNameChange) {
            onNameChange(name);
        }
    };

    const generateDescriptionWithAI = async () => {
        if (!formData.name.trim()) {
            toast.error('Topic name is required for AI generation');
            return;
        }

        const nameWords = formData.name.trim().split(/\s+/).length;
        if (nameWords <= 1) {
            toast.error('Topic name must have more than 1 word for AI generation');
            return;
        }

        setIsGeneratingDescription(true);
        try {
            const response = await fetch('/api/ai/generate-excerpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.name.trim(),
                    content: `Topic: ${formData.name.trim()}. Generate a brief description for this community discussion topic.`,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate description');
            }

            const data = await response.json();
            setFormData(prev => ({
                ...prev,
                description: data.excerpt
            }));

            toast.success('Description generated successfully!');
        } catch (error) {
            console.error('AI generation error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate description. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const availableParents = getAvailableParents(allTopics, selectedTopic?.$id);

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={mode === 'create' ? 'name' : 'edit-name'} className="text-right">
                    Name *
                </Label>
                <Input
                    id={mode === 'create' ? 'name' : 'edit-name'}
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter topic name"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={mode === 'create' ? 'slug' : 'edit-slug'} className="text-right">
                    Slug
                </Label>
                <div className="col-span-3 space-y-1">
                    <Input
                        id={mode === 'create' ? 'slug' : 'edit-slug'}
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="url-friendly-slug"
                    />
                    {formData.slug && (
                        <p className="text-xs text-muted-foreground">
                            URL: /community/topic/{formData.slug} (auto-generated from name, editable)
                        </p>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor={mode === 'create' ? 'description' : 'edit-description'} className="text-right pt-2">
                    Description
                </Label>
                <div className="col-span-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <Textarea
                            id={mode === 'create' ? 'description' : 'edit-description'}
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="flex-1"
                            placeholder="Enter topic description"
                            rows={3}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateDescriptionWithAI}
                            disabled={isGeneratingDescription || !formData.name.trim() || formData.name.trim().split(/\s+/).length <= 1}
                            className="flex items-center gap-2 h-auto"
                        >
                            {isGeneratingDescription ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4" />
                            )}
                            {isGeneratingDescription ? 'Generating...' : 'Generate with AI'}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={mode === 'create' ? 'parent' : 'edit-parent'} className="text-right">
                    Parent Topic
                </Label>
                <Select value={formData.parentId} onValueChange={(value) => setFormData(prev => ({ ...prev, parentId: value }))}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="No parent" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No parent</SelectItem>
                        {availableParents.map((topic) => (
                            <SelectItem key={topic.$id} value={topic.$id}>
                                {topic.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={mode === 'create' ? 'color' : 'edit-color'} className="text-right">
                    Color
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                    <Input
                        id={mode === 'create' ? 'color' : 'edit-color'}
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#3B82F6"
                        className="flex-1"
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={mode === 'create' ? 'icon' : 'edit-icon'} className="text-right">
                    Icon
                </Label>
                <div className="col-span-3">
                    <IconPicker
                        value={formData.icon}
                        onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
                        onClear={() => setFormData(prev => ({ ...prev, icon: '' }))}
                    />
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={mode === 'create' ? 'displayOrder' : 'edit-displayOrder'} className="text-right">
                    Display Order
                </Label>
                <Input
                    id={mode === 'create' ? 'displayOrder' : 'edit-displayOrder'}
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="col-span-3"
                    min="0"
                />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor={mode === 'create' ? 'rules' : 'edit-rules'} className="text-right pt-2">
                    Rules
                </Label>
                <Textarea
                    id={mode === 'create' ? 'rules' : 'edit-rules'}
                    value={formData.rules}
                    onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                    className="col-span-3"
                    placeholder="Enter topic rules and guidelines"
                    rows={4}
                    maxLength={2000}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3 space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={mode === 'create' ? 'isActive' : 'edit-isActive'}
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                        />
                        <Label htmlFor={mode === 'create' ? 'isActive' : 'edit-isActive'} className="cursor-pointer">
                            Active
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={mode === 'create' ? 'isPublic' : 'edit-isPublic'}
                            checked={formData.isPublic}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked as boolean }))}
                        />
                        <Label htmlFor={mode === 'create' ? 'isPublic' : 'edit-isPublic'} className="cursor-pointer">
                            Public
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
}

