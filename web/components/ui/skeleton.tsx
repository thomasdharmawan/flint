import { cn } from "@/lib/utils"

interface SkeletonProps extends React.ComponentProps<"div"> {
  variant?: "rect" | "circle" | "text"
}

function Skeleton({ className, variant = "rect", ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-accent animate-pulse rounded-md",
        // Enhanced skeleton variants
        variant === "circle" && "rounded-full",
        variant === "text" && "h-4 rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }