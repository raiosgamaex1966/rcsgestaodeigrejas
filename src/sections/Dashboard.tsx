import React, { useEffect } from 'react';
import {
    Bell, Flame, Star, BookOpen, Target,
    Calendar, Headphones, Heart, BookMarked,
    GraduationCap, MessageCircle, Camera, FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { StatCard } from '../components/dashboard/StatCard';
import { VerseCard } from '../components/dashboard/VerseCard';
import { QuickAccessButton } from '../components/dashboard/QuickAccessButton';
import { EventCard } from '../components/events/EventCard';
import { NotificationBell } from '../components/ui/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { useGamificationContext } from '@/contexts/GamificationContext';
import { useBible } from '@/hooks/useBible';
import { RecentPhotosCarousel } from '../components/dashboard/RecentPhotosCarousel';
import { useEvents } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
    const { user, userRole, isMember, tenant } = useAuth();

    const getFullHRef = (path: string) => {
        if (!tenant?.slug) return path;
        if (path.startsWith('/app')) {
            return path.replace('/app', `/app/${tenant.slug}`);
        }
        return `/app/${tenant.slug}${path}`;
    };
    const { profile, firstName } = useProfile();
    const { gamification } = useGamificationContext();
    const {
        history, favorites, allNotes,
        fetchHistory, fetchFavorites, fetchAllNotes
    } = useBible();
    const { data: events = [], isLoading: eventsLoading } = useEvents();
    const upcomingEvents = events.slice(0, 3);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bom dia ☀️";
        if (hour < 18) return "Boa tarde 🌤️";
        return "Boa noite ✨";
    };

    return (
        <div className="min-h-screen bg-background text-text-primary font-body">
            {/* Header / Banner area */}
            <header className="bg-gradient-universal px-8 pt-10 pb-16 rounded-b-[2.5rem] relative overflow-hidden">
                {/* Decorative circle */}
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
                    <div>
                        <p className="text-white/80 text-sm font-medium mb-1">{getGreeting()}</p>
                        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                            Olá, {firstName || user?.email?.split('@')[0]}!
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to={getFullHRef("/profile")}>
                            <Avatar className="h-12 w-12 border-2 border-white/20 shadow-lg transition-transform hover:scale-110">
                                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                                <AvatarFallback className="bg-white/10 text-white font-bold">
                                    {firstName?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="px-8 -mt-8 max-w-7xl mx-auto relative z-20">
                {/* Grid Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Coluna Esquerda - 2/3 */}
                    <div className="lg:col-span-2 space-y-8">

                        {isMember ? (
                            <>
                                <h2 className="text-lg font-display font-semibold text-white -mb-4">
                                    Estatísticas de Leitura
                                </h2>

                                {/* Cards de Estatísticas */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Link to={getFullHRef("/bible")}>
                                        <StatCard
                                            icon={<BookOpen className="w-6 h-6 text-blue-500" />}
                                            value={history?.length?.toString() || "0"}
                                            label="Capítulos"
                                        />
                                    </Link>
                                    <Link to={getFullHRef("/bible?tab=favorites")}>
                                        <StatCard
                                            icon={<Heart className="w-6 h-6 text-red-500" />}
                                            value={favorites?.length?.toString() || "0"}
                                            label="Favoritos"
                                        />
                                    </Link>
                                    <Link to={getFullHRef("/bible?tab=notes")}>
                                        <StatCard
                                            icon={<FileText className="w-6 h-6 text-orange-500" />}
                                            value={allNotes?.length?.toString() || "0"}
                                            label="Notas"
                                        />
                                    </Link>
                                    <StatCard
                                        icon={<Calendar className="w-6 h-6 text-green-500" />}
                                        value={gamification?.current_streak?.toString() || "0"}
                                        label="Dias"
                                    />
                                </div>

                                {/* Botão Continuar Lendo */}
                                <Link to={getFullHRef("/bible")} className="w-full py-4 bg-card rounded-xl border border-border 
                      hover:border-primary hover:shadow-md transition-all
                      flex items-center justify-center gap-2 text-muted-foreground">
                                    <BookOpen className="w-5 h-5" />
                                    <span>Continuar lendo</span>
                                </Link>
                            </>
                        ) : (
                            <div className="h-4" /> /* Spacer if no stats */
                        )}

                        {/* Versículo do Dia */}
                        <VerseCard
                            verse="Porque sou eu que conheço os planos que tenho para vocês..."
                            reference="Jeremias 29:11"
                            theme="Esperança"
                        />

                        {/* Fotos Recentes */}
                        <RecentPhotosCarousel />
                    </div>

                    {/* Coluna Direita - 1/3 */}
                    <div className="space-y-8 pt-8 md:pt-12">

                        {/* Acesso Rápido */}
                        <div>
                            <h2 className="text-lg font-display font-semibold text-text-primary mb-4">
                                Acesso Rápido
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <QuickAccessButton icon={<BookOpen />} label="Bíblia" href={getFullHRef("/bible")} />
                                <QuickAccessButton icon={<Calendar />} label="Agenda" href={getFullHRef("/events")} />
                                <QuickAccessButton icon={<Headphones />} label="Ministrações" href={getFullHRef("/sermons")} />
                                {isMember && <QuickAccessButton icon={<Heart />} label="Dízimos" href={getFullHRef("/offerings")} />}
                                {isMember && <QuickAccessButton icon={<BookMarked />} label="Planos" href={getFullHRef("/plans")} />}
                                {isMember && <QuickAccessButton icon={<GraduationCap />} label="Cursos" href={getFullHRef("/courses")} />}
                                {isMember && <QuickAccessButton icon={<MessageCircle />} label="Pedidos" href={getFullHRef("/requests")} />}
                                {isMember && <QuickAccessButton icon={<Camera />} label="Galeria" href={getFullHRef("/gallery")} />}
                            </div>
                        </div>

                        {/* Próximos Eventos */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-display font-semibold text-text-primary">
                                    Próximos Eventos
                                </h2>
                                <Link to={getFullHRef("/events")} className="text-sm text-primary hover:underline">
                                    Ver todos →
                                </Link>
                            </div>
                            <div className="space-y-3">
                                {eventsLoading ? (
                                    <>
                                        <Skeleton className="h-24 rounded-lg" />
                                        <Skeleton className="h-24 rounded-lg" />
                                    </>
                                ) : upcomingEvents.length > 0 ? (
                                    upcomingEvents.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Nenhum evento próximo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
