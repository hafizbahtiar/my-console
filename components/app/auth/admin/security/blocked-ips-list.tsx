"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/language-context";

interface IPBlocklistEntry {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
  isActive: boolean;
}

interface BlockedIPsListProps {
  ipBlocklist: IPBlocklistEntry[];
  onUnblock: (id: string) => void;
}

export function BlockedIPsList({ ipBlocklist, onUnblock }: BlockedIPsListProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle suppressHydrationWarning>
          {t('security_page.ip_control.blocked_ips')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('security_page.ip_control.blocked_ips_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {ipBlocklist.map((block) => (
              <div key={block.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="text-sm font-medium">{block.ipAddress}</p>
                  <p className="text-xs text-muted-foreground">{block.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={block.isActive ? "destructive" : "secondary"} suppressHydrationWarning>
                    {block.isActive ? t('security_page.ip_control.blocked') : t('security_page.ip_control.unblocked')}
                  </Badge>
                  {block.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUnblock(block.id)}
                      suppressHydrationWarning
                    >
                      {t('security_page.ip_control.unblock')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

