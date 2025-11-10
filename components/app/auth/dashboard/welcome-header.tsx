"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { Models } from "appwrite";

interface WelcomeHeaderProps {
  user: Models.User<Models.Preferences>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

export function WelcomeHeader({ user, isSuperAdmin, isAdmin }: WelcomeHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 sm:gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" suppressHydrationWarning>
            {t('dashboard_page.title')}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base" suppressHydrationWarning>
            {t('dashboard_page.welcome_message', { name: user.name || user.email })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800" suppressHydrationWarning>
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('online')}
          </Badge>
          {(isSuperAdmin || isAdmin) && (
            <Badge variant="default" suppressHydrationWarning>
              <Shield className="h-3 w-3 mr-1" />
              {isSuperAdmin ? t('dashboard_page.super_admin') : t('dashboard_page.admin')}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

