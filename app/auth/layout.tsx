"use client"

import { useEffect, useState, useRef } from "react"
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

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, logout, loading } = useAuth()
    const { t } = useTranslation()
    const { theme, setTheme } = useTheme()
    const pathname = usePathname()
    const router = useRouter()
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
    const isRedirectingRef = useRef(false)

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user && !isRedirectingRef.current) {
            isRedirectingRef.current = true
            // Use window.location for a full page reload to avoid hook issues
            // This prevents "rendered more hooks" errors during logout
            window.location.href = '/'
        }
    }, [loading, user])

    // Don't render anything while redirecting or if not authenticated
    if (!loading && !user) {
        return null
    }

    // // Loading state
    // if (loading) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center">
    //             <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    //             <p className="mt-4 text-muted-foreground">{t('loading')}</p>
    //         </div>
    //     )
    // }

    const handleLogout = async () => {
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
            toast.success(t('logout_success'))

            // Use window.location for a full page reload to avoid hook issues during logout
            // This ensures clean state and prevents "rendered more hooks" errors
            window.location.href = '/'
        } catch (error) {
            toast.error(t('logout_failed'))
        } finally {
            setLogoutDialogOpen(false)
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
                            <span className="sr-only" suppressHydrationWarning>{t('toggle_theme')}</span>
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => setLogoutDialogOpen(true)}>
                            <LogOut className="h-4 w-4 mr-2" />
                            <span suppressHydrationWarning>{t('logout')}</span>
                        </Button>
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-6">
                    {children}
                </main>
            </SidebarInset>
            <div className="data-[sidebar-state=open]:block data-[sidebar-state=closed]:hidden ml-1"></div>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle suppressHydrationWarning>{t('confirm_logout')}</AlertDialogTitle>
                        <AlertDialogDescription suppressHydrationWarning>
                            {t('logout_confirmation_message')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel suppressHydrationWarning>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleLogout} 
                            className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/20 dark:focus-visible:ring-red-600/40 dark:bg-red-600/90 dark:hover:bg-red-700/90 transition-colors"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            <span suppressHydrationWarning>{t('logout')}</span>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SidebarProvider>
    )
}
