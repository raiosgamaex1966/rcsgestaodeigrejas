import React from 'react';
import { Link } from 'react-router-dom';

interface QuickAccessButtonProps {
    icon: React.ReactElement;
    label: string;
    href: string;
}

export function QuickAccessButton({ icon, label, href }: QuickAccessButtonProps) {
    return (
        <Link
            to={href}
            className="flex flex-col items-center p-4 bg-card rounded-xl
        border border-border
        shadow-[0_2px_4px_rgba(0,0,0,0.05)]
        hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)]
        hover:-translate-y-1
        hover:scale-105
        transition-all duration-300"
        >
            <div className="w-12 h-12 flex items-center justify-center 
        bg-black/5 dark:bg-white/10 rounded-xl mb-2">
                {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 text-foreground/80 dark:text-foreground' })}
            </div>
            <span className="text-xs font-semibold text-foreground/80 dark:text-foreground text-center">
                {label}
            </span>
        </Link>
    );
}
