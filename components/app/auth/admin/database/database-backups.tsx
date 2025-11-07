"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/language-context";
import type { BackupRecord } from "@/app/auth/admin/database/types";

interface DatabaseBackupsProps {
  backupHistory: BackupRecord[];
  onRefresh: () => void;
}

export function DatabaseBackups({ backupHistory, onRefresh }: DatabaseBackupsProps) {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  const handleDeleteBackup = (backupId: string) => {
    setBackupToDelete(backupId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBackup = async () => {
    if (!backupToDelete) return;

    try {
      const response = await fetch(`/api/backups/${backupToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t("database.failed_to_delete_backup"));
      }

      toast.success(t("database.backup_deleted_successfully"));

      // Refresh backup history
      onRefresh();
      setDeleteDialogOpen(false);
      setBackupToDelete(null);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      toast.error(error instanceof Error ? error.message : t("database.failed_to_delete_backup"));
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
          <CardTitle>{t("database.backup_history")}</CardTitle>
          <CardDescription>
            {t("database.recent_database_backups")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("database.backup_id")}</TableHead>
                <TableHead>{t("general_use.type")}</TableHead>
                <TableHead>{t("general_use.status")}</TableHead>
                <TableHead>{t("database.size")}</TableHead>
                <TableHead>{t("database.collections")}</TableHead>
                <TableHead>{t("general_use.created")}</TableHead>
                <TableHead>{t("general_use.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backupHistory.length > 0 ? (
                backupHistory.slice(0, 10).map((backup: BackupRecord, index: number) => (
                  <TableRow key={backup.id || index}>
                    <TableCell className="font-mono text-sm">
                      {backup.id || `backup_${String(index + 1).padStart(3, '0')}`}
                    </TableCell>
                    <TableCell>
                      <BackupStatusBadge status={backup.type || 'manual'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon('completed')}
                        <span className="capitalize">{t("status.completed")}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {backup.totalRecords ? `${(backup.totalRecords * 0.5).toFixed(1)} MB` : 'Unknown'}
                    </TableCell>
                    <TableCell>{backup.collections || 0}</TableCell>
                    <TableCell>
                      {backup.timestamp ? new Date(backup.timestamp).toLocaleString() : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" disabled>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t("database.no_backup_history_available")}</p>
                    <p className="text-sm">{t("database.backups_will_appear_here")}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("database.delete_backup")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("database.delete_backup_confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupToDelete(null)}>
              {t("database.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBackup}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("database.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
