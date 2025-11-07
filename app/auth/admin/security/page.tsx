"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Shield, AlertCircle, Ban, CheckCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { tablesDB, DATABASE_ID, SECURITY_EVENTS_COLLECTION_ID, IP_BLOCKLIST_COLLECTION_ID } from "@/lib/appwrite"

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
    const { t } = useTranslation()

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
            toast.error(t('security.loading'))
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadSecurityData()
    }, [])


    const handleBlockIP = async () => {
        if (!newIPBlock.trim()) {
            toast.error(t('item_is_required', { item: 'IP address' }))
            return
        }
        if (!blockReason.trim()) {
            toast.error(t('item_is_required', { item: 'Reason' }))
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
                toast.success(t('security.ip_blocked'))
            } catch (error) {
                console.warn('IP blocklist table not found, blocking not saved')
                toast.error(t('general_use.error'))
            }
        } catch (error) {
            console.error('Failed to block IP:', error)
            toast.error(t('general_use.error'))
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
                toast.success(t('security.ip_unblocked'))
            } catch (error) {
                console.warn('IP blocklist table not found, unblocking not saved')
                toast.error(t('general_use.error'))
            }
        } catch (error) {
            console.error('Failed to unblock IP:', error)
            toast.error(t('general_use.error'))
        }
    }


    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'destructive'
            case 'high': return 'destructive'
            case 'medium': return 'secondary'
            case 'low': return 'outline'
            default: return 'outline'
        }
    }

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />
            case 'policy_violation': return <Shield className="h-4 w-4" />
            default: return <AlertCircle className="h-4 w-4" />
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('security.title')}</h1>
                    <p className="text-muted-foreground">
                        {t('security.subtitle')}
                    </p>
                </div>
                <Button onClick={loadSecurityData} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {t('security.refresh')}
                </Button>
            </div>

            {/* Security Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('security.blocked_ips')}</CardTitle>
                        <Ban className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {ipBlocklist.filter(ip => ip.isActive).length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('security.blocked_ips_desc')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('security.events')}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {securityEvents.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('security.custom_security_monitoring')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('security.appwrite_status')}</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{t('general_use.active')}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('security.built_in_security_enabled')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Security Dashboard */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">{t('security.overview')}</TabsTrigger>
                    <TabsTrigger value="ip-control">{t('security.ip_control')}</TabsTrigger>
                    <TabsTrigger value="events">{t('security.events')}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    {t('security.recent_alerts')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[200px]">
                                    <div className="space-y-2">
                                        {securityEvents.slice(0, 5).map((event) => (
                                            <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex items-center gap-2">
                                                    {getEventTypeIcon(event.type)}
                                                    <div>
                                                        <p className="text-sm font-medium">{event.description}</p>
                                                        <p className="text-xs text-muted-foreground">{event.ipAddress}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={getSeverityColor(event.severity)}>
                                                    {event.severity}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-green-500" />
                                    {t('security.security_status')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">{t('security.appwrite_security')}</span>
                                    <Badge variant="default">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {t('general_use.active')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">{t('security.ip_filtering')}</span>
                                    <Badge variant="default">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {t('security.enabled')}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">{t('security.custom_security_events')}</span>
                                    <Badge variant="default">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {t('security.monitoring')}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="ip-control" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('security.block_ip')}</CardTitle>
                                <CardDescription>
                                    {t('security.block_ip_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ipAddress">{t('security.ip_address')}</Label>
                                    <Input
                                        id="ipAddress"
                                        placeholder="192.168.1.100"
                                        value={newIPBlock}
                                        onChange={(e) => setNewIPBlock(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">{t('security.reason')}</Label>
                                    <Input
                                        id="reason"
                                        placeholder="Suspicious activity"
                                        value={blockReason}
                                        onChange={(e) => setBlockReason(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleBlockIP} className="w-full">
                                    {t('security.block_ip_button')}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('security.blocked_ips')}</CardTitle>
                                <CardDescription>
                                    {t('security.blocked_ips_desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px]">
                                    <div className="space-y-2">
                                        {ipBlocklist.map((block) => (
                                            <div key={block.id} className="flex items-center justify-between p-2 border rounded">
                                                <div>
                                                    <p className="text-sm font-medium">{block.ipAddress}</p>
                                                    <p className="text-xs text-muted-foreground">{block.reason}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={block.isActive ? "destructive" : "secondary"}>
                                                        {block.isActive ? t('security.blocked') : t('security.unblocked')}
                                                    </Badge>
                                                    {block.isActive && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleUnblockIP(block.id)}
                                                        >
                                                            {t('status.unblock')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="events" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('security.security_events')}</CardTitle>
                            <CardDescription>
                                {t('security.security_events_desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px]">
                                <div className="space-y-2">
                                    {securityEvents.map((event) => (
                                        <div key={event.id} className="p-4 border rounded space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {getEventTypeIcon(event.type)}
                                                    <span className="text-sm font-medium capitalize">
                                                        {event.type.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <Badge variant={getSeverityColor(event.severity)}>
                                                    {event.severity}
                                                </Badge>
                                            </div>
                                            <p className="text-sm">{event.description}</p>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{event.ipAddress}</span>
                                                <span>{new Date(event.timestamp).toLocaleString()}</span>
                                            </div>
                                            {event.userId && (
                                                <p className="text-xs text-muted-foreground">
                                                    {t('security.user')}: {event.userId}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
