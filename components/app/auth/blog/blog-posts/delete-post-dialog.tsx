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
import { BlogPost } from "@/app/auth/blog/blog-posts/types";

interface DeletePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: BlogPost | null;
  onConfirm: () => Promise<void>;
}

export function DeletePostDialog({
  open,
  onOpenChange,
  post,
  onConfirm,
}: DeletePostDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle suppressHydrationWarning>
            {t('blog_posts_page.delete_dialog.title')}
          </AlertDialogTitle>
          <AlertDialogDescription suppressHydrationWarning>
            {post && t('blog_posts_page.delete_dialog.description', { title: post.title })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel suppressHydrationWarning>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            suppressHydrationWarning
          >
            {t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

