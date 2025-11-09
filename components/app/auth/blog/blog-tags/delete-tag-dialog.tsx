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
import { BlogTag } from "./tags-table";

interface DeleteTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: BlogTag | null;
  onConfirm: () => Promise<void>;
}

export function DeleteTagDialog({
  open,
  onOpenChange,
  tag,
  onConfirm,
}: DeleteTagDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-4 sm:p-6">
        <AlertDialogHeader className="px-0 sm:px-0">
          <AlertDialogTitle className="text-lg sm:text-xl" suppressHydrationWarning>
            {t('delete_item', { item: t('blog_tags_page.title') })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {tag && (
              <>
                {t('blog_tags_page.delete_tag_description', { name: tag.name })}
                {tag.postCount ? (
                  t('blog_tags_page.delete_tag_with_posts', {
                    count: tag.postCount.toString(),
                    plural: tag.postCount !== 1 ? 's' : ''
                  })
                ) : null}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel onClick={() => onOpenChange(false)} className="w-full sm:w-auto" suppressHydrationWarning>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
            suppressHydrationWarning
          >
            {t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

