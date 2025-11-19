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
import { Relationship } from "@/app/auth/family-tree/persons/types";

interface DeleteRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship: Relationship | null;
  onConfirm: () => Promise<void>;
}

export function DeleteRelationshipDialog({
  open,
  onOpenChange,
  relationship,
  onConfirm,
}: DeleteRelationshipDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle suppressHydrationWarning>
            {t('family_tree.relationships.delete_dialog.title')}
          </AlertDialogTitle>
          <AlertDialogDescription suppressHydrationWarning>
            {relationship && t('family_tree.relationships.delete_dialog.description', { 
              type: t(`family_tree.relationships.type_${relationship.type}`)
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

