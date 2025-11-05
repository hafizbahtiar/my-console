"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Server,
  Users,
  Shield,
  User,
  AlertCircle,
  Download,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/language-context";

interface DatabaseOverviewProps {
  recentActivity: Record<string, unknown>[];
  systemHealth: {
    cpu: number;
    memory: number;
    storage: number;
    connections: string;
  } | null;
}

export function DatabaseOverview({ recentActivity, systemHealth }: DatabaseOverviewProps) {
  const { t } = useTranslation();

  const getActivityIcon = (action: unknown) => {
    const actionStr = String(action);
    switch (actionStr) {
      case 'USER_LOGIN':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'USER_LOGOUT':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'PROFILE_UPDATE':
        return <User className="h-4 w-4 text-orange-500" />;
      case 'SECURITY_EVENT':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'BACKUP_STARTED':
        return <Download className="h-4 w-4 text-blue-500" />;
      case 'BACKUP_COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityText = (action: unknown) => {
    const actionStr = String(action);
    switch (actionStr) {
      case 'USER_LOGIN':
        return t("database.user_login");
      case 'USER_LOGOUT':
        return t("database.user_logout");
      case 'PROFILE_UPDATE':
        return t("database.profile_update");
      case 'SECURITY_EVENT':
        return t("database.security_event");
      case 'BACKUP_STARTED':
        return t("database.database_backup_started");
      case 'BACKUP_COMPLETED':
        return t("database.database_backup_completed");
      default:
        return `${actionStr.toLowerCase().replace('_', ' ')}`;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t("database.recent_activity")}
          </CardTitle>
          <CardDescription>{t("database.latest_database_operations")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity: Record<string, unknown>, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getActivityIcon(activity.action)}
                  <span className="text-sm">{getActivityText(activity.action)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activity.$createdAt ? new Date(String(activity.$createdAt)).toLocaleString() : 'Unknown time'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("database.no_recent_activity")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {t("database.system_health")}
          </CardTitle>
          <CardDescription>{t("database.database_system_status")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("database.cpu_usage")}</span>
              <span>{systemHealth?.cpu || 0}%</span>
            </div>
            <Progress value={systemHealth?.cpu || 0} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("database.memory_usage")}</span>
              <span>{systemHealth?.memory || 0}%</span>
            </div>
            <Progress value={systemHealth?.memory || 0} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("database.storage_usage")}</span>
              <span>{systemHealth?.storage || 0}%</span>
            </div>
            <Progress value={systemHealth?.storage || 0} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("database.connection_pool")}</span>
              <span>{systemHealth?.connections || '0/20'}</span>
            </div>
            <Progress value={systemHealth?.connections ? parseInt(systemHealth.connections.split('/')[0]) / parseInt(systemHealth.connections.split('/')[1]) * 100 : 0} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
