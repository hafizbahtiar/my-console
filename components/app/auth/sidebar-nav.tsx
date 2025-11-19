"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/language-context"
import { teams } from "@/lib/appwrite"
import { useState, useEffect, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
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
  BookOpen,
  Tag,
  MessageSquare,
  Users,
  FolderTree,
  ClipboardList,
  Clock,
  Network,
  UserCircle,
  Heart,
  Link as LinkIcon,
  Edit,
} from "lucide-react"

// Navigation items will be created inside component to use translations

export function SidebarNav() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { t, loading: translationLoading } = useTranslation()
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const isCheckingRef = useRef(false)

  // Navigation items with translations
  const navigationItems = [
    {
      title: t('sidebar.dashboard'),
      url: "/auth/dashboard",
      icon: Home,
    },
    {
      title: t('profile'),
      url: "/auth/profile",
      icon: User,
    },
    {
      title: t('settings'),
      url: "/auth/settings",
      icon: Settings,
    },
  ]

  const adminItems = [
    {
      title: t('sidebar.audit_logs'),
      url: "/auth/audit",
      icon: ClipboardList,
    },
    {
      title: t('sidebar.active_sessions'),
      url: "/auth/sessions",
      icon: Clock,
    },
    {
      title: t('sidebar.security'),
      url: "/auth/admin/security",
      icon: Shield,
    },
    {
      title: t('database'),
      url: "/auth/admin/database",
      icon: Database,
    },
    {
      title: t('sidebar.analytics'),
      url: "/auth/admin/analytics",
      icon: BarChart3,
    },
  ]

  const blogItems = [
    {
      title: t('sidebar.blog_categories'),
      url: "/auth/blog/blog-categories",
      icon: BookOpen,
      requiresSuperAdmin: false,
    },
    {
      title: t('sidebar.blog_tags'),
      url: "/auth/blog/blog-tags",
      icon: Tag,
      requiresSuperAdmin: true,
    },
    {
      title: t('sidebar.blog_posts'),
      url: "/auth/blog/blog-posts",
      icon: FileText,
      requiresSuperAdmin: false,
    },
  ]

  const communityItems = [
    {
      title: t('sidebar.community_posts'),
      url: "/auth/community/community-posts",
      icon: MessageSquare,
      requiresSuperAdmin: false,
    },
    {
      title: t('sidebar.community_topics'),
      url: "/auth/community/community-topics",
      icon: FolderTree,
      requiresSuperAdmin: true,
    },
  ]

  const customerItems = [
    {
      title: t('sidebar.customers'),
      url: "/auth/customers/customers",
      icon: Users,
      requiresSuperAdmin: false,
    },
  ]

  const familyTreeItems = [
    {
      title: t('sidebar.family_tree.persons'),
      url: "/auth/family-tree/persons",
      icon: UserCircle,
      requiresSuperAdmin: true,
    },
    {
      title: t('sidebar.family_tree.families'),
      url: "/auth/family-tree/families",
      icon: Heart,
      requiresSuperAdmin: true,
    },
    {
      title: t('sidebar.family_tree.relationships'),
      url: "/auth/family-tree/relationships",
      icon: LinkIcon,
      requiresSuperAdmin: true,
    },
    {
      title: t('sidebar.family_tree.tree'),
      url: "/auth/family-tree/tree",
      icon: Network,
      requiresSuperAdmin: true,
    },
    // Commented out: Edit Tree (hide until feature is ready)
    // {
    //   title: t('family_tree.tree.edit.title') || 'Edit Tree',
    //   url: "/auth/family-tree/tree/edit",
    //   icon: Edit,
    //   requiresSuperAdmin: true,
    // },
  ]


  const developerItems = [
    {
      title: t('sidebar.api_keys'),
      url: "/auth/developer/keys",
      icon: Key,
    },
    {
      title: t('sidebar.documentation'),
      url: "/auth/developer/docs",
      icon: FileText,
    },
  ]

  // Handler to close sidebar on mobile when navigation item is clicked
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  // Check if user is a member of Super Admin team
  useEffect(() => {
    const checkSuperAdminAccess = async () => {
      // Don't check if auth is still loading or user is not authenticated
      if (authLoading || !isAuthenticated || !user) {
        setIsSuperAdmin(false)
        return
      }

      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        return
      }

      isCheckingRef.current = true

      try {
        // Use Appwrite SDK directly on client-side
        // According to https://appwrite.io/docs/products/auth/teams
        // The SDK handles authentication via cookies automatically in the browser
        const userTeams = await teams.list({})

        console.log('userTeams', userTeams)

        const hasSuperAdminAccess = userTeams.teams?.some((team: any) => team.name === 'Super Admin')
        setIsSuperAdmin(hasSuperAdminAccess || false)
      } catch (error: any) {
        // Handle specific error cases
        const isScopeError = error.type === 'general_unauthorized_scope' ||
          error.message?.includes('missing scopes') ||
          error.message?.includes('teams.read')

        const isCorsError = error.message?.includes('Failed to fetch') ||
          error.message?.includes('CORS') ||
          error.message?.includes('ERR_FAILED') ||
          error.name === 'TypeError' && error.message?.includes('fetch')

        if (isScopeError) {
          console.warn('Missing teams.read scope. User may need to re-authenticate or permissions may have changed.')
          console.warn('Error details:', error)
          setIsSuperAdmin(false)
        } else if (isCorsError) {
          // CORS error - Could be nginx reverse proxy or Appwrite platform configuration
          if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
            const currentOrigin = window.location.origin
            console.warn(
              `⚠️ CORS Error: Requests blocked from ${currentOrigin}\n` +
              `📋 Possible causes:\n` +
              `   1. Nginx reverse proxy not forwarding CORS headers properly\n` +
              `   2. Appwrite platform not configured for localhost\n` +
              `\n` +
              `🔧 To fix:\n` +
              `   A. Check nginx config includes proper proxy headers\n` +
              `   B. In Appwrite Console > Project > Settings > Platforms:\n` +
              `      - Ensure platform identifier is: localhost\n` +
              `      - Or add: ${currentOrigin} to allowed origins\n` +
              `\n` +
              `   Note: This error is non-critical. The app will work, but Super Admin features may be hidden.`
            )
          }
          setIsSuperAdmin(false)
        } else if (error.code === 401 || error.message?.includes('Unauthorized')) {
          // User is not authenticated, don't set as super admin
          setIsSuperAdmin(false)
        } else {
          // Other errors - log and set to false
          console.error('Failed to check Super Admin access:', error)
          setIsSuperAdmin(false)
        }
      } finally {
        isCheckingRef.current = false
      }
    }

    checkSuperAdminAccess()
  }, [user, authLoading, isAuthenticated])

  // Filter admin items based on Super Admin access
  const filteredAdminItems = adminItems.filter(item => {
    // Database admin page requires Super Admin access
    if (item.url === "/auth/admin/database") {
      return isSuperAdmin
    }
    // Other admin items are available to all authenticated users
    return true
  })

  // Filter blog items based on Super Admin access
  const filteredBlogItems = blogItems.filter(item => {
    // Blog tags page requires Super Admin access
    if (item.requiresSuperAdmin) {
      return isSuperAdmin
    }
    // Other blog items are available to all authenticated users
    return true
  })

  // Filter community items based on Super Admin access
  const filteredCommunityItems = communityItems.filter(item => {
    // Community items that require Super Admin access
    if (item.requiresSuperAdmin) {
      return isSuperAdmin
    }
    // Other community items are available to all authenticated users
    return true
  })

  // Filter customer items based on Super Admin access
  const filteredCustomerItems = customerItems.filter(item => {
    // Customer items that require Super Admin access
    if (item.requiresSuperAdmin) {
      return isSuperAdmin
    }
    // Other customer items are available to all authenticated users
    return true
  })

  // Filter family tree items - all require Super Admin access
  const filteredFamilyTreeItems = familyTreeItems.filter(item => {
    // All family tree items require Super Admin access
    if (item.requiresSuperAdmin) {
      return isSuperAdmin
    }
    return true
  })


  // Show skeleton while translations are loading
  if (translationLoading) {
    return (
      <Sidebar variant="inset" className="border-r">
        <SidebarHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-primary/10 dark:bg-primary/20 shrink-0">
              <Image
                src="/favicon.svg"
                alt="My Console Logo"
                width={32}
                height={32}
                className="h-full w-full object-contain p-1"
                priority
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Main Navigation Skeleton */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-4 w-32" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[1, 2, 3].map((i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Administration Skeleton */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-4 w-28" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Blog Management Skeleton */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-4 w-36" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[1, 2, 3].map((i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Community Management Skeleton */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-4 w-40" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[1, 2].map((i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Family Tree Management Skeleton */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-4 w-32" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[1, 2, 3, 4].map((i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Developer Skeleton */}
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-4 w-24" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {[1, 2].map((i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-9 w-full rounded-md" />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar variant="inset" className="border-r">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-primary/10 dark:bg-primary/20 shrink-0">
            <Image
              src="/favicon.svg"
              alt="My Console Logo"
              width={32}
              height={32}
              className="h-full w-full object-contain p-1"
              priority
            />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
            <span className="truncate font-semibold" suppressHydrationWarning>{t('sidebar.app_name')}</span>
            <span className="truncate text-xs text-muted-foreground" suppressHydrationWarning>{t('sidebar.admin_panel')}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel suppressHydrationWarning>{t('sidebar.main_navigation')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span suppressHydrationWarning>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel suppressHydrationWarning>{t('sidebar.administration')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredAdminItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span suppressHydrationWarning>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel suppressHydrationWarning>{t('sidebar.blog_management')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredBlogItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span suppressHydrationWarning>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel suppressHydrationWarning>{t('sidebar.community_management')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredCommunityItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname?.startsWith(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span suppressHydrationWarning>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredCustomerItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel suppressHydrationWarning>{t('sidebar.customer_management')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCustomerItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname?.startsWith(item.url + '/')}
                      tooltip={item.title}
                    >
                      <Link href={item.url} onClick={handleNavClick}>
                        <item.icon className="h-4 w-4" />
                        <span suppressHydrationWarning>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {filteredFamilyTreeItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel suppressHydrationWarning>{t('sidebar.family_tree.title')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredFamilyTreeItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname?.startsWith(item.url + '/')}
                      tooltip={item.title}
                    >
                      <Link href={item.url} onClick={handleNavClick}>
                        <item.icon className="h-4 w-4" />
                        <span suppressHydrationWarning>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel suppressHydrationWarning>{t('sidebar.developer')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {developerItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span suppressHydrationWarning>{item.title}</span>
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
