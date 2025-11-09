"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/lib/language-context";
import { CommunityTopic } from "./types";

interface DeleteTopicDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    topic: CommunityTopic | null;
    onConfirm: () => void;
}

export function DeleteTopicDialog({
    open,
    onOpenChange,
    topic,
    onConfirm,
}: DeleteTopicDialogProps) {
    const { t } = useTranslation();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle suppressHydrationWarning>
                        {t('community_topics_page.delete_dialog.title')}
                    </AlertDialogTitle>
                    <AlertDialogDescription suppressHydrationWarning>
                        {t('community_topics_page.delete_dialog.description', { name: topic?.name || '' })}
                        {topic?.postCount ? (
                            <span className="block mt-2">
                                {t('community_topics_page.delete_dialog.has_posts', {
                                    count: topic.postCount.toString(),
                                    plural: topic.postCount !== 1 ? 's' : ''
                                })}
                            </span>
                        ) : null}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)} suppressHydrationWarning>
                        {t('cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700"
                        suppressHydrationWarning
                    >
                        {t('delete')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

