import { cn } from "../../lib/utils"
import { Skeleton } from "./skeleton"

export function LoadingSpinner({ className, size = "default" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-gray-200 border-t-primary",
        sizeClasses[size]
      )} />
    </div>
  )
}

export function LoadingDots({ className }) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
    </div>
  )
}

export function LoadingText({ children, loading = false, loadingText = "Loading..." }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <LoadingSpinner size="sm" />
        <span className="text-sm">{loadingText}</span>
      </div>
    )
  }
  return children
}

export function CardSkeleton({ rows = 3, showHeader = true }) {
  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 3 }) {
  return (
    <div className="flex items-center space-x-4 py-2">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}