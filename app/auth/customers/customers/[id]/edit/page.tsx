"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Customer, CustomerFormData } from "../../types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencySelect } from "@/components/ui/currency-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { tablesDB, DATABASE_ID, CUSTOMERS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { auditLogger } from "@/lib/audit-log";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/language-context";
import { getCSRFHeadersAlt } from "@/lib/csrf-utils";
import { CustomerTagsInput } from "@/components/app/auth/customers/customer-tags-input";
import { getCustomerTags, setCustomerTags } from "@/lib/customer-utils";

export default function EditCustomerPage() {
  const { user, loading: authLoading } = useAuth();
  const { t, loading: translationLoading } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  // State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<CustomerFormData | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    status: 'active',
    assignedTo: '',
    source: 'website',
    industry: '',
    customerType: 'individual',
    currency: 'USD',
    language: 'en',
    timezone: '',
    notes: '',
    metadata: '',
  });

  // Tags state (derived from metadata)
  const [tags, setTags] = useState<string[]>([]);

  // Load customer data
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) {
        return;
      }

      if (!customerId) {
        setError(t('customers_page.edit_page.customer_not_found'));
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
        
        const isAuthError = error?.code === 401 || 
                           error?.code === 403 || 
                           error?.message?.includes('not authorized') ||
                           error?.message?.includes('authorized') ||
                           error?.type === 'AppwriteException';
        
        if (isAuthError) {
          setError(t('customers_page.edit_page.permission_denied'));
        } else {
          setError(t('error'));
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

      const loadedCustomer = customerData as unknown as Customer;
      
      // Verify user owns this customer record (self-service model)
      // Note: Admin check would need to be done via API or user profile
      if (loadedCustomer.userId !== user?.$id) {
        // For now, only allow users to edit their own customer record
        // Admin override can be added later via API route
        throw new Error('Permission denied');
      }

      setCustomer(loadedCustomer);

      // Initialize form data
      const initialData: CustomerFormData = {
        name: loadedCustomer.name || '',
        email: loadedCustomer.email || '',
        phone: loadedCustomer.phone || '',
        company: loadedCustomer.company || '',
        jobTitle: loadedCustomer.jobTitle || '',
        address: loadedCustomer.address || '',
        city: loadedCustomer.city || '',
        state: loadedCustomer.state || '',
        zipCode: loadedCustomer.zipCode || '',
        country: loadedCustomer.country || '',
        website: loadedCustomer.website || '',
        status: loadedCustomer.status || 'active',
        assignedTo: loadedCustomer.assignedTo || '',
        source: loadedCustomer.source || 'website',
        industry: loadedCustomer.industry || '',
        customerType: loadedCustomer.customerType || 'individual',
        currency: loadedCustomer.currency || 'USD',
        language: (loadedCustomer.language as 'en' | 'ms') || 'en',
        timezone: loadedCustomer.timezone || '',
        notes: loadedCustomer.notes || '',
        metadata: loadedCustomer.metadata || '',
      };

      setFormData(initialData);
      setInitialFormData(initialData);
      
      // Initialize tags from metadata
      const customerTags = getCustomerTags(loadedCustomer.metadata);
      setTags(customerTags);
    } catch (error: any) {
      console.error('Failed to load customer:', error);
      throw error;
    }
  };

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!initialFormData || isFormSubmitted) return false;
    
    return JSON.stringify(formData) !== JSON.stringify(initialFormData);
  }, [formData, initialFormData, isFormSubmitted]);

  // Handle navigation with unsaved changes check
  const handleNavigation = useCallback((path: string) => {
    if (hasUnsavedChanges()) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      router.push(path);
    }
  }, [hasUnsavedChanges, router]);

  // Handle browser back/forward
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = () => {
      if (hasUnsavedChanges()) {
        setPendingNavigation('/auth/customers/customers');
        setShowUnsavedDialog(true);
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !customer) {
      toast.error(t('error'));
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error(t('customers_page.create_page.validation.name_required'));
      return;
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('customers_page.create_page.validation.invalid_email'));
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = await getCSRFHeadersAlt();

      // Check for duplicate email (excluding current customer)
      if (formData.email && formData.email !== customer.email) {
        const emailCheck = await tablesDB.listRows({
          databaseId: DATABASE_ID,
          tableId: CUSTOMERS_COLLECTION_ID,
          queries: [
            Query.equal('email', formData.email),
            Query.limit(1),
          ],
        });

        if (emailCheck.rows.length > 0) {
          toast.error(t('customers_page.create_page.validation.email_exists'));
          setIsSubmitting(false);
          return;
        }
      }

      // Include tags in metadata
      const metadataWithTags = setCustomerTags(formData.metadata, tags);

      // Update customer record
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          ...formData,
          metadata: metadataWithTags,
          updatedBy: user.$id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('error'));
      }

      const updatedCustomer = await response.json();

      // Log customer update
      await auditLogger.logSecurityEvent(user.$id, 'CUSTOMER_UPDATED', {
        customerId: updatedCustomer.$id,
        customerName: updatedCustomer.name,
      }).catch(() => {});

      setIsFormSubmitted(true);
      toast.success(t('customers_page.edit_page.updated_success'));
      
      // Redirect to customer view
      setTimeout(() => {
        router.push(`/auth/customers/${customerId}`);
      }, 1000);
    } catch (error: any) {
      console.error('Failed to update customer:', error);
      toast.error(error.message || t('error'));
    } finally {
      setIsSubmitting(false);
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
              {error || t('customers_page.edit_page.customer_not_found')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/auth/customers/customers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span suppressHydrationWarning>{t('customers_page.edit_page.back_to_customers')}</span>
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
              onClick={() => handleNavigation('/auth/customers/customers')}
            >
              <ArrowLeft className="h-3 w-3 mr-1 shrink-0" />
              <span className="truncate" suppressHydrationWarning>
                {t('customers_page.title')}
              </span>
            </Button>
            <span className="text-muted-foreground shrink-0">/</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 sm:h-8 px-2 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => handleNavigation(`/auth/customers/${customerId}`)}
            >
              <span className="truncate">
                {customer.name}
              </span>
            </Button>
            <span className="text-muted-foreground shrink-0">/</span>
            <span className="text-foreground font-medium truncate" suppressHydrationWarning>
              {t('edit')}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('customers_page.create_page.basic_info.title')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('customers_page.create_page.basic_info.description')}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" suppressHydrationWarning>
                  {t('name')} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('customers_page.create_page.basic_info.name_placeholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" suppressHydrationWarning>
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('customers_page.create_page.basic_info.email_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" suppressHydrationWarning>
                  {t('phone')}
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('customers_page.create_page.basic_info.phone_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" suppressHydrationWarning>
                  {t('company')}
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder={t('customers_page.create_page.basic_info.company_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle" suppressHydrationWarning>
                  {t('customers_page.create_page.basic_info.job_title')}
                </Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder={t('customers_page.create_page.basic_info.job_title_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" suppressHydrationWarning>
                  {t('customers_page.create_page.basic_info.website')}
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder={t('customers_page.create_page.basic_info.website_placeholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('customers_page.create_page.address.title')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('customers_page.create_page.address.description')}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" suppressHydrationWarning>
                {t('customers_page.create_page.address.address')}
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('customers_page.create_page.address.address_placeholder')}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" suppressHydrationWarning>
                  {t('customers_page.create_page.address.city')}
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t('customers_page.create_page.address.city_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" suppressHydrationWarning>
                  {t('customers_page.create_page.address.state')}
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder={t('customers_page.create_page.address.state_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode" suppressHydrationWarning>
                  {t('customers_page.create_page.address.zip_code')}
                </Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder={t('customers_page.create_page.address.zip_code_placeholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country" suppressHydrationWarning>
                  {t('customers_page.create_page.address.country')}
                </Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder={t('customers_page.create_page.address.country_placeholder')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('customers_page.create_page.business_info.title')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('customers_page.create_page.business_info.description')}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerType" suppressHydrationWarning>
                  {t('customers_page.create_page.business_info.customer_type')} *
                </Label>
                <Select
                  value={formData.customerType}
                  onValueChange={(value: 'individual' | 'company' | 'non-profit' | 'government') =>
                    setFormData({ ...formData, customerType: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">{t('customers_page.customer_type.individual')}</SelectItem>
                    <SelectItem value="company">{t('customers_page.customer_type.company')}</SelectItem>
                    <SelectItem value="non-profit">{t('customers_page.customer_type.non-profit')}</SelectItem>
                    <SelectItem value="government">{t('customers_page.customer_type.government')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" suppressHydrationWarning>
                  {t('status')} *
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive' | 'lead' | 'prospect' | 'archived') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="inactive">{t('inactive')}</SelectItem>
                    <SelectItem value="lead">{t('customers_page.status.lead')}</SelectItem>
                    <SelectItem value="prospect">{t('customers_page.status.prospect')}</SelectItem>
                    <SelectItem value="archived">{t('archived')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source" suppressHydrationWarning>
                  {t('customers_page.create_page.business_info.source')}
                </Label>
                <Select
                  value={formData.source}
                  onValueChange={(value: any) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">{t('customers_page.source.website')}</SelectItem>
                    <SelectItem value="referral">{t('customers_page.source.referral')}</SelectItem>
                    <SelectItem value="social_media">{t('customers_page.source.social_media')}</SelectItem>
                    <SelectItem value="advertising">{t('customers_page.source.advertising')}</SelectItem>
                    <SelectItem value="trade_show">{t('customers_page.source.trade_show')}</SelectItem>
                    <SelectItem value="cold_call">{t('customers_page.source.cold_call')}</SelectItem>
                    <SelectItem value="email_campaign">{t('customers_page.source.email_campaign')}</SelectItem>
                    <SelectItem value="other">{t('customers_page.source.other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry" suppressHydrationWarning>
                  {t('customers_page.create_page.business_info.industry')}
                </Label>
                <Input
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder={t('customers_page.create_page.business_info.industry_placeholder')}
                />
              </div>
              <CurrencySelect
                id="currency"
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                label={t('customers_page.create_page.business_info.currency')}
              />
              <div className="space-y-2">
                <Label htmlFor="language" suppressHydrationWarning>
                  {t('customers_page.create_page.business_info.language')}
                </Label>
                <Select
                  value={formData.language}
                  onValueChange={(value: 'en' | 'ms') => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t('language')} - English</SelectItem>
                    <SelectItem value="ms">{t('language')} - Malay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('customers_page.create_page.tags.title')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('customers_page.create_page.tags.description')}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <CustomerTagsInput
              tags={tags}
              onTagsChange={setTags}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning>{t('customers_page.create_page.notes.title')}</CardTitle>
            <CardDescription suppressHydrationWarning>
              {t('customers_page.create_page.notes.description')}
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes" suppressHydrationWarning>
                {t('customers_page.create_page.notes.label')}
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('customers_page.create_page.notes.placeholder')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleNavigation(`/auth/customers/${customerId}`)}
                >
                  {t('cancel')}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p suppressHydrationWarning>{t('customers_page.edit_page.cancel_tooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('customers_page.edit_page.updating')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t('save')}
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p suppressHydrationWarning>
                  {isSubmitting ? t('customers_page.edit_page.updating_tooltip') : t('customers_page.edit_page.save_tooltip')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle suppressHydrationWarning>
              {t('customers_page.edit_page.unsaved_changes_title')}
            </AlertDialogTitle>
            <AlertDialogDescription suppressHydrationWarning>
              {t('customers_page.edit_page.unsaved_changes_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)} suppressHydrationWarning>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setShowUnsavedDialog(false);
                const navPath = pendingNavigation || `/auth/customers/${customerId}`;
                setPendingNavigation(null);
                await new Promise(resolve => setTimeout(resolve, 0));
                router.push(navPath);
              }}
              suppressHydrationWarning
            >
              {t('customers_page.edit_page.leave_without_saving')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}

