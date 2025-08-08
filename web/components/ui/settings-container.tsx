import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Small, Muted } from "@/components/ui/typography";
import "@/styles/settings.css";

interface SettingsContainerProps {
  children: ReactNode;
  className?: string;
}

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

export const SettingsSection = ({
  title,
  description,
  children,
  className,
  contentClassName,
}: SettingsSectionProps) => (
  <>
    <div className={cn("settings-section-header", className)}>
      <Small className="font-semibold">{title}</Small>
      {description && <Muted className="mt-1 text-xs">{description}</Muted>}
    </div>

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

export const SettingsSectionContent = ({
  children,
  className,
}: SettingsSectionContentProps) => (
  <div className={cn("settings-section-content", className)}>{children}</div>
);
