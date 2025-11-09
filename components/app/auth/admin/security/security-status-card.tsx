"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

export function SecurityStatusCard() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
          <Shield className="h-5 w-5 text-green-500" />
          {t('security_page.overview.security_status')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm" suppressHydrationWarning>
            {t('security_page.overview.appwrite_security')}
          </span>
          <Badge variant="default" suppressHydrationWarning>
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('active')}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" suppressHydrationWarning>
            {t('security_page.overview.ip_filtering')}
          </span>
          <Badge variant="default" suppressHydrationWarning>
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('security_page.overview.enabled')}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm" suppressHydrationWarning>
            {t('security_page.overview.custom_events')}
          </span>
          <Badge variant="default" suppressHydrationWarning>
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('security_page.overview.monitoring')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

