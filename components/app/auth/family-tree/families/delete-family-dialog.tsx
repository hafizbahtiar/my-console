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
import { Family } from "@/app/auth/family-tree/persons/types";

interface DeleteFamilyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  family: Family | null;
  onConfirm: () => Promise<void>;
}

export function DeleteFamilyDialog({
  open,
  onOpenChange,
  family,
  onConfirm,
}: DeleteFamilyDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle suppressHydrationWarning>
            {t('family_tree.families.delete_dialog.title')}
          </AlertDialogTitle>
          <AlertDialogDescription suppressHydrationWarning>
            {family && t('family_tree.families.delete_dialog.description', { 
              name: family.familyName || t('family_tree.families.unnamed_family')
            })}
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

