import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Small, Muted } from "@/components/ui/typography";
import "@/styles/settings.css";

interface SettingsContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Main container wrapper for settings pages
 * Provides consistent width, borders, and background
 */
export const SettingsContainer = ({
  children,
  className,
}: SettingsContainerProps) => (
  <div className={cn("settings-container", className)}>{children}</div>
);

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Individual section within a settings page
 * Includes header with title/description and content area
 */
export const SettingsSection = ({
  title,
  description,
  children,
  className,
  contentClassName,
}: SettingsSectionProps) => (
  <>
    {/* Section Header */}
    <div className={cn("settings-section-header", className)}>
      <Small className="font-semibold">{title}</Small>
      {description && <Muted className="mt-1 text-xs">{description}</Muted>}
    </div>

    {/* Section Content */}
    <div className={cn("settings-section-content", contentClassName)}>
      {children}
    </div>
  </>
);

interface SettingsSectionHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Just the header part of a settings section
 * Useful when you need custom content area styling
 */
export const SettingsSectionHeader = ({
  title,
  description,
  children,
  className,
}: SettingsSectionHeaderProps) => (
  <div className={cn("settings-section-header", className)}>
    <div className="flex items-center justify-between">
      <div>
        <Small className="font-semibold">{title}</Small>
        {description && <Muted className="mt-1 text-xs">{description}</Muted>}
      </div>
      {children && <div>{children}</div>}
    </div>
  </div>
);

interface SettingsSectionContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Just the content area of a settings section
 * Use with SettingsSectionHeader for custom layouts
 */
export const SettingsSectionContent = ({
  children,
  className,
}: SettingsSectionContentProps) => (
  <div className={cn("settings-section-content", className)}>{children}</div>
);
