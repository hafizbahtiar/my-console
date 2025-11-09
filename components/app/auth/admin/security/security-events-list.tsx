"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Shield, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/language-context";

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

interface SecurityEventsListProps {
  securityEvents: SecurityEvent[];
}

export function SecurityEventsList({ securityEvents }: SecurityEventsListProps) {
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
        <CardTitle suppressHydrationWarning>
          {t('security_page.events.title')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('security_page.events.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {securityEvents.map((event) => (
              <div key={event.id} className="p-4 border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEventTypeIcon(event.type)}
                    <span className="text-sm font-medium capitalize" suppressHydrationWarning>
                      {event.type.replace('_', ' ')}
                    </span>
                  </div>
                  <Badge variant={getSeverityColor(event.severity) as any}>
                    {event.severity}
                  </Badge>
                </div>
                <p className="text-sm">{event.description}</p>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{event.ipAddress}</span>
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                {event.userId && (
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {t('security_page.events.user')}: {event.userId}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

