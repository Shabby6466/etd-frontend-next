import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#111] text-white  h-[40px] rounded-xl",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 bg-gray-200 h-[40px] rounded-xl",
        destructive:
          "border-transparent bg-red-500 text-white bg-red-600 h-[40px] rounded-xl",
        outline: "text-gray-700 h-[40px] rounded-xl",
        success: "border-transparent bg-green-500 text-white bg-green-600 h-[40px] rounded-xl",
        warning: "border-transparent bg-yellow-500 text-white bg-yellow-600 h-[40px] rounded-xl",
        info: "border-transparent bg-blue-500 text-white bg-blue-600 h-[40px] rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
