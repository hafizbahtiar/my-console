"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/lib/language-context";
import { ExternalLink, Database, Info, BookOpen, Settings } from "lucide-react";
import type { CollectionInfo } from "@/app/auth/admin/database/types";

interface DatabaseCollectionManagementProps {
  collections: CollectionInfo[];
}

export function DatabaseCollectionManagement({ collections }: DatabaseCollectionManagementProps) {
  const { t } = useTranslation();
  const appwriteEndpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'console-db';
  
  // Construct Appwrite Console URL
  const consoleUrl = appwriteEndpoint.includes('cloud.appwrite.io')
    ? `https://cloud.appwrite.io/console/project-${projectId}/database/database-${databaseId}`
    : `${appwriteEndpoint.replace('/v1', '')}/console/project-${projectId}/database/database-${databaseId}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2" suppressHydrationWarning>
          <Database className="h-5 w-5" />
          {t('database_page.collection_management.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('database_page.collection_management.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('database_page.collection_management.note')}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium" suppressHydrationWarning>
                  {t('database_page.collection_management.manage_in_console')}
                </p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.collection_management.manage_in_console_description')}
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
              <span suppressHydrationWarning>{t('database_page.collection_management.open_console')}</span>
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2" suppressHydrationWarning>
              <BookOpen className="h-4 w-4" />
              {t('database_page.collection_management.current_collections')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium truncate">{collection.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{collection.id}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {collection.documents.toLocaleString()} {t('database_page.collections.documents').toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2" suppressHydrationWarning>
              {t('database_page.collection_management.actions')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium mb-1" suppressHydrationWarning>
                  {t('database_page.collection_management.create_collection')}
                </p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.collection_management.create_collection_description')}
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-sm font-medium mb-1" suppressHydrationWarning>
                  {t('database_page.collection_management.edit_collection')}
                </p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.collection_management.edit_collection_description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

