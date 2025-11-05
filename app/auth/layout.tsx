"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { auditLogger } from "@/lib/audit-log"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarNav } from "@/components/app/auth/sidebar-nav"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
  const { user, logout, loading } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [loading, user, router])

  // Don't render anything while redirecting
  if (!loading && !user) {
    return null
  }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">{t('general_use.loading')}</p>
            </div>
        )
    }

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()

    try {
      // Log logout event before actually logging out
      if (user) {
        try {
          await auditLogger.logUserLogout(user.$id)
        } catch (auditError) {
          console.warn('Failed to log logout audit event:', auditError)
        }
      }

      await logout()
      toast.success(t('auth.logout_success'))

      // Use setTimeout to avoid router update during render
      setTimeout(() => {
        router.push('/')
      }, 0)
    } catch (error) {
      toast.error(t('auth.logout'))
    }
  }

    // Generate breadcrumbs from pathname
    const generateBreadcrumbs = () => {
        const segments = pathname.split('/').filter(Boolean)
        const breadcrumbs = []

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i]
            const href = '/' + segments.slice(0, i + 1).join('/')
            const isLast = i === segments.length - 1

            breadcrumbs.push({
                label: segment.charAt(0).toUpperCase() + segment.slice(1),
                href,
                isLast,
            })
        }

        return breadcrumbs
    }

    const breadcrumbs = generateBreadcrumbs()

    return (
        <SidebarProvider>
            <SidebarNav />
            <div className="data-[sidebar-state=open]:block data-[sidebar-state=closed]:hidden ml-1"></div>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background z-20 rounded-t-lg rounded-b-lg">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />

                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((crumb, index) => (
                                <div key={crumb.href} className="flex items-center">
                                    {index > 0 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        {crumb.isLast ? (
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </div>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            {t('auth.logout')}
                        </Button>
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-6 p-6">
                    {children}
                </main>
            </SidebarInset>
            <div className="data-[sidebar-state=open]:block data-[sidebar-state=closed]:hidden ml-1"></div>
        </SidebarProvider>
    )
}
