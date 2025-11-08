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
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Topic</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete "{topic?.name || ''}"? This action cannot be undone.
                        {topic?.postCount ? ` This topic has ${topic.postCount} post${topic.postCount !== 1 ? 's' : ''}.` : ''}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

