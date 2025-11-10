"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: {
    name: string;
    slug: string;
    description: string;
    color: string;
    isActive: boolean;
    sortOrder: number;
  };
  onFormDataChange: (data: Partial<CreateCategoryDialogProps['formData']>) => void;
  onNameChange: (name: string) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export function CreateCategoryDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onNameChange,
  onSubmit,
  isSubmitting,
}: CreateCategoryDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate" suppressHydrationWarning>
            {t('add_item', {item: t('category')})}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="p-4 sm:p-6">
        <DialogHeader className="px-0 sm:px-0">
          <DialogTitle className="text-lg sm:text-xl" suppressHydrationWarning>
            {t('blog_categories_page.create_category')}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('blog_categories_page.create_category_description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('name')} *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t('blog_categories_page.form.name_placeholder')}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('slug')}
            </Label>
            <div className="space-y-1">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => onFormDataChange({ slug: e.target.value })}
                placeholder={t('blog_categories_page.form.slug_placeholder')}
                className="w-full"
              />
              {formData.slug && (
                <p className="text-xs text-blue-600 dark:text-blue-400" suppressHydrationWarning>
                  {t('blog_categories_page.form.slug_url', { slug: formData.slug })}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('description')}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              className="w-full"
              placeholder={t('blog_categories_page.form.description_placeholder')}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('color')}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => onFormDataChange({ color: e.target.value })}
                className="w-12 h-8 sm:w-16 sm:h-10 p-1 border rounded shrink-0"
              />
              <Input
                value={formData.color}
                onChange={(e) => onFormDataChange({ color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="order" className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('blog_categories_page.form.order')}
            </Label>
            <Input
              id="order"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => onFormDataChange({ sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full"
              placeholder={t('blog_categories_page.form.order_placeholder')}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => onFormDataChange({ isActive: checked as boolean })}
            />
            <Label htmlFor="isActive" className="text-xs sm:text-sm font-normal cursor-pointer" suppressHydrationWarning>
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
              {t('create_item', {item: t('category')})}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

