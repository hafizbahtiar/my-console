"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Tag, FileDown, Edit } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { toast } from "sonner";
import { getCSRFHeadersAlt } from "@/lib/csrf-utils";
import { CustomerTagsInput } from "./customer-tags-input";

interface CustomerBulkOperationsProps {
  selectedIds: string[];
  onComplete?: () => void;
  onExport?: (ids: string[]) => void;
}

export function CustomerBulkOperations({ selectedIds, onComplete, onExport }: CustomerBulkOperationsProps) {
  const { t } = useTranslation();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | 'lead' | 'prospect' | 'archived'>('active');
  const [tags, setTags] = useState<string[]>([]);
  const [tagOperation, setTagOperation] = useState<'add' | 'remove' | 'set'>('add');
  const [isUpdating, setIsUpdating] = useState(false);

  const hasSelection = selectedIds.length > 0;

  const handleBulkStatusUpdate = async () => {
    if (!hasSelection) {
      toast.error(t('customers_page.bulk.no_selection'));
      return;
    }

    setIsUpdating(true);
    try {
      const headers = await getCSRFHeadersAlt();
      const response = await fetch('/api/customers/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerIds: selectedIds,
          operation: 'updateStatus',
          data: {
            status: selectedStatus,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('customers_page.bulk.status_update_failed'));
      }

      toast.success(t('customers_page.bulk.status_updated', {
        count: result.data.updated.toString(),
      }));

      setStatusDialogOpen(false);
      onComplete?.();
    } catch (error: any) {
      console.error('Bulk status update failed:', error);
      toast.error(error.message || t('customers_page.bulk.status_update_failed'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkTagUpdate = async () => {
    if (!hasSelection) {
      toast.error(t('customers_page.bulk.no_selection'));
      return;
    }

    if (tags.length === 0) {
      toast.error(t('customers_page.bulk.no_tags'));
      return;
    }

    setIsUpdating(true);
    try {
      const headers = await getCSRFHeadersAlt();
      const operation = tagOperation === 'add' ? 'addTags' : tagOperation === 'remove' ? 'removeTags' : 'setTags';
      
      const response = await fetch('/api/customers/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerIds: selectedIds,
          operation,
          data: {
            tags,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('customers_page.bulk.tag_update_failed'));
      }

      toast.success(t('customers_page.bulk.tags_updated', {
        count: result.data.updated.toString(),
      }));

      setTagsDialogOpen(false);
      setTags([]);
      onComplete?.();
    } catch (error: any) {
      console.error('Bulk tag update failed:', error);
      toast.error(error.message || t('customers_page.bulk.tag_update_failed'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkExport = () => {
    if (!hasSelection) {
      toast.error(t('customers_page.bulk.no_selection'));
      return;
    }

    if (onExport) {
      onExport(selectedIds);
    }
  };

  if (!hasSelection) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
      <div className="flex-1">
        <p className="text-sm font-medium" suppressHydrationWarning>
          {t('customers_page.bulk.selected', { count: selectedIds.length.toString() })}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStatusDialogOpen(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          {t('customers_page.bulk.update_status')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTagsDialogOpen(true)}
        >
          <Tag className="h-4 w-4 mr-2" />
          {t('customers_page.bulk.update_tags')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkExport}
        >
          <FileDown className="h-4 w-4 mr-2" />
          {t('customers_page.bulk.export')}
        </Button>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>{t('customers_page.bulk.update_status_title')}</DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {t('customers_page.bulk.update_status_description', { count: selectedIds.length.toString() })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label suppressHydrationWarning>{t('status')}</Label>
              <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('customers_page.status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('customers_page.status.inactive')}</SelectItem>
                  <SelectItem value="lead">{t('customers_page.status.lead')}</SelectItem>
                  <SelectItem value="prospect">{t('customers_page.status.prospect')}</SelectItem>
                  <SelectItem value="archived">{t('customers_page.status.archived')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleBulkStatusUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                t('update')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags Update Dialog */}
      <Dialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>{t('customers_page.bulk.update_tags_title')}</DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {t('customers_page.bulk.update_tags_description', { count: selectedIds.length.toString() })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label suppressHydrationWarning>{t('customers_page.bulk.tag_operation')}</Label>
              <Select value={tagOperation} onValueChange={(value: 'add' | 'remove' | 'set') => setTagOperation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">{t('customers_page.bulk.add_tags')}</SelectItem>
                  <SelectItem value="remove">{t('customers_page.bulk.remove_tags')}</SelectItem>
                  <SelectItem value="set">{t('customers_page.bulk.set_tags')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <CustomerTagsInput
                tags={tags}
                onTagsChange={setTags}
                placeholder={t('customers_page.bulk.enter_tags')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTagsDialogOpen(false);
              setTags([]);
            }}>
              {t('cancel')}
            </Button>
            <Button onClick={handleBulkTagUpdate} disabled={isUpdating || tags.length === 0}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                t('update')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

