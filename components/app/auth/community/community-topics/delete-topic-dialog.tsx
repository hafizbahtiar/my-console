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
import { CommunityTopic } from "./types";
import { useTranslation } from "@/lib/language-context";

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
                    <AlertDialogTitle>{t("community.topics.delete_title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("community.topics.delete_confirmation", { name: topic?.name || '' })}
                        {topic?.postCount ? ` ${t("community.topics.has_posts", { count: topic.postCount.toString() })}` : ''}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        {t("general_use.cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {t("general_use.delete")}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

