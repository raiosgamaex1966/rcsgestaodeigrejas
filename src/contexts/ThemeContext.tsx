import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useChurchSettings, ChurchSettings } from '@/hooks/useChurchSettings';

interface ThemeContextType {
  settings: ChurchSettings | null | undefined;
  isLoading: boolean;
  theme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to update or create meta tag
const updateMetaTag = (selector: string, attribute: string, value: string) => {
  let element = document.querySelector(selector) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    const match = selector.match(/meta\[(name|property)="([^"]+)"\]/);
    if (match) {
      const [_, attrName, attrValue] = match;
      element.setAttribute(attrName, attrValue);
      document.head.appendChild(element);
    }
  }
  if (element) element.setAttribute(attribute, value);
};

// Helper to update or create link tag
const updateLinkTag = (rel: string, href: string, additionalSelector?: string) => {
  const selector = additionalSelector ? `link[rel="${rel}"]${additionalSelector}` : `link[rel="${rel}"]`;
  let element = document.querySelector(selector) as HTMLLinkElement;
  if (element) element.href = href;
};

// Generate dynamic PWA manifest
const generateManifest = (settings: ChurchSettings) => {
  return {
    name: settings.pwa_name || settings.church_name || 'Aplicativo',
    short_name: settings.pwa_short_name || settings.church_name?.substring(0, 12) || 'App',
    description: settings.pwa_description || settings.description || 'Aplicativo oficial da igreja',
    theme_color: settings.pwa_theme_color || '#1A1F2C',
    background_color: settings.pwa_background_color || '#0B0E14',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      { src: settings.pwa_icon_192_url || '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: settings.pwa_icon_512_url || '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: settings.pwa_icon_512_url || '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  };
};

// Inject dynamic manifest
const injectDynamicManifest = (settings: ChurchSettings) => {
  const existingManifest = document.querySelector('link[rel="manifest"]');
  if (existingManifest) existingManifest.remove();
  const manifest = generateManifest(settings);
  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(manifestBlob);
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = manifestUrl;
  document.head.appendChild(manifestLink);
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { settings, isLoading } = useChurchSettings();

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;

      // Apply all saved colors as CSS variables
      const colorMap: Record<string, string> = {
        primary_color: '--primary',
        secondary_color: '--secondary',
        accent_color: '--accent',
        background_color: '--background',
        foreground_color: '--foreground',
        gold_color: '--gold',
        burgundy_color: '--burgundy',
      };

      Object.entries(colorMap).forEach(([field, cssVar]) => {
        const value = settings[field as keyof ChurchSettings];
        if (value && typeof value === 'string') {
          root.style.setProperty(cssVar, value);
        }
      });

      // Atualizar tags de SEO e PWA ...
      const displayTitle = settings.seo_title || settings.church_name || "Aplicativo Oficial";
      document.title = displayTitle;

      updateMetaTag('meta[name="description"]', 'content', settings.seo_description || settings.description || '');

      // Update Open Graph tags
      updateMetaTag('meta[property="og:title"]', 'content', displayTitle);
      updateMetaTag('meta[property="og:description"]', 'content', settings.seo_description || settings.description || '');
      if (settings.logo_url) updateMetaTag('meta[property="og:image"]', 'content', settings.logo_url);

      // Update Twitter tags
      updateMetaTag('meta[name="twitter:title"]', 'content', displayTitle);
      updateMetaTag('meta[name="twitter:description"]', 'content', settings.seo_description || settings.description || '');
      if (settings.logo_url) updateMetaTag('meta[name="twitter:image"]', 'content', settings.logo_url);

      if (settings.favicon_url) updateLinkTag('icon', settings.favicon_url);
      injectDynamicManifest(settings);
    }
  }, [settings]);

  return (
    <ThemeContext.Provider value={{ settings, isLoading, theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
