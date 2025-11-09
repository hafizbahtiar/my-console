"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { StatusBadge } from "@/components/custom/status-badge";

interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'policy_violation' | 'session_anomaly';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface RecentAlertsCardProps {
  securityEvents: SecurityEvent[];
}

export function RecentAlertsCard({ securityEvents }: RecentAlertsCardProps) {
  const { t } = useTranslation();

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />;
      case 'policy_violation': return <Shield className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          {t('security_page.overview.recent_alerts')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {securityEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {getEventTypeIcon(event.type)}
                  <div>
                    <p className="text-sm font-medium">{event.description}</p>
                    <p className="text-xs text-muted-foreground">{event.ipAddress}</p>
                  </div>
                </div>
                <Badge variant={getSeverityColor(event.severity) as any}>
                  {event.severity}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

