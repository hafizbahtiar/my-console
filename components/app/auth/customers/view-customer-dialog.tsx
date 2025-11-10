"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/status-badge";
import { Edit, Building2, Mail, Phone, MapPin, Globe, Calendar, DollarSign, FileText } from "lucide-react";
import { useTranslation } from "@/lib/language-context";
import { Customer } from "@/app/auth/customers/types";
import { format } from "date-fns";

interface ViewCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onEdit: () => void;
}

export function ViewCustomerDialog({
  open,
  onOpenChange,
  customer,
  onEdit,
}: ViewCustomerDialogProps) {
  const { t } = useTranslation();

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-3 sm:space-y-4 px-0 sm:px-0">
          <div className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">
              {customer.name}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base flex items-center gap-2">
              <StatusBadge status={customer.status} type="customer" />
              {customer.company && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {customer.company}
                  </span>
                </>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4 sm:py-6">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-semibold" suppressHydrationWarning>
              {t('customers_page.view_dialog.contact_info')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          </div>

          {/* Address */}
          {(customer.address || customer.city || customer.state || customer.country) && (
            <div className="space-y-3">
              <h3 className="text-sm sm:text-base font-semibold" suppressHydrationWarning>
                {t('customers_page.view_dialog.address')}
              </h3>
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
            </div>
          )}

          {/* Business Information */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-semibold" suppressHydrationWarning>
              {t('customers_page.view_dialog.business_info')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.customer_type')}</p>
                <p className="text-sm font-medium">{t(`customers_page.customer_type.${customer.customerType}`)}</p>
              </div>
              {customer.industry && (
                <div>
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.industry')}</p>
                  <p className="text-sm font-medium">{customer.industry}</p>
                </div>
              )}
              {customer.source && (
                <div>
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.source')}</p>
                  <p className="text-sm font-medium">{t(`customers_page.source.${customer.source}`)}</p>
                </div>
              )}
              {customer.currency && (
                <div>
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('customers_page.view_dialog.currency')}</p>
                  <p className="text-sm font-medium">{customer.currency}</p>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-semibold" suppressHydrationWarning>
              {t('customers_page.view_dialog.statistics')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-semibold" suppressHydrationWarning>
              {t('customers_page.view_dialog.dates')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {t('close')}
          </Button>
          <Button onClick={onEdit} className="w-full sm:w-auto">
            <Edit className="h-4 w-4 mr-2" />
            {t('edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

