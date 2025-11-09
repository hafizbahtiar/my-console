"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/language-context";
import { Upload, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import type { CollectionInfo } from "@/app/auth/admin/database/types";

interface DatabaseImportProps {
  collections: CollectionInfo[];
  onImportComplete: () => void;
}

export function DatabaseImport({ collections, onImportComplete }: DatabaseImportProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [format, setFormat] = useState<'csv' | 'json' | 'excel'>('json');
  const [overwrite, setOverwrite] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Auto-detect format from file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') setFormat('csv');
    else if (extension === 'xlsx' || extension === 'xls') setFormat('excel');
    else if (extension === 'json') setFormat('json');

    if (!selectedCollection) {
      toast.error(t('database_page.import.collection_required'));
      return;
    }

    await handleImport(file);
  };

  const handleImport = async (file: File) => {
    if (!selectedCollection) {
      toast.error(t('database_page.import.collection_required'));
      return;
    }

    setIsImporting(true);
    try {
      let fileData: string | ArrayBuffer;

      if (format === 'json' || format === 'csv') {
        fileData = await file.text();
      } else {
        // Excel - read as ArrayBuffer
        fileData = await file.arrayBuffer();
      }

      const response = await fetch('/api/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: format === 'excel' 
            ? Buffer.from(fileData as ArrayBuffer).toString('base64')
            : fileData,
          options: {
            collectionId: selectedCollection,
            format,
            overwrite,
            skipErrors,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('database_page.import.import_failed'));
      }

      toast.success(t('database_page.import.imported_success', {
        imported: result.data.imported.toString(),
        total: result.data.total.toString(),
      }));

      if (result.data.errors > 0) {
        toast.warning(t('database_page.import.imported_with_errors', {
          errors: result.data.errors.toString(),
        }));
      }

      setOpen(false);
      setSelectedCollection("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onImportComplete();
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error instanceof Error ? error.message : t('database_page.import.import_failed'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          <span suppressHydrationWarning>{t('database_page.import.import_data')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] sm:w-full max-w-md">
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>{t('database_page.import.title')}</DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t('database_page.import.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label suppressHydrationWarning>{t('database_page.import.collection')}</Label>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger>
                <SelectValue placeholder={t('database_page.import.select_collection')} />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label suppressHydrationWarning>{t('database_page.import.format')}</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel (XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label suppressHydrationWarning>{t('database_page.import.file')}</Label>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={format === 'json' ? '.json' : format === 'csv' ? '.csv' : '.xlsx,.xls'}
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
                disabled={!selectedCollection || isImporting}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedCollection || isImporting}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span suppressHydrationWarning>{t('database_page.import.select_file')}</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite"
                checked={overwrite}
                onCheckedChange={(checked) => setOverwrite(checked === true)}
                disabled={isImporting}
              />
              <Label htmlFor="overwrite" className="text-sm cursor-pointer" suppressHydrationWarning>
                {t('database_page.import.overwrite')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipErrors"
                checked={skipErrors}
                onCheckedChange={(checked) => setSkipErrors(checked === true)}
                disabled={isImporting}
              />
              <Label htmlFor="skipErrors" className="text-sm cursor-pointer" suppressHydrationWarning>
                {t('database_page.import.skip_errors')}
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isImporting}
            suppressHydrationWarning
          >
            {t('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

