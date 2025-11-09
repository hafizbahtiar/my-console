"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { Models } from "appwrite";

interface UserProfileCardProps {
  user: Models.User<Models.Preferences>;
  userProfile: any;
}

export function UserProfileCard({ user, userProfile }: UserProfileCardProps) {
  const { t } = useTranslation();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const completionPercentage = userProfile ? (
    Math.round(
      ((user.name ? 1 : 0) +
        (userProfile.bio ? 1 : 0) +
        (userProfile.location ? 1 : 0) +
        (userProfile.website ? 1 : 0) +
        (user.emailVerification ? 1 : 0)) / 5 * 100
    )
  ) : 20;

  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg" suppressHydrationWarning>
          <User className="h-4 w-4 sm:h-5 sm:w-5" />
          {t('dashboard_page.user_profile.title')}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm" suppressHydrationWarning>
          {t('dashboard_page.user_profile.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
            <AvatarImage src={userProfile?.avatar} />
            <AvatarFallback className="text-base sm:text-lg">
              {getInitials(user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold truncate">{user.name || t('dashboard_page.user_profile.user')}</h3>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="text-xs" suppressHydrationWarning>
                {t('active')}
              </Badge>
              <Badge variant={user.emailVerification ? "default" : "secondary"} className="text-xs" suppressHydrationWarning>
                {user.emailVerification ? t('verified') : t('unverified')}
              </Badge>
              {userProfile?.role && (
                <Badge variant="outline" className="text-xs">{userProfile.role}</Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground" suppressHydrationWarning>
              {t('dashboard_page.user_profile.account_completion')}
            </span>
            <span className="font-medium">
              {completionPercentage}%
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('dashboard_page.user_profile.completion_message')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

