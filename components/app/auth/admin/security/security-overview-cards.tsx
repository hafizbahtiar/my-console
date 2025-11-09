"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ban, AlertTriangle, Shield } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface IPBlocklistEntry {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
  isActive: boolean;
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: string;
  description: string;
}

interface SecurityOverviewCardsProps {
  ipBlocklist: IPBlocklistEntry[];
  securityEvents: SecurityEvent[];
}

export function SecurityOverviewCards({ ipBlocklist, securityEvents }: SecurityOverviewCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" suppressHydrationWarning>
            {t('security_page.overview.blocked_ips')}
          </CardTitle>
          <Ban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {ipBlocklist.filter(ip => ip.isActive).length}
          </div>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('security_page.overview.currently_blocked')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" suppressHydrationWarning>
            {t('security_page.overview.security_events')}
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {securityEvents.length}
          </div>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('security_page.overview.custom_monitoring')}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium" suppressHydrationWarning>
            {t('security_page.overview.appwrite_status')}
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600" suppressHydrationWarning>
            {t('active')}
          </div>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('security_page.overview.built_in_security')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

