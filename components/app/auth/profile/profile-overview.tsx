"use client"

import { Models } from "appwrite"
import { UserProfile } from "@/lib/user-profile"
import { useTranslation } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Shield, MapPin, Globe, Clock, Info, Lock } from "lucide-react"
import { getInitials, formatDate } from "./utils"

interface ProfileOverviewProps {
  user: Models.User<Models.Preferences>
  userProfile: UserProfile | null
}

export function ProfileOverview({ user, userProfile }: ProfileOverviewProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("profile.user_profile")}
        </CardTitle>
        <CardDescription>
          {t("profile.user_profile_desc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={userProfile?.avatar} />
            <AvatarFallback className="text-lg">
              {getInitials(user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{user.name || 'User'}</h3>
              {userProfile?.role && (
                <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                  {userProfile.role}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2">
              <Badge variant={userProfile?.status === 'active' ? 'default' : 'secondary'}>
                {userProfile?.status || 'active'}
              </Badge>
              {userProfile?.twoFactorEnabled && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  2FA
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t("profile.email_address")}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {userProfile?.bio && (
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t("profile.bio")}</p>
                <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
              </div>
            </div>
          )}

          {userProfile?.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("profile.location")}</p>
                <p className="text-sm text-muted-foreground">{userProfile.location}</p>
              </div>
            </div>
          )}

          {userProfile?.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("profile.website")}</p>
                <a 
                  href={userProfile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {userProfile.website}
                </a>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t("profile.member_since")}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(user.$createdAt)}
              </p>
            </div>
          </div>

          {userProfile?.lastLoginAt && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("profile.last_login")}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(userProfile.lastLoginAt)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t("profile.email_verified")}</p>
              <Badge variant={user.emailVerification ? "default" : "secondary"}>
                {user.emailVerification ? t("profile.verified") : t("profile.unverified")}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

