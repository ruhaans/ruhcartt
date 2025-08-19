// src/components/ui/Button.jsx
import * as React from "react";
import { cn } from "../../lib/cn";

/**
 * Tailwind Button (no CSS variables)
 * - Variants: primary | secondary | outline | ghost | danger | subtle
 * - Sizes: sm | md | lg  (+ icon-sm/md/lg for icon-only)
 * - Props: as, fullWidth, leadingIcon, trailingIcon, iconOnly, isLoading, disabled
 * - A11y: focus-visible ring, aria-busy, proper disabled for <button> and non-button
 * - Safe default: type="button"
 */
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium " +
  "transition-colors duration-150 select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-600/90 active:bg-indigo-700 " +
    "dark:bg-indigo-500 dark:hover:bg-indigo-500/90",
  secondary:
    "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-800 " +
    "dark:bg-white dark:text-neutral-900 dark:hover:bg-white/90",
  outline:
    "bg-transparent text-neutral-900 border border-neutral-300 hover:bg-neutral-50 " +
    "dark:text-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800",
  ghost:
    "bg-transparent text-neutral-900 hover:bg-black/5 " +
    "dark:text-neutral-100 dark:hover:bg-white/10",
  danger:
    "bg-red-600 text-white hover:bg-red-600/90 active:bg-red-700 " +
    "dark:bg-red-500 dark:hover:bg-red-500/90",
  subtle:
    "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 " +
    "dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4",
  lg: "h-11 px-5 text-base",
  "icon-sm": "h-9 w-9 p-0",
  "icon-md": "h-10 w-10 p-0",
  "icon-lg": "h-11 w-11 p-0",
};

export const Button = React.forwardRef(function Button(
  {
    as: Comp = "button",
    variant = "ghost",
    size = "md",
    className,
    disabled,
    isLoading = false,
    fullWidth = false,
    leadingIcon: LeadingIcon,
    trailingIcon: TrailingIcon,
    iconOnly = false,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || isLoading;
  const computedSize = iconOnly ? `icon-${size}` : size;

  // default type for <button>
  const buttonType =
    Comp === "button" && !("type" in props) ? { type: "button" } : null;

  // non-button disabled a11y
  const ariaDisabledProps =
    Comp !== "button" && isDisabled
      ? { "aria-disabled": true, tabIndex: -1 }
      : {};

  return (
    <Comp
      ref={ref}
      {...buttonType}
      {...ariaDisabledProps}
      {...props}
      className={cn(
        base,
        variants[variant] ?? variants.ghost,
        sizes[computedSize] ?? sizes.md,
        fullWidth && "w-full",
        isLoading && "relative",
        className
      )}
      disabled={Comp === "button" ? isDisabled : undefined}
      aria-busy={isLoading || undefined}
    >
      {/* spinner (keeps layout stable by hiding content via opacity) */}
      {isLoading && (
        <svg
          className="absolute left-3 h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
          />
        </svg>
      )}

      {!iconOnly && LeadingIcon && (
        <LeadingIcon aria-hidden="true" className={cn("h-4 w-4", isLoading && "opacity-0")} />
      )}

      <span className={cn(isLoading && "opacity-0")}>{children}</span>

      {!iconOnly && TrailingIcon && (
        <TrailingIcon aria-hidden="true" className={cn("h-4 w-4", isLoading && "opacity-0")} />
      )}
    </Comp>
  );
});

export default Button;
