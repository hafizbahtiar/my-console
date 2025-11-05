import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  fullScreen?: boolean
}

export function Loading({
  size = 'md',
  text = 'Loading...',
  className,
  fullScreen = false
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center p-4'
    : 'flex items-center justify-center p-4'

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
        {text && (
          <p className="text-sm text-muted-foreground text-center">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// Skeleton loading components for different content types
export function SkeletonCard() {
  return (
    <div className="p-6 border rounded-lg">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded flex-1"></div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-4 bg-muted rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        ></div>
      ))}
    </div>
  )
}
