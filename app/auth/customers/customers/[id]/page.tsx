"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Customer } from "../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/custom/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  AlertCircle,
  Edit,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  DollarSign,
  FileText,
  StickyNote,
  MessageSquare,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import {
  tablesDB,
  DATABASE_ID,
  CUSTOMERS_COLLECTION_ID
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { CustomerNotes, CustomerInteractions } from "@/components/app/auth/customers";

export default function ViewCustomerPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, loading: translationLoading } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  // State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) {
        return;
      }

      if (!customerId) {
        setError(t('customers_page.view_page.customer_not_found'));
        setIsLoading(false);
        return;
      }

      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        await loadCustomer();
      } catch (error: any) {
        console.error('Failed to load customer:', error);
        
        // Check for authorization errors
        const isAuthError = error?.code === 401 || 
                           error?.code === 403 || 
                           error?.message?.includes('not authorized') ||
                           error?.message?.includes('authorized') ||
                           error?.type === 'AppwriteException';
        
        if (isAuthError) {
          setError(t('customers_page.view_page.permission_denied'));
        } else {
          setError(t('customers_page.view_page.failed_to_load'));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, customerId, router, t]);

  const loadCustomer = async () => {
    try {
      const customerData = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: CUSTOMERS_COLLECTION_ID,
        rowId: customerId,
      });

      const customer = customerData as unknown as Customer;
      
      // Verify user owns this customer record (self-service model)
      // Note: Admin check would need to be done via API or user profile
      if (customer.userId !== user?.$id) {
        // For now, only allow users to view their own customer record
        // Admin override can be added later via API route
        throw new Error('Permission denied');
      }

      setCustomer(customer);
    } catch (error: any) {
      console.error('Failed to load customer:', error);
      throw error;
    }
  };

  // Show skeleton while loading
  if (translationLoading || isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Breadcrumb Skeleton */}
        <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 sm:px-6 py-2 sm:py-3">
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        {/* Main Content Skeleton */}
        <div className="px-4 sm:px-6 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle className="text-destructive" suppressHydrationWarning>{t('error')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {error || t('customers_page.view_page.customer_not_found')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/customers/customers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span suppressHydrationWarning>{t('customers_page.view_page.back_to_customers')}</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="sticky top-16 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 py-2 sm:py-3">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground shrink-0"
              asChild
            >
              <Link href="/auth/customers/customers">
                <ArrowLeft className="h-3 w-3 mr-1 shrink-0" />
                <span className="truncate" suppressHydrationWarning>
                  {t('customers_page.title')}
                </span>
              </Link>
            </Button>
            <span className="text-muted-foreground shrink-0">/</span>
            <span className="text-foreground font-medium truncate">
              {customer.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="sticky top-28 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarFallback className="text-lg font-semibold">
                  {customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate" suppressHydrationWarning>
                  {customer.name}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base flex items-center gap-2 mt-1 flex-wrap" suppressHydrationWarning>
                  <StatusBadge status={customer.status} type="customer" />
                  {customer.company && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{customer.company}</span>
                      </Badge>
                    </>
                  )}
                  {customer.customerType && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge variant="secondary">
                        {t(`customers_page.customer_type.${customer.customerType}`)}
                      </Badge>
                    </>
                  )}
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => router.push(`/auth/customers/customers/${customer.$id}/edit`)} className="shrink-0">
                    <Edit className="h-4 w-4 mr-2" />
                    {t('edit')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p suppressHydrationWarning>{t('customers_page.view_page.edit_tooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" suppressHydrationWarning>
              {t('customers_page.view_page.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="details" suppressHydrationWarning>
              {t('customers_page.view_page.tabs.details')}
            </TabsTrigger>
            <TabsTrigger value="notes" suppressHydrationWarning>
              <StickyNote className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="interactions" suppressHydrationWarning>
              <MessageSquare className="h-4 w-4 mr-2" />
              Interactions
            </TabsTrigger>
            <TabsTrigger value="activity" suppressHydrationWarning>
              <Activity className="h-4 w-4 mr-2" />
              Activity Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle suppressHydrationWarning>{t('customers_page.view_dialog.contact_info')}</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customer.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('email')}</p>
                  <p className="text-sm font-medium truncate">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('phone')}</p>
                  <p className="text-sm font-medium">{customer.phone}</p>
                </div>
              </div>
            )}
            {customer.website && (
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.website')}</p>
                  <a
                    href={customer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline truncate block"
                  >
                    {customer.website}
                  </a>
                </div>
              </div>
            )}
            {customer.jobTitle && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.job_title')}</p>
                  <p className="text-sm font-medium">{customer.jobTitle}</p>
                </div>
              </div>
            )}
          </div>
              </CardContent>
            </Card>

            {/* Address */}
            {(customer.address || customer.city || customer.state || customer.country) && (
              <Card>
                <CardHeader>
                  <CardTitle suppressHydrationWarning>{t('customers_page.view_dialog.address')}</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {[customer.address, customer.city, customer.state, customer.zipCode, customer.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle suppressHydrationWarning>{t('customers_page.view_dialog.business_info')}</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2" suppressHydrationWarning>{t('customers_page.view_dialog.customer_type')}</p>
                    <Badge variant="secondary">{t(`customers_page.customer_type.${customer.customerType}`)}</Badge>
                  </div>
                  {customer.industry && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2" suppressHydrationWarning>{t('customers_page.view_dialog.industry')}</p>
                      <Badge variant="outline">{customer.industry}</Badge>
                    </div>
                  )}
                  {customer.source && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2" suppressHydrationWarning>{t('customers_page.view_dialog.source')}</p>
                      <Badge variant="outline">{t(`customers_page.source.${customer.source}`)}</Badge>
                    </div>
                  )}
                  {customer.currency && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2" suppressHydrationWarning>{t('customers_page.view_dialog.currency')}</p>
                      <Badge variant="outline">{customer.currency}</Badge>
                    </div>
                  )}
                  {customer.language && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2" suppressHydrationWarning>{t('customers_page.view_dialog.language')}</p>
                      <Badge variant="outline">{customer.language === 'en' ? 'English' : 'Malay'}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle suppressHydrationWarning>{t('customers_page.view_dialog.statistics')}</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.total_revenue')}</p>
                      <p className="text-lg font-bold">
                        {customer.currency || 'USD'} {customer.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.total_invoices')}</p>
                      <p className="text-lg font-bold">{customer.totalInvoices}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle suppressHydrationWarning>{t('customers_page.view_dialog.dates')}</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('created')}</p>
                      <p className="text-sm font-medium">
                        {format(new Date(customer.$createdAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                  {customer.lastContactAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.last_contact')}</p>
                        <p className="text-sm font-medium">
                          {format(new Date(customer.lastContactAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer.nextFollowUpAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.next_follow_up')}</p>
                        <p className="text-sm font-medium">
                          {format(new Date(customer.nextFollowUpAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer.$updatedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('updated')}</p>
                        <p className="text-sm font-medium">
                          {format(new Date(customer.$updatedAt), 'PPp')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle suppressHydrationWarning>{t('customers_page.view_page.tabs.details')}</CardTitle>
                <CardDescription suppressHydrationWarning>
                  {t('customers_page.view_page.tabs.details_description')}
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1" suppressHydrationWarning>{t('customers_page.view_dialog.customer_type')}</p>
                      <Badge variant="secondary">{t(`customers_page.customer_type.${customer.customerType}`)}</Badge>
                    </div>
                    {customer.industry && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1" suppressHydrationWarning>{t('customers_page.view_dialog.industry')}</p>
                        <p className="text-sm font-medium">{customer.industry}</p>
                      </div>
                    )}
                    {customer.source && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1" suppressHydrationWarning>{t('customers_page.view_dialog.source')}</p>
                        <Badge variant="outline">{t(`customers_page.source.${customer.source}`)}</Badge>
                      </div>
                    )}
                    {customer.currency && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1" suppressHydrationWarning>{t('customers_page.view_dialog.currency')}</p>
                        <p className="text-sm font-medium">{customer.currency}</p>
                      </div>
                    )}
                    {customer.language && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1" suppressHydrationWarning>{t('customers_page.view_dialog.language')}</p>
                        <p className="text-sm font-medium">{customer.language === 'en' ? 'English' : 'Malay'}</p>
                      </div>
                    )}
                    {customer.timezone && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1" suppressHydrationWarning>{t('customers_page.view_dialog.timezone')}</p>
                        <p className="text-sm font-medium">{customer.timezone}</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <CustomerNotes customerId={customer.$id} />
          </TabsContent>

          <TabsContent value="interactions" className="space-y-6">
            <CustomerInteractions customerId={customer.$id} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="space-y-4">
              <CustomerNotes customerId={customer.$id} />
              <CustomerInteractions customerId={customer.$id} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

