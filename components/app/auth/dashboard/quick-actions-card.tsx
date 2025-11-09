"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Database, Shield, FileText } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import Link from "next/link";

interface QuickActionsCardProps {
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

export function QuickActionsCard({ isSuperAdmin, isAdmin }: QuickActionsCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg" suppressHydrationWarning>
          {t('dashboard_page.quick_actions.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('dashboard_page.quick_actions.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        <Button variant="default" className="w-full justify-start" size="sm" asChild>
          <Link href="/auth/blog/blog-posts/create">
            <FileText className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate" suppressHydrationWarning>
              {t('dashboard_page.quick_actions.create_blog_post')}
            </span>
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" size="sm" asChild>
          <Link href="/auth/profile">
            <Settings className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate" suppressHydrationWarning>
              {t('dashboard_page.quick_actions.account_settings')}
            </span>
          </Link>
        </Button>
        {(isSuperAdmin || isAdmin) && (
          <>
            <Button variant="outline" className="w-full justify-start" size="sm" asChild>
              <Link href="/auth/admin/database">
                <Database className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate" suppressHydrationWarning>
                  {t('dashboard_page.quick_actions.database_admin')}
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm" asChild>
              <Link href="/auth/audit">
                <Shield className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate" suppressHydrationWarning>
                  {t('dashboard_page.quick_actions.audit_logs')}
                </span>
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

