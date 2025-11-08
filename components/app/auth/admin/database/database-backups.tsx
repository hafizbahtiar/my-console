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
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { BackupRecord } from "@/app/auth/admin/database/types";

interface DatabaseBackupsProps {
  backupHistory: BackupRecord[];
  onRefresh: () => void;
}

export function DatabaseBackups({ backupHistory, onRefresh }: DatabaseBackupsProps) {
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
        throw new Error("Failed to delete backup");
      }

      toast.success("Backup deleted successfully");

      // Refresh backup history
      onRefresh();
      setDeleteDialogOpen(false);
      setBackupToDelete(null);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete backup");
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
          <CardTitle className="text-base sm:text-lg">Backup History</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Recent database backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Backup ID</TableHead>
                  <TableHead className="text-xs sm:text-sm">Type</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Size</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Collections</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-xs sm:text-sm">Actions</TableHead>
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
                          <span className="text-xs sm:text-sm capitalize truncate">Completed</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {backup.totalRecords ? `${(backup.totalRecords * 0.5).toFixed(1)} MB` : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{backup.collections || 0}</TableCell>
                      <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                        {backup.timestamp ? new Date(backup.timestamp).toLocaleString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 sm:space-x-2">
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
                      <p className="text-xs sm:text-sm">No backup history available</p>
                      <p className="text-xs sm:text-sm mt-1">Backups will appear here</p>
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
            <AlertDialogTitle className="text-base sm:text-lg">Delete Backup</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm mt-2">
              Are you sure you want to delete this backup? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 px-0 sm:px-0 mt-4 sm:mt-0">
            <AlertDialogCancel onClick={() => setBackupToDelete(null)} className="w-full sm:w-auto order-2 sm:order-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBackup}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto order-1 sm:order-2"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
