"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useTranslation } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { teams } from "@/lib/appwrite"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Home,
  User,
  Settings,
  Shield,
  Database,
  FileText,
  BarChart3,
  Key,
  Users,
  BookOpen,
  Tag,
} from "lucide-react"

const navigationItems = [
  {
    titleKey: "nav.dashboard",
    url: "/auth/dashboard",
    icon: Home,
  },
  {
    titleKey: "nav.profile",
    url: "/auth/profile",
    icon: User,
  },
  {
    titleKey: "nav.settings",
    url: "/auth/settings",
    icon: Settings,
  },
]


const adminItems = [
  {
    titleKey: "nav.audit",
    url: "/auth/audit",
    icon: Database,
  },
  {
    titleKey: "nav.sessions",
    url: "/auth/sessions",
    icon: Shield,
  },
  {
    titleKey: "nav.users",
    url: "/auth/admin/users",
    icon: Users,
  },
  {
    titleKey: "nav.security",
    url: "/auth/admin/security",
    icon: Shield,
  },
  {
    titleKey: "nav.database",
    url: "/auth/admin/database",
    icon: Database,
  },
  {
    titleKey: "nav.analytics",
    url: "/auth/admin/analytics",
    icon: BarChart3,
  },
]

const blogItems = [
  {
    titleKey: "nav.blog_categories",
    url: "/auth/blog/blog-categories",
    icon: BookOpen,
  },
  {
    titleKey: "nav.blog_tags",
    url: "/auth/blog/blog-tags",
    icon: Tag,
  },
  {
    titleKey: "nav.blog_posts",
    url: "/auth/blog/blog-posts",
    icon: FileText,
  },
]

const developerItems = [
  {
    titleKey: "nav.keys",
    url: "/auth/developer/keys",
    icon: Key,
  },
  {
    titleKey: "nav.docs",
    url: "/auth/developer/docs",
    icon: FileText,
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  // Check if user is a member of Super Admin team
  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      if (!user) return

      try {
        // Get user's teams - this returns teams the current user is a member of
        const userTeams = await teams.list({})
        const hasSuperAdminAccess = userTeams.teams?.some((team: any) => team.name === 'Super Admin')
        setIsSuperAdmin(hasSuperAdminAccess || false)
      } catch (error) {
        console.error('Failed to check Super Admin access:', error)
        setIsSuperAdmin(false)
      }
    }

    checkSuperAdminAccess()
  }, [user])

  // Filter admin items based on Super Admin access
  const filteredAdminItems = adminItems.filter(item => {
    // Database admin page requires Super Admin access
    if (item.url === "/auth/admin/database") {
      return isSuperAdmin
    }
    // Other admin items are available to all authenticated users
    return true
  })

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">My Console</span>
            <span className="truncate text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.main_navigation", "Main Navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.titleKey)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.administration")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredAdminItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.titleKey)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.blog_management")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {blogItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.titleKey)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.developer")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {developerItems.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={t(item.titleKey)}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
