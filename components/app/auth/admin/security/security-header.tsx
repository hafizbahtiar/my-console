"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface SecurityHeaderProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export function SecurityHeader({ onRefresh, refreshing }: SecurityHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" suppressHydrationWarning>
          {t('security_page.title')}
        </h1>
        <p className="text-muted-foreground" suppressHydrationWarning>
          {t('security_page.description')}
        </p>
      </div>
      <Button onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
        <span suppressHydrationWarning>{t('refresh')}</span>
      </Button>
    </div>
  );
}

