import { CommunityTopic, AVAILABLE_ICONS } from "./types";
import { MessageSquare } from "lucide-react";

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export function generateUniqueSlug(baseSlug: string, allTopics: CommunityTopic[], excludeId?: string): string {
    let uniqueSlug = baseSlug;
    let counter = 1;

    // Check if slug exists in current topics (excluding the one being edited)
    while (allTopics.some(topic =>
        topic.slug === uniqueSlug && topic.$id !== excludeId
    )) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
    }

    return uniqueSlug;
}

export function getIconComponent(iconName: string) {
    const icon = AVAILABLE_ICONS.find(i => i.name === iconName);
    return icon ? icon.component : MessageSquare;
}

export function getParentTopicName(parentId: string | undefined, allTopics: CommunityTopic[]): string {
    if (!parentId) return '-';
    const parent = allTopics.find(t => t.$id === parentId);
    return parent?.name || parentId;
}

export function getAvailableParents(allTopics: CommunityTopic[], excludeId?: string): CommunityTopic[] {
    if (!excludeId) return allTopics.filter(t => !t.parentId);

    // Exclude the topic being edited and any topics that have it as a parent (to prevent circular refs)
    const excludeIds = new Set([excludeId]);
    const findChildren = (id: string) => {
        allTopics.forEach(t => {
            if (t.parentId === id) {
                excludeIds.add(t.$id);
                findChildren(t.$id);
            }
        });
    };
    findChildren(excludeId);

    return allTopics.filter(t => !excludeIds.has(t.$id) && (!t.parentId || excludeId === t.$id));
}

