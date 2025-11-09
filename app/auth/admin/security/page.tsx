"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/language-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { tablesDB, DATABASE_ID, SECURITY_EVENTS_COLLECTION_ID, IP_BLOCKLIST_COLLECTION_ID } from "@/lib/appwrite"
import {
  SecurityHeader,
  SecurityOverviewCards,
  RecentAlertsCard,
  SecurityStatusCard,
  BlockIPForm,
  BlockedIPsList,
  SecurityEventsList
} from "@/components/app/auth/admin/security"

interface SecurityEvent {
    id: string
    type: 'failed_login' | 'suspicious_activity' | 'policy_violation' | 'session_anomaly'
    userId?: string
    ipAddress: string
    userAgent: string
    timestamp: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
}


interface IPBlocklistEntry {
    id: string
    ipAddress: string
    reason: string
    blockedAt: string
    blockedBy: string
    isActive: boolean
}

export default function SecurityPage() {
    const { t, loading: translationLoading } = useTranslation()
    // State for different security sections
    const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
    const [ipBlocklist, setIpBlocklist] = useState<IPBlocklistEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [newIPBlock, setNewIPBlock] = useState('')
    const [blockReason, setBlockReason] = useState('')
    const [activeTab, setActiveTab] = useState('overview')

    // Load security data from Appwrite
    const loadSecurityData = async () => {
        try {
            setRefreshing(true)


            // Load security events (try to fetch from security_events table, fallback to audit logs)
            try {
                const eventsResponse = await tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: SECURITY_EVENTS_COLLECTION_ID,
                    queries: [
                        // Get recent events (last 24 hours)
                        `createdAtGreaterThan=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`
                    ]
                })
                const events = eventsResponse.rows.map((row: any) => ({
                    id: row.$id,
                    type: row.type || 'unknown',
                    userId: row.userId,
                    ipAddress: row.ipAddress,
                    userAgent: row.userAgent,
                    timestamp: row.$createdAt,
                    severity: row.severity || 'low',
                    description: row.description || 'Security event'
                }))
                setSecurityEvents(events)
            } catch (error) {
                console.warn('Security events table not found, using audit logs for security events')
                // Fallback: get security-related events from audit logs
                setSecurityEvents([])
            }

            // Load IP blocklist
            try {
                const blocklistResponse = await tablesDB.listRows({
                    databaseId: DATABASE_ID,
                    tableId: IP_BLOCKLIST_COLLECTION_ID
                })
                const blocklist = blocklistResponse.rows.map((row: any) => ({
                    id: row.$id,
                    ipAddress: row.ipAddress,
                    reason: row.reason,
                    blockedAt: row.$createdAt,
                    blockedBy: row.blockedBy || 'system',
                    isActive: row.isActive !== false
                }))
                setIpBlocklist(blocklist)
            } catch (error) {
                console.warn('IP blocklist table not found')
                setIpBlocklist([])
            }


        } catch (error) {
            console.error('Failed to load security data:', error)
            toast.error(t('security_page.toast.load_failed'))
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadSecurityData()
    }, [t])


    const handleBlockIP = async () => {
        if (!newIPBlock.trim()) {
            toast.error(t('security_page.toast.ip_required'))
            return
        }
        if (!blockReason.trim()) {
            toast.error(t('security_page.toast.reason_required'))
            return
        }

        try {
            // Save to Appwrite database
            const blockData = {
                ipAddress: newIPBlock,
                reason: blockReason,
                blockedBy: 'admin', // You might want to get current user
                isActive: true
            }

            try {
                await tablesDB.createRow({
                    databaseId: DATABASE_ID,
                    tableId: IP_BLOCKLIST_COLLECTION_ID,
                    rowId: `block_${Date.now()}`, // Generate a unique row ID
                    data: blockData
                })

                // Reload data to get the new entry
                await loadSecurityData()
                setNewIPBlock('')
                setBlockReason('')
                toast.success(t('security_page.toast.blocked_success'))
            } catch (error) {
                console.warn('IP blocklist table not found, blocking not saved')
                toast.error(t('security_page.toast.error'))
            }
        } catch (error) {
            console.error('Failed to block IP:', error)
            toast.error(t('security_page.toast.error'))
        }
    }

    const handleUnblockIP = async (id: string) => {
        try {
            // Update in Appwrite database
            try {
                await tablesDB.updateRow({
                    databaseId: DATABASE_ID,
                    tableId: IP_BLOCKLIST_COLLECTION_ID,
                    rowId: id,
                    data: { isActive: false }
                })

                // Reload data to reflect changes
                await loadSecurityData()
                toast.success(t('security_page.toast.unblocked_success'))
            } catch (error) {
                console.warn('IP blocklist table not found, unblocking not saved')
                toast.error(t('security_page.toast.error'))
            }
        } catch (error) {
            console.error('Failed to unblock IP:', error)
            toast.error(t('security_page.toast.error'))
        }
    }

    // Show skeleton while translations or data is loading
    if (translationLoading || loading) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-5 w-80" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                </div>

                {/* Cards Skeleton */}
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-4 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>

                {/* Tabs Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="border rounded-lg p-6 space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                        <div className="border rounded-lg p-6 space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            {/* Header */}
            <SecurityHeader onRefresh={loadSecurityData} refreshing={refreshing} />

            {/* Security Overview Cards */}
            <SecurityOverviewCards ipBlocklist={ipBlocklist} securityEvents={securityEvents} />

            {/* Main Security Dashboard */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" suppressHydrationWarning>
                        {t('security_page.tabs.overview')}
                    </TabsTrigger>
                    <TabsTrigger value="ip-control" suppressHydrationWarning>
                        {t('security_page.tabs.ip_control')}
                    </TabsTrigger>
                    <TabsTrigger value="events" suppressHydrationWarning>
                        {t('security_page.tabs.events')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <RecentAlertsCard securityEvents={securityEvents} />
                        <SecurityStatusCard />
                    </div>
                </TabsContent>

                <TabsContent value="ip-control" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <BlockIPForm
                            newIPBlock={newIPBlock}
                            blockReason={blockReason}
                            onIPChange={setNewIPBlock}
                            onReasonChange={setBlockReason}
                            onSubmit={handleBlockIP}
                        />
                        <BlockedIPsList
                            ipBlocklist={ipBlocklist}
                            onUnblock={handleUnblockIP}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="events" className="space-y-4">
                    <SecurityEventsList securityEvents={securityEvents} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
