"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/lib/language-context";
import { ExternalLink, Database, Info, Key, ArrowUp, ArrowDown } from "lucide-react";
import type { CollectionInfo } from "@/app/auth/admin/database/types";

interface DatabaseIndexManagementProps {
  collections: CollectionInfo[];
}

export function DatabaseIndexManagement({ collections }: DatabaseIndexManagementProps) {
  const { t } = useTranslation();
  const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'console-db';
  
  // Construct Appwrite Console URL for database
  const consoleUrl = appwriteEndpoint.includes('cloud.appwrite.io')
    ? `https://cloud.appwrite.io/console/project-${projectId}/database/database-${databaseId}`
    : `${appwriteEndpoint.replace('/v1', '')}/console/project-${projectId}/database/database-${databaseId}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2" suppressHydrationWarning>
          <Key className="h-5 w-5" />
          {t('database_page.index_management.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('database_page.index_management.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('database_page.index_management.note')}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium" suppressHydrationWarning>
                  {t('database_page.index_management.manage_in_console')}
                </p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.index_management.manage_in_console_description')}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(consoleUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span suppressHydrationWarning>{t('database_page.index_management.open_console')}</span>
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium" suppressHydrationWarning>
              {t('database_page.index_management.index_types')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-medium" suppressHydrationWarning>
                    {t('database_page.index_management.key_index')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.index_management.key_index_description')}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUp className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium" suppressHydrationWarning>
                    {t('database_page.index_management.unique_index')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.index_management.unique_index_description')}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDown className="h-4 w-4 text-orange-500" />
                  <p className="text-sm font-medium" suppressHydrationWarning>
                    {t('database_page.index_management.fulltext_index')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.index_management.fulltext_index_description')}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2" suppressHydrationWarning>
              {t('database_page.index_management.best_practices')}
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span suppressHydrationWarning>{t('database_page.index_management.practice_1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span suppressHydrationWarning>{t('database_page.index_management.practice_2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span suppressHydrationWarning>{t('database_page.index_management.practice_3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span suppressHydrationWarning>{t('database_page.index_management.practice_4')}</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

