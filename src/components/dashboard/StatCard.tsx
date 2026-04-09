import React from 'react';
import { Card } from '../ui/card';

interface StatCardProps {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    subtext?: string;
}

export function StatCard({ icon, value, label, subtext }: StatCardProps) {
    return (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div className="p-3 bg-primary/10 rounded-xl">
                    {icon}
                </div>
            </div>
            <div className="mt-4">
                <p className="text-3xl font-display font-semibold text-foreground">
                    {value}
                </p>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                    {label}
                </p>
                {subtext && (
                    <p className="text-xs text-secondary mt-2">{subtext}</p>
                )}
            </div>
        </Card>
    );
}
