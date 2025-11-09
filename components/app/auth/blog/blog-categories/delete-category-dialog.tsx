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
import { BlogCategory } from "./categories-table";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: BlogCategory | null;
  onConfirm: () => Promise<void>;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-4 sm:p-6">
        <AlertDialogHeader className="px-0 sm:px-0">
          <AlertDialogTitle className="text-lg sm:text-xl" suppressHydrationWarning>
            {t('delete_item', { item:  t('blog_categories_page.title') })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {category && (
              <>
                {t('blog_categories_page.delete_category_description', { name: category.name })}
                {category.postCount ? (
                  t('blog_categories_page.delete_category_with_posts', {
                    count: category.postCount.toString(),
                    plural: category.postCount !== 1 ? 's' : ''
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

