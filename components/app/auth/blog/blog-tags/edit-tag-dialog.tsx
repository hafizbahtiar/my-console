"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name: string;
    slug: string;
    color: string;
    isActive: boolean;
  };
  onFormDataChange: (data: Partial<EditTagDialogProps['formData']>) => void;
  onNameChange: (name: string) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export function EditTagDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onNameChange,
  onSubmit,
  isSubmitting,
}: EditTagDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:p-6">
        <DialogHeader className="px-0 sm:px-0">
          <DialogTitle className="text-lg sm:text-xl" suppressHydrationWarning>
            {t('edit_item', { item: t('blog_tags_page.title') })}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('blog_tags_page.edit_tag_description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('name')} *
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-slug" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('slug')}
            </Label>
            <div className="space-y-1">
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => onFormDataChange({ slug: e.target.value })}
                className="w-full"
              />
              {formData.slug && (
                <p className="text-xs text-blue-600 dark:text-blue-400" suppressHydrationWarning>
                  {t('blog_tags_page.form.slug_url', { slug: formData.slug })}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-color" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('color')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="edit-color"
                type="color"
                value={formData.color}
                onChange={(e) => onFormDataChange({ color: e.target.value })}
                className="w-12 h-8 sm:w-16 sm:h-10 p-1 border rounded shrink-0"
              />
              <Input
                value={formData.color}
                onChange={(e) => onFormDataChange({ color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="edit-isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => onFormDataChange({ isActive: checked as boolean })}
            />
            <Label htmlFor="edit-isActive" className="text-xs sm:text-sm font-normal cursor-pointer" suppressHydrationWarning>
              {t('active')}
            </Label>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto" suppressHydrationWarning>
            {t('cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" /> : null}
            <span className="truncate" suppressHydrationWarning>
              {t('save')}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

