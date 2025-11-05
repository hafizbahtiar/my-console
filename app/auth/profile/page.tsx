"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { account, teams } from "@/lib/appwrite"
import { auditLogger } from "@/lib/audit-log"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Calendar, Shield, Edit, Loader2, Users } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const { t } = useTranslation()
  const [isUpdating, setIsUpdating] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [userTeams, setUserTeams] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  // Initialize form data and fetch sessions when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      })
      fetchUserSessions()
      fetchUserTeams()
    }
  }, [user])

  const fetchUserSessions = async () => {
    try {
      const sessionsData = await account.listSessions()
      setSessions(sessionsData.sessions || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      // Keep empty array on error
    }
  }

  const fetchUserTeams = async () => {
    try {
      const teamsData = await teams.list({})
      setUserTeams(teamsData.teams || [])
    } catch (error) {
      console.error('Failed to fetch user teams:', error)
      // Keep empty array on error
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    setIsUpdating(true)

    try {
      // Get current user data for audit logging
      const currentUser = user
      const oldName = currentUser?.name || ''

      // Update user name in Appwrite (using object parameter style)
      await account.updateName({ name: formData.name })

      // Log the profile update
      try {
        await auditLogger.logProfileUpdate(
          user.$id,
          { name: oldName },
          { name: formData.name }
        )
      } catch (auditError) {
        console.warn('Failed to log profile update audit event:', auditError)
      }

      // Update local user state by triggering a re-fetch
      // This is a simple approach - you might want to implement a more sophisticated state management
      window.location.reload()

      toast.success(t("profile.update_profile"))
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.message || t('general_use.error'))
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("profile.title")}</h1>
        <p className="text-muted-foreground">
          {t("profile.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Overview */}
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
                <AvatarImage src="" />
                <AvatarFallback className="text-lg">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{user.name || 'User'}</h3>
                <p className="text-muted-foreground">{user.email}</p>
                <Badge variant="secondary">{t("profile.active")}</Badge>
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

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("profile.member_since")}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user.$createdAt)}
                  </p>
                </div>
              </div>

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

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              {t("profile.account_settings")}
            </CardTitle>
            <CardDescription>
              {t("profile.account_settings_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("profile.display_name")}</Label>
                <Input
                  id="name"
                  placeholder={t("profile.name_placeholder")}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isUpdating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("profile.email_address")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("profile.email_placeholder")}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={true} // Email cannot be changed
                />
                <p className="text-xs text-muted-foreground">
                  {t("profile.email_change_note")}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("profile.updating")}
                  </>
                ) : (
                  t("profile.update_profile")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("profile.account_statistics")}</CardTitle>
            <CardDescription>
              {t("profile.account_statistics_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{sessions.length}</div>
                <div className="text-sm text-muted-foreground">{t("profile.sessions")}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{userTeams.length}</div>
                <div className="text-sm text-muted-foreground">{t("database.teams")}</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">{t("profile.api_calls")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teams */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("database.teams")}
            </CardTitle>
            <CardDescription>
              Teams you belong to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userTeams.length > 0 ? (
              userTeams.map((team: any) => (
                <div key={team.$id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.total} member{team.total !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Created</p>
                    <p>{formatDate(team.$createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-6">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No teams found</p>
                <p className="text-sm">You are not a member of any teams</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
