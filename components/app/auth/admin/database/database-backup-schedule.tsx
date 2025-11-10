"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "@/lib/language-context";
import { Clock, Save, RefreshCw, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCSRFHeaders } from "@/lib/csrf-utils";

interface ScheduleConfig {
  cron: string;
  enabled: boolean;
  description: string;
}

interface BackupScheduleData {
  timezone: string;
  schedules: {
    daily: ScheduleConfig;
    weekly: ScheduleConfig;
    monthly: ScheduleConfig;
  };
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export function DatabaseBackupSchedule() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BackupScheduleData | null>(null);
  const [localConfig, setLocalConfig] = useState<BackupScheduleData | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup/schedule');
      const result = await response.json();
      if (result.success) {
        setConfig(result.data);
        setLocalConfig(result.data);
      } else {
        throw new Error(result.error || 'Failed to load schedule');
      }
    } catch (error) {
      console.error('Failed to load backup schedule:', error);
      toast.error(error instanceof Error ? error.message : t('database_page.backup_schedule.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  const updateSchedule = (type: 'daily' | 'weekly' | 'monthly', updates: Partial<ScheduleConfig>) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      schedules: {
        ...localConfig.schedules,
        [type]: {
          ...localConfig.schedules[type],
          ...updates,
        },
      },
    });
  };

  const updateRetention = (type: 'daily' | 'weekly' | 'monthly', value: number) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      retention: {
        ...localConfig.retention,
        [type]: value,
      },
    });
  };

  const saveSchedule = async () => {
    if (!localConfig) return;
    setSaving(true);
    try {
      const headers = await getCSRFHeaders();
      const response = await fetch('/api/backup/schedule', {
        method: 'POST',
        headers,
        body: JSON.stringify(localConfig),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(t('database_page.backup_schedule.saved_success'));
        setConfig(localConfig);
      } else {
        throw new Error(result.error || t('database_page.backup_schedule.save_failed'));
      }
    } catch (error) {
      console.error('Failed to save backup schedule:', error);
      toast.error(error instanceof Error ? error.message : t('database_page.backup_schedule.save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const parseCronExpression = (cron: string): { hour: string; minute: string; day?: string; month?: string } => {
    const parts = cron.trim().split(/\s+/);
    // Cron format: minute hour day-of-month month day-of-week
    // For daily: "0 2 * * *" -> [0, 2, *, *, *]
    // For weekly: "0 3 * * 0" -> [0, 3, *, *, 0] (0 = Sunday)
    // For monthly: "0 4 1 * *" -> [0, 4, 1, *, *] (1 = 1st of month)
    
    if (parts.length >= 5) {
      // Check if it's weekly (has day of week at position 4, and it's not *)
      if (parts[4] !== '*' && parts[2] === '*' && parts[3] === '*') {
        return {
          minute: parts[0] || '0',
          hour: parts[1] || '2',
          day: parts[4], // day of week (0-6)
        };
      }
      // Check if it's monthly (has day of month at position 2, and it's not *)
      if (parts[2] !== '*' && parts[3] === '*' && parts[4] === '*') {
        return {
          minute: parts[0] || '0',
          hour: parts[1] || '2',
          day: parts[2], // day of month (1-31)
          month: '*', // Always * for monthly
        };
      }
      // Daily (all * except minute and hour)
      return {
        minute: parts[0] || '0',
        hour: parts[1] || '2',
      };
    }
    
    return {
      minute: '0',
      hour: '2',
    };
  };

  const buildCronExpression = (hour: string, minute: string, day?: string, month?: string): string => {
    // If month is provided (even if '*'), it's monthly format: "minute hour day * *"
    // Monthly: "0 4 1 * *" = minute hour day-of-month month day-of-week
    if (month !== undefined) {
      return `${minute} ${hour} ${day || '1'} * *`;
    }
    // If day is provided and it's a number 0-6, it's weekly format: "minute hour * * day"
    // Weekly: "0 3 * * 0" = minute hour day-of-month month day-of-week
    if (day && /^[0-6]$/.test(day)) {
      return `${minute} ${hour} * * ${day}`;
    }
    // Otherwise daily format: "minute hour * * *"
    // Daily: "0 2 * * *" = minute hour day-of-month month day-of-week
    return `${minute} ${hour} * * *`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!config || !localConfig) {
    return (
      <Card>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription suppressHydrationWarning>
              {t('database_page.backup_schedule.load_failed')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const dailyCron = parseCronExpression(localConfig.schedules.daily.cron);
  const weeklyCron = parseCronExpression(localConfig.schedules.weekly.cron);
  const monthlyCron = parseCronExpression(localConfig.schedules.monthly.cron);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2" suppressHydrationWarning>
            <Clock className="h-5 w-5" />
            {t('database_page.backup_schedule.title')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
            {t('database_page.backup_schedule.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm" suppressHydrationWarning>
              {t('database_page.backup_schedule.note')}
            </AlertDescription>
          </Alert>

          {/* Timezone */}
          <div className="space-y-2">
            <Label suppressHydrationWarning>{t('database_page.backup_schedule.timezone')}</Label>
            <Select
              value={localConfig.timezone}
              onValueChange={(value) => setLocalConfig({ ...localConfig, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                <SelectItem value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (MYT)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Daily Schedule */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium" suppressHydrationWarning>
                  {t('database_page.backup_schedule.daily')}
                </h4>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {localConfig.schedules.daily.description}
                </p>
              </div>
              <Switch
                checked={localConfig.schedules.daily.enabled}
                onCheckedChange={(checked) => updateSchedule('daily', { enabled: checked })}
              />
            </div>
            {localConfig.schedules.daily.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs" suppressHydrationWarning>{t('database_page.backup_schedule.hour')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={dailyCron.hour}
                    onChange={(e) => {
                      const newCron = buildCronExpression(e.target.value, dailyCron.minute);
                      updateSchedule('daily', { cron: newCron });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" suppressHydrationWarning>{t('database_page.backup_schedule.minute')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={dailyCron.minute}
                    onChange={(e) => {
                      const newCron = buildCronExpression(dailyCron.hour, e.target.value);
                      updateSchedule('daily', { cron: newCron });
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium" suppressHydrationWarning>
                  {t('database_page.backup_schedule.weekly')}
                </h4>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {localConfig.schedules.weekly.description}
                </p>
              </div>
              <Switch
                checked={localConfig.schedules.weekly.enabled}
                onCheckedChange={(checked) => updateSchedule('weekly', { enabled: checked })}
              />
            </div>
            {localConfig.schedules.weekly.enabled && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs" suppressHydrationWarning>{t('database_page.backup_schedule.hour')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={weeklyCron.hour}
                    onChange={(e) => {
                      const day = weeklyCron.day || '0';
                      const newCron = buildCronExpression(e.target.value, weeklyCron.minute, day);
                      updateSchedule('weekly', { cron: newCron });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" suppressHydrationWarning>{t('database_page.backup_schedule.minute')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={weeklyCron.minute}
                    onChange={(e) => {
                      const day = weeklyCron.day || '0';
                      const newCron = buildCronExpression(weeklyCron.hour, e.target.value, day);
                      updateSchedule('weekly', { cron: newCron });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" suppressHydrationWarning>{t('database_page.backup_schedule.day_of_week')}</Label>
                  <Select
                    value={weeklyCron.day || '0'}
                    onValueChange={(value) => {
                      const newCron = buildCronExpression(weeklyCron.hour, weeklyCron.minute, value);
                      updateSchedule('weekly', { cron: newCron });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0" suppressHydrationWarning>{t('database_page.backup_schedule.sunday')}</SelectItem>
                      <SelectItem value="1" suppressHydrationWarning>{t('database_page.backup_schedule.monday')}</SelectItem>
                      <SelectItem value="2" suppressHydrationWarning>{t('database_page.backup_schedule.tuesday')}</SelectItem>
                      <SelectItem value="3" suppressHydrationWarning>{t('database_page.backup_schedule.wednesday')}</SelectItem>
                      <SelectItem value="4" suppressHydrationWarning>{t('database_page.backup_schedule.thursday')}</SelectItem>
                      <SelectItem value="5" suppressHydrationWarning>{t('database_page.backup_schedule.friday')}</SelectItem>
                      <SelectItem value="6" suppressHydrationWarning>{t('database_page.backup_schedule.saturday')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Schedule */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium" suppressHydrationWarning>
                  {t('database_page.backup_schedule.monthly')}
                </h4>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {localConfig.schedules.monthly.description}
                </p>
              </div>
              <Switch
                checked={localConfig.schedules.monthly.enabled}
                onCheckedChange={(checked) => updateSchedule('monthly', { enabled: checked })}
              />
            </div>
            {localConfig.schedules.monthly.enabled && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs" suppressHydrationWarning>{t('database_page.backup_schedule.hour')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={monthlyCron.hour}
                    onChange={(e) => {
                      const day = monthlyCron.day || '1';
                      const newCron = buildCronExpression(e.target.value, monthlyCron.minute, day, '*');
                      updateSchedule('monthly', { cron: newCron });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" suppressHydrationWarning>{t('database_page.backup_schedule.minute')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={monthlyCron.minute}
                    onChange={(e) => {
                      const day = monthlyCron.day || '1';
                      const newCron = buildCronExpression(monthlyCron.hour, e.target.value, day, '*');
                      updateSchedule('monthly', { cron: newCron });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" suppressHydrationWarning>{t('database_page.backup_schedule.day_of_month')}</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={monthlyCron.day || '1'}
                    onChange={(e) => {
                      const newCron = buildCronExpression(monthlyCron.hour, monthlyCron.minute, e.target.value, '*');
                      updateSchedule('monthly', { cron: newCron });
                    }}
                  />
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {t('database_page.backup_schedule.day_of_month_hint')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Retention Policy */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h4 className="text-sm font-medium" suppressHydrationWarning>
              {t('database_page.backup_schedule.retention_policy')}
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs" suppressHydrationWarning>
                  {t('database_page.backup_schedule.daily_retention')}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={localConfig.retention.daily}
                  onChange={(e) => updateRetention('daily', parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.backup_schedule.days')}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs" suppressHydrationWarning>
                  {t('database_page.backup_schedule.weekly_retention')}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={localConfig.retention.weekly}
                  onChange={(e) => updateRetention('weekly', parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.backup_schedule.weeks')}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs" suppressHydrationWarning>
                  {t('database_page.backup_schedule.monthly_retention')}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={localConfig.retention.monthly}
                  onChange={(e) => updateRetention('monthly', parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t('database_page.backup_schedule.months')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={saveSchedule} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span suppressHydrationWarning>{t('database_page.backup_schedule.saving')}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <span suppressHydrationWarning>{t('database_page.backup_schedule.save')}</span>
                </>
              )}
            </Button>
            <Button variant="outline" onClick={loadSchedule} disabled={saving}>
              <RefreshCw className="h-4 w-4 mr-2" />
              <span suppressHydrationWarning>{t('refresh')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

