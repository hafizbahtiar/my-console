"use client";

import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Clock,
  Archive,
  Play,
  Pause,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/language-context";

export type StatusType =
  | 'blog-post'
  | 'blog-category'
  | 'community-post'
  | 'task'
  | 'project'
  | 'user'
  | 'database-collection'
  | 'backup'
  | 'system-health'
  | 'customer'
  | 'generic';

export type StatusValue =
  | 'published' | 'draft' | 'archived'  // Blog post statuses
  | 'pending' | 'approved' | 'rejected' | 'deleted'  // Community post statuses (archived shared with blog)
  | 'active' | 'inactive'              // Active/inactive statuses
  | 'completed' | 'in-progress' | 'cancelled'  // Task/project statuses
  | 'online' | 'offline' | 'away'      // User statuses
  | 'healthy' | 'warning' | 'critical' | 'empty'  // System/database statuses
  | 'failed' | 'successful' | 'manual' | 'scheduled'  // Backup statuses
  | string;                            // Generic fallback

interface StatusBadgeProps {
  status: StatusValue;
  type?: StatusType;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

const statusConfigs = {
  // Blog post statuses
  'blog-post': {
    published: {
      label: 'Published',
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    draft: {
      label: 'Draft',
      variant: 'secondary' as const,
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
      icon: AlertCircle,
    },
    archived: {
      label: 'Archived',
      variant: 'outline' as const,
      colors: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      icon: Archive,
    },
  },

  // Blog category statuses
  'blog-category': {
    active: {
      label: 'Active',
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    inactive: {
      label: 'Inactive',
      variant: 'secondary' as const,
      colors: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      icon: Pause,
    },
  },

  // Community post statuses (labels will be translated in component)
  'community-post': {
    pending: {
      label: '', // Will be translated in component
      variant: 'secondary' as const,
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
      icon: Clock,
    },
    approved: {
      label: '', // Will be translated in component
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    rejected: {
      label: '', // Will be translated in component
      variant: 'destructive' as const,
      colors: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
      icon: XCircle,
    },
    archived: {
      label: '', // Will be translated in component
      variant: 'outline' as const,
      colors: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      icon: Archive,
    },
    deleted: {
      label: '', // Will be translated in component
      variant: 'destructive' as const,
      colors: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
      icon: XCircle,
    },
  },

  // Task statuses
  'task': {
    completed: {
      label: 'Completed',
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    'in-progress': {
      label: 'In Progress',
      variant: 'default' as const,
      colors: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      icon: Play,
    },
    pending: {
      label: 'Pending',
      variant: 'secondary' as const,
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
      icon: Clock,
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'destructive' as const,
      colors: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
      icon: XCircle,
    },
  },

  // Project statuses
  'project': {
    active: {
      label: 'Active',
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: Play,
    },
    completed: {
      label: 'Completed',
      variant: 'default' as const,
      colors: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      icon: CheckCircle,
    },
    'on-hold': {
      label: 'On Hold',
      variant: 'secondary' as const,
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
      icon: Pause,
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'destructive' as const,
      colors: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
      icon: XCircle,
    },
  },

  // User statuses
  'user': {
    online: {
      label: 'Online',
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: Eye,
    },
    offline: {
      label: 'Offline',
      variant: 'secondary' as const,
      colors: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      icon: EyeOff,
    },
    away: {
      label: 'Away',
      variant: 'secondary' as const,
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
      icon: Clock,
    },
  },

  // Database collection statuses
  'database-collection': {
    active: {
      label: 'Active',
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    inactive: {
      label: 'Inactive',
      variant: 'secondary' as const,
      colors: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      icon: Pause,
    },
    empty: {
      label: 'Empty',
      variant: 'outline' as const,
      colors: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      icon: AlertCircle,
    },
  },

  // Backup statuses
  'backup': {
    completed: {
      label: 'Completed',
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    failed: {
      label: 'Failed',
      variant: 'destructive' as const,
      colors: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
      icon: XCircle,
    },
    'in-progress': {
      label: 'In Progress',
      variant: 'default' as const,
      colors: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      icon: Play,
    },
    successful: {
      label: 'Successful',
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    manual: {
      label: 'Manual',
      variant: 'secondary' as const,
      colors: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
      icon: AlertTriangle,
    },
    scheduled: {
      label: 'Scheduled',
      variant: 'default' as const,
      colors: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
      icon: Clock,
    },
  },

  // System health statuses
  'system-health': {
    healthy: {
      label: 'Healthy',
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    warning: {
      label: 'Warning',
      variant: 'secondary' as const,
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle,
    },
    critical: {
      label: 'Critical',
      variant: 'destructive' as const,
      colors: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800',
      icon: AlertCircle,
    },
  },

  // Customer statuses (labels will be translated in component)
  'customer': {
    active: {
      label: '', // Will be translated in component
      variant: 'default' as const,
      colors: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    inactive: {
      label: '', // Will be translated in component
      variant: 'secondary' as const,
      colors: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      icon: Pause,
    },
    lead: {
      label: '', // Will be translated in component
      variant: 'default' as const,
      colors: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      icon: AlertCircle,
    },
    prospect: {
      label: '', // Will be translated in component
      variant: 'default' as const,
      colors: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle,
    },
    archived: {
      label: '', // Will be translated in component
      variant: 'outline' as const,
      colors: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      icon: Archive,
    },
  },

  // Generic fallback
  'generic': {
    default: {
      label: 'Unknown',
      variant: 'outline' as const,
      colors: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      icon: AlertCircle,
    },
  },
};

export function StatusBadge({
  status,
  type = 'generic',
  showIcon = true,
  className,
  size = 'default'
}: StatusBadgeProps) {
  const { t } = useTranslation();
  
  // Get the configuration for this type and status
  const typeConfig = statusConfigs[type];
  const statusConfig = typeConfig?.[status as keyof typeof typeConfig] || statusConfigs.generic.default;

  // For generic types, use the status as the label if no specific config exists
  let finalConfig = type === 'generic' && !typeConfig?.[status as keyof typeof typeConfig]
    ? { ...statusConfigs.generic.default, label: status }
    : statusConfig;

  // Translate community-post statuses using root-level keys
  if (type === 'community-post') {
    const statusTranslations: Record<string, string> = {
      pending: t('pending'),
      approved: t('approved'),
      rejected: t('rejected'),
      archived: t('archived'),
      deleted: t('deleted'),
    };
    finalConfig = {
      ...finalConfig,
      label: statusTranslations[status as string] || finalConfig.label,
    };
  }

  // Translate customer statuses
  if (type === 'customer') {
    const statusTranslations: Record<string, string> = {
      active: t('active'),
      inactive: t('inactive'),
      lead: t('customers_page.status.lead'),
      prospect: t('customers_page.status.prospect'),
      archived: t('archived'),
    };
    finalConfig = {
      ...finalConfig,
      label: statusTranslations[status as string] || finalConfig.label,
    };
  }

  const Icon = finalConfig.icon;
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-sm';

  return (
    <Badge
      variant={finalConfig.variant}
      className={cn(
        finalConfig.colors,
        textSize,
        showIcon && Icon !== null && Icon !== undefined ? 'flex items-center gap-1' : '',
        className
      )}
      suppressHydrationWarning
    >
      {showIcon && Icon !== null && Icon !== undefined && <Icon className={iconSize} />}
      <span suppressHydrationWarning>{finalConfig.label}</span>
    </Badge>
  );
}

// Convenience functions for specific types
export function BlogPostStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="blog-post" {...props} />;
}

export function BlogCategoryStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="blog-category" {...props} />;
}

export function TaskStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="task" {...props} />;
}

export function ProjectStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="project" {...props} />;
}

export function UserStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="user" {...props} />;
}

export function DatabaseCollectionStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="database-collection" {...props} />;
}

export function BackupStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="backup" {...props} />;
}

export function SystemHealthStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'type'>) {
  return <StatusBadge status={status} type="system-health" {...props} />;
}
