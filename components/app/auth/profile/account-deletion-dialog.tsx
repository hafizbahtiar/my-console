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
import { Loader2, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface AccountDeletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccountDeleted?: () => void
}

export function AccountDeletionDialog({
  open,
  onOpenChange,
  onAccountDeleted,
}: AccountDeletionDialogProps) {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!password || confirmation !== 'DELETE') {
      if (!password) {
        toast.error(t('profile_page.account_deletion.password_required'))
      } else {
        toast.error(t('profile_page.account_deletion.confirmation_required'))
      }
      return
    }

    setIsDeleting(true)

    try {
      // Get CSRF token
      const tokenResponse = await fetch('/api/csrf-token')
      const { token } = await tokenResponse.json()

      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify({
          password: password,
          confirmation: confirmation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to delete account')
      }

      toast.success(t('profile_page.account_deletion.success'))
      
      // Logout and redirect
      setTimeout(() => {
        logout().then(() => {
          window.location.href = '/'
        })
      }, 1000)
      
    } catch (error: any) {
      console.error('Account deletion failed:', error)
      toast.error(error.message || t('profile_page.account_deletion.error'))
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive" suppressHydrationWarning>
            <AlertTriangle className="h-5 w-5" />
            {t('profile_page.account_deletion.title')}
          </AlertDialogTitle>
          <AlertDialogDescription suppressHydrationWarning>
            {t('profile_page.account_deletion.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-destructive" suppressHydrationWarning>
                  {t('profile_page.account_deletion.warning_title')}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside" suppressHydrationWarning>
                  <li>{t('profile_page.account_deletion.warning_1')}</li>
                  <li>{t('profile_page.account_deletion.warning_2')}</li>
                  <li>{t('profile_page.account_deletion.warning_3')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-password" suppressHydrationWarning>
              {t('profile_page.account_deletion.password')}
            </Label>
            <Input
              id="delete-password"
              type="password"
              placeholder={t('profile_page.account_deletion.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDeleting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delete-confirmation" suppressHydrationWarning>
              {t('profile_page.account_deletion.confirmation_label')}
            </Label>
            <Input
              id="delete-confirmation"
              type="text"
              placeholder="DELETE"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={isDeleting}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t('profile_page.account_deletion.confirmation_hint')}
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} suppressHydrationWarning>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || !password || confirmation !== 'DELETE'}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            suppressHydrationWarning
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('profile_page.account_deletion.deleting')}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('profile_page.account_deletion.delete')}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

