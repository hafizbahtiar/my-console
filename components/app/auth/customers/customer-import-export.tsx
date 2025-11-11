"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { toast } from "sonner";
import { getCSRFHeadersAlt } from "@/lib/csrf-utils";

interface CustomerImportExportProps {
  onImportComplete?: () => void;
}

export function CustomerImportExport({ onImportComplete }: CustomerImportExportProps) {
  const { t } = useTranslation();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'excel'>('json');
  const [importFormat, setImportFormat] = useState<'json' | 'csv' | 'excel'>('json');
  const [overwrite, setOverwrite] = useState(false);
  const [skipErrors, setSkipErrors] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/customers/export?format=${exportFormat}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('customers_page.export.exported_success'));
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || t('customers_page.export.export_failed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleImport(file);
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    try {
      let fileData: string | ArrayBuffer;

      if (importFormat === 'json' || importFormat === 'csv') {
        fileData = await file.text();
      } else {
        fileData = await file.arrayBuffer();
      }

      const headers = await getCSRFHeadersAlt();
      const response = await fetch('/api/customers/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          data: importFormat === 'excel' 
            ? Buffer.from(fileData as ArrayBuffer).toString('base64')
            : fileData,
          options: {
            format: importFormat,
            overwrite,
            skipErrors,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('customers_page.import.import_failed'));
      }

      toast.success(t('customers_page.import.imported_success', {
        imported: result.data.imported.toString(),
        total: result.data.total.toString(),
      }));

      if (result.data.errors > 0) {
        toast.warning(t('customers_page.import.imported_with_errors', {
          errors: result.data.errors.toString(),
        }));
      }

      setImportDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onImportComplete?.();
    } catch (error: any) {
      console.error('Import failed:', error);
      toast.error(error.message || t('customers_page.import.import_failed'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* Export Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t('export')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>{t('customers_page.export.title')}</DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {t('customers_page.export.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label suppressHydrationWarning>{t('customers_page.export.format')}</Label>
              <Select value={exportFormat} onValueChange={(value: 'json' | 'csv' | 'excel') => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {}}>
              {t('close')}
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('exporting')}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {t('export')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Button */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            {t('import')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>{t('customers_page.import.title')}</DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {t('customers_page.import.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label suppressHydrationWarning>{t('customers_page.import.format')}</Label>
              <Select value={importFormat} onValueChange={(value: 'json' | 'csv' | 'excel') => setImportFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="import-file" suppressHydrationWarning>
                {t('customers_page.import.select_file')}
              </Label>
              <Input
                id="import-file"
                type="file"
                accept={importFormat === 'excel' ? '.xlsx,.xls' : importFormat === 'csv' ? '.csv' : '.json'}
                onChange={handleFileSelect}
                ref={fileInputRef}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwrite"
                  checked={overwrite}
                  onCheckedChange={(checked) => setOverwrite(checked as boolean)}
                />
                <Label htmlFor="overwrite" className="cursor-pointer" suppressHydrationWarning>
                  {t('customers_page.import.overwrite_existing')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-errors"
                  checked={skipErrors}
                  onCheckedChange={(checked) => setSkipErrors(checked as boolean)}
                />
                <Label htmlFor="skip-errors" className="cursor-pointer" suppressHydrationWarning>
                  {t('customers_page.import.skip_errors')}
                </Label>
              </div>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription suppressHydrationWarning>
                {t('customers_page.import.warning')}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('importing')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  {t('import')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

