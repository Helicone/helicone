'use client';

import React, { useState } from 'react';
import { Check, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeadingWithCopyLinkProps {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    id?: string;
    children?: React.ReactNode;
    className?: string;
}

export const HeadingWithCopyLink: React.FC<HeadingWithCopyLinkProps> = ({
    level,
    id,
    children,
    className,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [copied, setCopied] = useState(false);

    const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;

    const copyLink = async () => {
        if (!id || copied) return;
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setIsHovered(false);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Failed to copy link: ', err);
        }
    };

    return (
        <HeadingTag
            id={id}
            className={cn("relative flex items-center gap-2 cursor-pointer group", className)}
            onClick={id ? copyLink : undefined}
            onMouseEnter={() => id && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            title={id ? "Copy link to heading" : undefined}
        >
            {children}
            {id && (
                <TooltipProvider delayDuration={0}>
                    <Tooltip open={copied}>
                        <TooltipTrigger asChild>
                            <div className="size-4 shrink-0">
                                {copied ? (
                                    <Check className="size-full text-brand" />
                                ) : isHovered ? (
                                    <LinkIcon className="size-full text-muted-foreground" />
                                ) : null}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">Copied!</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </HeadingTag>
    );
};
