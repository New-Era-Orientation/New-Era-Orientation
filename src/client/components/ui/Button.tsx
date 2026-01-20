import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/client/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { buttonVariants, ButtonVariant, ButtonSize } from "@/client/lib/button-variants";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    asChild?: boolean;
}

export { buttonVariants };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "default", size = "default", loading, asChild = false, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                ref={ref}
                disabled={disabled || loading}
                className={buttonVariants({ variant, size, className })}
                {...props}
            >
                {asChild ? children : (
                    <>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {children}
                    </>
                )}
            </Comp>
        );
    }
);

Button.displayName = "Button";

export { Button };
