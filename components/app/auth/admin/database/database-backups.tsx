"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/language-context";
import { BackupStatusBadge } from "@/components/custom/status-badge";
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
import { Download, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { BackupRecord } from "@/app/auth/admin/database/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DatabaseBackupsProps {
  backupHistory: BackupRecord[];
  onRefresh: () => void;
}

export function DatabaseBackups({ backupHistory, onRefresh }: DatabaseBackupsProps) {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<string | null>(null);
  const [restoreFormat, setRestoreFormat] = useState<'sql' | 'bson' | 'excel' | 'auto'>('auto');
  const [overwrite, setOverwrite] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteBackup = (backupId: string) => {
    setBackupToDelete(backupId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBackup = async () => {
    if (!backupToDelete) return;

    setIsDeleting(true);
    try {
      // Get CSRF token first
      const csrfResponse = await fetch('/api/csrf-token');
      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }
      const { token } = await csrfResponse.json();

      // Make delete request with CSRF token
      const response = await fetch(`/api/backups/${backupToDelete}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': token,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('database_page.backups.delete_dialog.delete_failed'));
      }

      toast.success(t('database_page.backups.delete_dialog.deleted_success'));

      // Refresh backup history
      onRefresh();
      setDeleteDialogOpen(false);
      setBackupToDelete(null);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      toast.error(error instanceof Error ? error.message : t('database_page.backups.delete_dialog.delete_failed'));
      // Keep dialog open on error so user can retry
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreBackup = (backupId: string) => {
    setBackupToRestore(backupId);
    setRestoreDialogOpen(true);
  };

  const confirmRestoreBackup = async () => {
    if (!backupToRestore) return;

    setIsRestoring(true);
    try {
      // Get CSRF token first
      const csrfResponse = await fetch('/api/csrf-token');
      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }
      const { token } = await csrfResponse.json();

      // Make restore request with CSRF token
      const response = await fetch(`/api/backups/${backupToRestore}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({
          format: restoreFormat === 'auto' ? undefined : restoreFormat,
          overwrite,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t('database_page.backups.restore_dialog.restore_failed'));
      }

      toast.success(t('database_page.backups.restore_dialog.restored_success', {
        collections: result.data.collections.toString(),
        records: result.data.totalRecords.toString(),
      }));

      // Refresh backup history and database data
      onRefresh();
      setRestoreDialogOpen(false);
      setBackupToRestore(null);
      setRestoreFormat('auto');
      setOverwrite(false);
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast.error(error instanceof Error ? error.message : t('database_page.backups.restore_dialog.restore_failed'));
    } finally {
      setIsRestoring(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "completed":
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "warning":
        return (
          <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case "error":
      case "failed":
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
            {t('database_page.backups.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('database_page.backups.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm" suppressHydrationWarning>
                    {t('database_page.backups.backup_id')}
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm" suppressHydrationWarning>
                    {t('type')}
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm" suppressHydrationWarning>
                    {t('status')}
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm" suppressHydrationWarning>
                    {t('database_page.backups.size')}
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell" suppressHydrationWarning>
                    {t('database_page.backups.collections')}
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell" suppressHydrationWarning>
                    {t('created')}
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm" suppressHydrationWarning>
                    {t('actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupHistory.length > 0 ? (
                  backupHistory.slice(0, 10).map((backup: BackupRecord, index: number) => (
                    <TableRow key={backup.id || index}>
                      <TableCell className="font-mono text-xs sm:text-sm max-w-[100px] sm:max-w-none truncate">
                        {backup.id || `backup_${String(index + 1).padStart(3, '0')}`}
                      </TableCell>
                      <TableCell>
                        <BackupStatusBadge status={backup.type || 'manual'} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="shrink-0">{getStatusIcon('completed')}</div>
                          <span className="text-xs sm:text-sm capitalize truncate" suppressHydrationWarning>
                            {t('database_page.backups.completed')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {backup.totalRecords ? `${(backup.totalRecords * 0.5).toFixed(1)} MB` : t('database_page.backups.unknown_size')}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{backup.collections || 0}</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden md:table-cell" suppressHydrationWarning>
                        {backup.timestamp ? new Date(backup.timestamp).toLocaleString() : t('database_page.backups.unknown_time')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreBackup(backup.id)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                            title={t('database_page.backups.restore')}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBackup(backup.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs sm:text-sm" suppressHydrationWarning>
                        {t('database_page.backups.no_backup_history')}
                      </p>
                      <p className="text-xs sm:text-sm mt-1" suppressHydrationWarning>
                        {t('database_page.backups.backups_will_appear')}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[90vw] sm:w-full max-w-md p-4 sm:p-6">
          <AlertDialogHeader className="px-0 sm:px-0">
            <AlertDialogTitle className="text-base sm:text-lg" suppressHydrationWarning>
              {t('database_page.backups.delete_dialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm mt-2" suppressHydrationWarning>
              {t('database_page.backups.delete_dialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 px-0 sm:px-0 mt-4 sm:mt-0">
            <AlertDialogCancel onClick={() => setBackupToDelete(null)} className="w-full sm:w-auto order-2 sm:order-1" suppressHydrationWarning>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBackup}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto order-1 sm:order-2"
              disabled={isDeleting}
              suppressHydrationWarning
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('database_page.backups.delete_dialog.deleting')}
                </>
              ) : (
                t('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent className="w-[90vw] sm:w-full max-w-md p-4 sm:p-6">
          <AlertDialogHeader className="px-0 sm:px-0">
            <AlertDialogTitle className="text-base sm:text-lg" suppressHydrationWarning>
              {t('database_page.backups.restore_dialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm mt-2" suppressHydrationWarning>
              {t('database_page.backups.restore_dialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm" suppressHydrationWarning>
                {t('database_page.backups.restore_dialog.format')}
              </Label>
              <Select value={restoreFormat} onValueChange={(value) => setRestoreFormat(value as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto" suppressHydrationWarning>
                    {t('database_page.backups.restore_dialog.auto_detect')}
                  </SelectItem>
                  <SelectItem value="sql" suppressHydrationWarning>PostgreSQL (SQL)</SelectItem>
                  <SelectItem value="bson" suppressHydrationWarning>MongoDB (BSON)</SelectItem>
                  <SelectItem value="excel" suppressHydrationWarning>Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite"
                checked={overwrite}
                onCheckedChange={(checked) => setOverwrite(checked === true)}
              />
              <Label htmlFor="overwrite" className="text-xs sm:text-sm cursor-pointer" suppressHydrationWarning>
                {t('database_page.backups.restore_dialog.overwrite')}
              </Label>
            </div>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 px-0 sm:px-0 mt-4 sm:mt-0">
            <AlertDialogCancel
              onClick={() => {
                setBackupToRestore(null);
                setRestoreFormat('auto');
                setOverwrite(false);
              }}
              className="w-full sm:w-auto order-2 sm:order-1"
              disabled={isRestoring}
              suppressHydrationWarning
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestoreBackup}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto order-1 sm:order-2"
              disabled={isRestoring}
              suppressHydrationWarning
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('database_page.backups.restore_dialog.restoring')}
                </>
              ) : (
                t('database_page.backups.restore_dialog.restore')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
