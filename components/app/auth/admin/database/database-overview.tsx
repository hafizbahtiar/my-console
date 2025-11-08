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
  Database,
  Power,
} from "lucide-react";
import { SystemHealthStatusBadge } from "@/components/custom/status-badge";

interface DatabaseOverviewProps {
  recentActivity: Record<string, unknown>[];
  systemHealth: {
    cpu: number;
    memory: number;
    storage: number;
    connections: string;
  } | null;
  databaseStats: {
    status: 'online' | 'offline' | 'maintenance' | 'error';
    active: boolean;
  } | null;
}

export function DatabaseOverview({ recentActivity, systemHealth, databaseStats }: DatabaseOverviewProps) {
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
        return "User login";
      case 'USER_LOGOUT':
        return "User logout";
      case 'PROFILE_UPDATE':
        return "Profile update";
      case 'SECURITY_EVENT':
        return "Security event";
      case 'BACKUP_STARTED':
        return "Database backup started";
      case 'BACKUP_COMPLETED':
        return "Database backup completed";
      default:
        return `${actionStr.toLowerCase().replace('_', ' ')}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'offline':
      case 'error':
        return 'text-red-600';
      case 'maintenance':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return "Online";
      case 'offline':
        return "Offline";
      case 'maintenance':
        return "Warning";
      case 'error':
        return "Error";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'maintenance':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Recent Activity
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Latest database operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity: Record<string, unknown>, index: number) => (
              <div key={index} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 pb-2 sm:pb-0 border-b sm:border-0 last:border-0">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="shrink-0">{getActivityIcon(activity.action)}</div>
                  <span className="text-xs sm:text-sm truncate">{getActivityText(activity.action)}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 pl-6 sm:pl-0">
                  {activity.$createdAt ? new Date(String(activity.$createdAt)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-6 sm:py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Server className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            System Health
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Database system status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
              <span className="truncate flex-1">CPU Usage</span>
              <span className="shrink-0 font-semibold">{systemHealth?.cpu || 0}%</span>
            </div>
            <Progress value={systemHealth?.cpu || 0} className="h-2" />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
              <span className="truncate flex-1">Memory Usage</span>
              <span className="shrink-0 font-semibold">{systemHealth?.memory || 0}%</span>
            </div>
            <Progress value={systemHealth?.memory || 0} className="h-2" />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
              <span className="truncate flex-1">Storage Usage</span>
              <span className="shrink-0 font-semibold">{systemHealth?.storage || 0}%</span>
            </div>
            <Progress value={systemHealth?.storage || 0} className="h-2" />
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
              <span className="truncate flex-1">Connection Pool</span>
              <span className="shrink-0 font-semibold">{systemHealth?.connections || '0/20'}</span>
            </div>
            <Progress value={systemHealth?.connections ? parseInt(systemHealth.connections.split('/')[0]) / parseInt(systemHealth.connections.split('/')[1]) * 100 : 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Database Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Database className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Status
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Current database state</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <SystemHealthStatusBadge
                status={
                  databaseStats?.status === 'online' ? 'healthy' :
                    databaseStats?.status === 'offline' ? 'critical' :
                      databaseStats?.status === 'maintenance' ? 'warning' :
                        'critical'
                }
              />
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                {databaseStats?.status === 'online' ? "Operational" : "Check status"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Active Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Power className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
            Active
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Database connectivity status</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="shrink-0">
                {databaseStats?.active ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <span className={`text-xs sm:text-sm font-medium truncate ${databaseStats?.active ? 'text-green-600' : 'text-red-600'}`}>
                {databaseStats?.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground shrink-0 pl-6 sm:pl-0">
              {databaseStats?.active ? "Responsive" : "Not responding"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
