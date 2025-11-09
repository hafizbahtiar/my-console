"use client"

import { useState } from "react"
import { Models } from "appwrite"
import { UserProfile } from "@/lib/user-profile"
import { useTranslation } from "@/lib/language-context"
import { account } from "@/lib/appwrite"
import { auditLogger } from "@/lib/audit-log"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Shield, MapPin, Globe, Clock, Info, Lock, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getInitials, formatDate } from "./utils"

interface ProfileOverviewProps {
  user: Models.User<Models.Preferences>
  userProfile: UserProfile | null
}

export function ProfileOverview({ user, userProfile }: ProfileOverviewProps) {
  const { t } = useTranslation()
  const [sendingVerification, setSendingVerification] = useState(false)

  const handleResendVerification = async () => {
    try {
      setSendingVerification(true)
      // Get the current URL origin for the redirect URL
      const redirectUrl = `${window.location.origin}/auth/profile`
      
      await account.createVerification(redirectUrl)
      
      // Log critical security event - verification email sent
      if (user?.$id) {
        const userAgent = typeof window !== 'undefined' ? navigator.userAgent : 'unknown'
        auditLogger.logSecurityEvent(
          user.$id,
          'VERIFICATION_EMAIL_SENT',
          {
            email: user.email,
            userAgent
          }
        ).catch(() => {
          // Silently fail audit logging
        })
      }
      
      toast.success(t('profile_page.overview.verification_sent'))
    } catch (error: any) {
      console.error('Failed to send verification email:', error)
      
      // Handle SMTP disabled error specifically
      // Check for the specific Appwrite error type: 'general_smtp_disabled'
      const isSmtpDisabled = error.type === 'general_smtp_disabled'
      
      if (isSmtpDisabled) {
        toast.error(t('profile_page.overview.smtp_disabled'), {
          description: t('profile_page.overview.smtp_disabled_description'),
          duration: 8000,
        })
      } else {
        // Show the actual error message for other issues (SMTP config errors, network issues, etc.)
        const errorMessage = error.message || t('profile_page.overview.verification_send_failed')
        toast.error(errorMessage, {
          description: error.message ? undefined : t('profile_page.overview.verification_send_failed'),
          duration: 5000,
        })
      }
    } finally {
      setSendingVerification(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" suppressHydrationWarning>
          <User className="h-5 w-5" />
          {t('profile_page.overview.title')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('profile_page.overview.description')}
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
              <h3 className="text-xl font-semibold" suppressHydrationWarning>
                {user.name || t('profile_page.overview.user')}
              </h3>
              {userProfile?.role && (
                <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                  {userProfile.role}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2">
              <Badge variant={userProfile?.status === 'active' ? 'default' : 'secondary'}>
                {userProfile?.status || t('active')}
              </Badge>
              {userProfile?.twoFactorEnabled && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  {t('profile_page.overview.two_factor')}
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
              <p className="text-sm font-medium" suppressHydrationWarning>
                {t('profile_page.overview.email_address')}
              </p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {userProfile?.bio && (
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium" suppressHydrationWarning>
                  {t('profile_page.overview.bio')}
                </p>
                <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
              </div>
            </div>
          )}

          {userProfile?.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium" suppressHydrationWarning>
                  {t('profile_page.overview.location')}
                </p>
                <p className="text-sm text-muted-foreground">{userProfile.location}</p>
              </div>
            </div>
          )}

          {userProfile?.website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium" suppressHydrationWarning>
                  {t('profile_page.overview.website')}
                </p>
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
              <p className="text-sm font-medium" suppressHydrationWarning>
                {t('profile_page.overview.member_since')}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(user.$createdAt)}
              </p>
            </div>
          </div>

          {userProfile?.lastLoginAt && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium" suppressHydrationWarning>
                  {t('profile_page.overview.last_login')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(userProfile.lastLoginAt)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" suppressHydrationWarning>
                    {t('profile_page.overview.email_verified')}
                  </p>
                  <Badge variant={user.emailVerification ? "default" : "secondary"} suppressHydrationWarning>
                    {user.emailVerification ? t('profile_page.overview.verified') : t('profile_page.overview.unverified')}
                  </Badge>
                </div>
                {!user.emailVerification && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={sendingVerification}
                    suppressHydrationWarning
                  >
                    {sendingVerification ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span suppressHydrationWarning>{t('profile_page.overview.sending')}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        <span suppressHydrationWarning>{t('profile_page.overview.resend_verification')}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

