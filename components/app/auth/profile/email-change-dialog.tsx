"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

interface EmailChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmail: string
  onEmailChanged?: () => void
}

export function EmailChangeDialog({
  open,
  onOpenChange,
  currentEmail,
  onEmailChanged,
}: EmailChangeDialogProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isChanging, setIsChanging] = useState(false)

  const handleChange = async () => {
    if (!newEmail || !password) {
      toast.error(t('profile_page.email_change.fill_all_fields'))
      return
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error(t('profile_page.email_change.same_email'))
      return
    }

    setIsChanging(true)

    try {
      // Get CSRF token
      const tokenResponse = await fetch('/api/csrf-token')
      const { token } = await tokenResponse.json()

      const response = await fetch('/api/account/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({
          newEmail: newEmail.trim(),
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to change email')
      }

      toast.success(t('profile_page.email_change.success'))
      
      // Reset form
      setNewEmail("")
      setPassword("")
      onOpenChange(false)
      
      // Callback to refresh user data
      if (onEmailChanged) {
        onEmailChanged()
      }
    } catch (error: any) {
      console.error('Email change failed:', error)
      toast.error(error.message || t('profile_page.email_change.error'))
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2" suppressHydrationWarning>
            <Mail className="h-5 w-5" />
            {t('profile_page.email_change.title')}
          </AlertDialogTitle>
          <AlertDialogDescription suppressHydrationWarning>
            {t('profile_page.email_change.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-email" suppressHydrationWarning>
              {t('profile_page.email_change.current_email')}
            </Label>
            <Input
              id="current-email"
              type="email"
              value={currentEmail}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-email" suppressHydrationWarning>
              {t('profile_page.email_change.new_email')}
            </Label>
            <Input
              id="new-email"
              type="email"
              placeholder={t('profile_page.email_change.new_email_placeholder')}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={isChanging}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" suppressHydrationWarning>
              {t('profile_page.email_change.password')}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={t('profile_page.email_change.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isChanging}
            />
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('profile_page.email_change.password_hint')}
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('profile_page.email_change.verification_note')}
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isChanging} suppressHydrationWarning>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleChange}
            disabled={isChanging || !newEmail || !password}
            suppressHydrationWarning
          >
            {isChanging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('profile_page.email_change.changing')}
              </>
            ) : (
              t('profile_page.email_change.change')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

