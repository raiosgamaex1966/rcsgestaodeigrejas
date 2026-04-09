import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Phone, MapPin, Globe, Mail } from "lucide-react";

export function Footer() {
    const { settings } = useChurchSettings();

    if (!settings) return null;

    const {
        contact_address,
        contact_phone,
        website_url,
        contact_email,
        church_name
    } = settings;

    // Se não houver informações preenchidas, não mostra o rodapé para não ficar vazio
    if (!contact_address && !contact_phone && !website_url && !contact_email) {
        return null;
    }

    return (
        <footer className="bg-card border-t border-border mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Church Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-serif font-bold text-gradient-gold">
                            {church_name}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Semeando o evangelho e transformando vidas através da palavra de Deus.
                        </p>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            Contato
                        </h4>
                        <ul className="space-y-3">
                            {contact_address && (
                                <li className="flex items-start gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <MapPin className="w-4 h-4 mt-1 text-primary shrink-0" />
                                    <span>{contact_address}</span>
                                </li>
                            )}
                            {contact_phone && (
                                <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <Phone className="w-4 h-4 text-primary shrink-0" />
                                    <a href={`https://wa.me/${contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                        {contact_phone}
                                    </a>
                                </li>
                            )}
                            {contact_email && (
                                <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <Mail className="w-4 h-4 text-primary shrink-0" />
                                    <a href={`mailto:${contact_email}`}>
                                        {contact_email}
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Links / Site Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            Links Úteis
                        </h4>
                        <ul className="space-y-3">
                            {settings.useful_links && settings.useful_links.length > 0 ? (
                                settings.useful_links.map((link, index) => (
                                    <li key={index} className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        <Globe className="w-4 h-4 text-primary shrink-0" />
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="truncate">
                                            {link.label}
                                        </a>
                                    </li>
                                ))
                            ) : website_url ? (
                                <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                    <Globe className="w-4 h-4 text-primary shrink-0" />
                                    <a href={website_url} target="_blank" rel="noopener noreferrer" className="truncate">
                                        {website_url.replace(/^https?:\/\//, '')}
                                    </a>
                                </li>
                            ) : null}
                            <li className="text-sm text-muted-foreground pt-2">
                                © {new Date().getFullYear()} {church_name}. Todos os direitos reservados.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}
