import * as React from "react"
import { cn } from "@/lib/utils"

// Simple mock for now if context is needed
// However, since we are mimicking shadcn, we need the components.
// Let's implement a simple drawer using fixed position.

interface SheetProps {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

const SheetContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)

export const SheetRoot: React.FC<SheetProps> = ({ children, open: controlledOpen, onOpenChange }) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
    const open = controlledOpen ?? uncontrolledOpen
    const setOpen = onOpenChange ?? setUncontrolledOpen

    return (
        <SheetContext.Provider value={{ open, setOpen }}>
            {children}
        </SheetContext.Provider>
    )
}

export const SheetTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => {
    const context = React.useContext(SheetContext)
    if (!context) throw new Error("SheetTrigger must be used within Sheet")

    return (
        <div onClick={() => context.setOpen(true)}>
            {children}
        </div>
    )
}

export const SheetContent: React.FC<{ side?: 'left' | 'right'; children: React.ReactNode; className?: string }> = ({ side = 'right', children, className }) => {
    const context = React.useContext(SheetContext)
    if (!context) throw new Error("SheetContent must be used within Sheet")

    if (!context.open) return null

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-black/50" onClick={() => context.setOpen(false)} />
            <div className={cn(
                "fixed z-[101] gap-4 bg-white p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-y-0 h-full border-r",
                side === 'left' ? "left-0 border-r" : "right-0 border-l",
                className
            )}>
                {children}
                <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-secondary" onClick={() => context.setOpen(false)}>
                    <span className="sr-only">Close</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <line x1="18" x2="6" y1="6" y2="18" />
                        <line x1="6" x2="18" y1="6" y2="18" />
                    </svg>
                </button>
            </div>
        </>
    )
}

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)

export const SheetTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-lg font-semibold text-foreground", className)} {...props} />
)


export const SheetDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
)

// Export aliases
export { SheetRoot as Sheet }
