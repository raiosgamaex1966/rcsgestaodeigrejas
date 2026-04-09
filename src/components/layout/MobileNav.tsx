import React, { useState } from 'react';
import { Home, BookOpen, Calendar, User, MoreHorizontal, LogOut, Settings, Moon, Sun, X, Heart, Camera, Headphones, UserCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/lib/utils';

export function MobileNav() {
    const location = useLocation();
    const { user, userRole, isVisitor, signOut, tenant } = useAuth();
    const { isDark, toggle: toggleDarkMode } = useDarkMode();
    const [menuOpen, setMenuOpen] = useState(false);

    const isActive = (path: string) => {
        const currentPath = location.pathname;
        const pathWithoutSlug = tenant?.slug 
          ? currentPath.replace(`/app/${tenant.slug}`, '/app') 
          : currentPath;
        
        if (path === '/app') return pathWithoutSlug === '/app' || pathWithoutSlug === '/';
        return pathWithoutSlug.startsWith(path);
    };

    const getFullHRef = (path: string) => {
        if (!tenant?.slug) return path;
        if (path.startsWith('/app')) {
          return path.replace('/app', `/app/${tenant.slug}`);
        }
        return `/app/${tenant.slug}${path}`;
    };

    const navItems = [
        { icon: Home, label: 'Início', href: getFullHRef('/app') },
        { icon: BookOpen, label: 'Bíblia', href: getFullHRef('/bible') },
        { icon: Calendar, label: 'Agenda', href: getFullHRef('/events') },
        { icon: User, label: 'Perfil', href: getFullHRef('/profile') },
    ];

    const moreItems = [
        { icon: Headphones, label: 'Ministrações', href: getFullHRef('/sermons') },
        { icon: Camera, label: 'Galeria', href: getFullHRef('/gallery') },
        { icon: Heart, label: 'Pedidos', href: getFullHRef('/requests') },
        { icon: Settings, label: 'Configurações', href: getFullHRef('/settings') },
    ];

    return (
        <>
            {/* Overlay backdrop */}
            {menuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMenuOpen(false)}
                />
            )}

            {/* Slide-up menu */}
            {menuOpen && (
                <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-2xl z-50 md:hidden animate-in slide-in-from-bottom-5 duration-200">
                    <div className="p-4 space-y-1">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-foreground">Mais opções</span>
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="p-1.5 rounded-full hover:bg-muted"
                            >
                                <X className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Navigation items */}


                        {moreItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                        isActive(item.href)
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            ))}

                        {/* Separator */}
                        <div className="border-t border-border my-2" />

                        {/* Logout */}
                        <button
                            onClick={() => {
                                setMenuOpen(false);
                                signOut();
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Sair</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-card
                border-t border-border px-2 py-1.5 md:hidden z-50">
                <div className="flex items-center justify-around">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex flex-col items-center p-2 rounded-lg transition-colors min-w-[56px]",
                                    active
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", active && "text-primary")} />
                                <span className={cn(
                                    "text-[10px] mt-0.5",
                                    active ? "font-semibold text-primary" : "text-muted-foreground"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                    {/* More button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={cn(
                            "flex flex-col items-center p-2 rounded-lg transition-colors min-w-[56px]",
                            menuOpen
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                        <span className="text-[10px] mt-0.5">Mais</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
