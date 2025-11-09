"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/language-context";

interface BlockIPFormProps {
  newIPBlock: string;
  blockReason: string;
  onIPChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
}

export function BlockIPForm({
  newIPBlock,
  blockReason,
  onIPChange,
  onReasonChange,
  onSubmit,
}: BlockIPFormProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle suppressHydrationWarning>
          {t('security_page.ip_control.block_ip')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('security_page.ip_control.block_ip_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ipAddress" suppressHydrationWarning>
            {t('security_page.ip_control.ip_address')}
          </Label>
          <Input
            id="ipAddress"
            placeholder={t('security_page.ip_control.ip_placeholder')}
            value={newIPBlock}
            onChange={(e) => onIPChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason" suppressHydrationWarning>
            {t('security_page.ip_control.reason')}
          </Label>
          <Input
            id="reason"
            placeholder={t('security_page.ip_control.reason_placeholder')}
            value={blockReason}
            onChange={(e) => onReasonChange(e.target.value)}
          />
        </div>
        <Button onClick={onSubmit} className="w-full" suppressHydrationWarning>
          {t('security_page.ip_control.block_ip_button')}
        </Button>
      </CardContent>
    </Card>
  );
}

