import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// User agents that are social media crawlers
const CRAWLER_USER_AGENTS = [
  'WhatsApp',
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'Pinterest',
  'Googlebot',
]

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false
  return CRAWLER_USER_AGENTS.some(crawler =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  )
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const id = url.searchParams.get('id')
    const slug = url.searchParams.get('slug') // Support for public_slug
    const userAgent = req.headers.get('user-agent')
    const referer = req.headers.get('referer') || ''

    console.log('OG Meta request:', { type, id, slug, userAgent, referer, isCrawler: isCrawler(userAgent) })

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get church settings to find the configured website URL and branding
    const { data: churchSettings } = await supabaseClient
      .from('church_settings')
      .select('church_name, logo_url, favicon_url, seo_og_image_url, seo_title, seo_description, website_url')
      .limit(1)
      .single()

    // Determine the app URL - prefer configured website_url, then referer, then fallback
    let appUrl = ''
    if (churchSettings?.website_url) {
      appUrl = churchSettings.website_url.replace(/\/$/, '') // Remove trailing slash
    } else if (referer) {
      // Extract base URL from referer
      try {
        const refererUrl = new URL(referer)
        appUrl = `${refererUrl.protocol}//${refererUrl.host}`
      } catch {
        // Invalid referer, will use fallback
      }
    }

    // Fallback to the Vercel domain mentioned by the user
    if (!appUrl) {
      appUrl = `https://igrejateste03022026.vercel.app`
    }

    console.log('Using appUrl:', appUrl)

    if (!type || (!id && !slug)) {
      return Response.redirect(appUrl, 302)
    }

    // If not a crawler, redirect immediately to SPA
    if (!isCrawler(userAgent)) {
      let redirectUrl = appUrl

      if (type === 'sermon') {
        redirectUrl = `${appUrl}/sermons/${id}`
      } else if (type === 'evento' && slug) {
        redirectUrl = `${appUrl}/evento/${slug}`
      } else if (type === 'event' && id) {
        redirectUrl = `${appUrl}/events?event=${id}`
      } else if (type === 'plan') {
        redirectUrl = `${appUrl}/plans/${id}`
      }

      console.log('Not a crawler, redirecting to:', redirectUrl)
      return Response.redirect(redirectUrl, 302)
    }

    // It's a crawler - fetch content and return meta tags
    // Use church settings for defaults
    let title = churchSettings?.seo_title || churchSettings?.church_name || 'RCS Gestão de Igrejas'
    let description = churchSettings?.seo_description || 'Aplicativo da Igreja'
    let imageUrl = ''
    let contentUrl = appUrl

    if (type === 'sermon') {
      const { data: sermon, error } = await supabaseClient
        .from('sermons')
        .select('title, description, summary, thumbnail_url, preacher:preachers(name)')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching sermon:', error)
      } else if (sermon) {
        title = sermon.title
        description = sermon.summary || sermon.description || `Ministração: ${sermon.title}`
        imageUrl = sermon.thumbnail_url || ''
        contentUrl = `${appUrl}/sermons/${id}`

        // preacher can be an object or array depending on the query
        const preacher = sermon.preacher as unknown
        if (preacher && typeof preacher === 'object' && 'name' in preacher) {
          description = `${(preacher as { name: string }).name} - ${description}`
        }
      }
    } else if (type === 'evento' && slug) {
      // Fetch event by public_slug
      const { data: event, error } = await supabaseClient
        .from('events')
        .select('title, description, image_url, start_date, location, start_time')
        .eq('public_slug', slug)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching event by slug:', error)
      } else if (event) {
        title = event.title

        // Build description with event details
        let descParts = []
        if (event.start_date) {
          const date = new Date(event.start_date + 'T00:00:00')
          descParts.push(`📅 ${date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`)
        }
        if (event.start_time) {
          descParts.push(`⏰ ${event.start_time.slice(0, 5)}`)
        }
        if (event.location) {
          descParts.push(`📍 ${event.location}`)
        }

        description = descParts.length > 0
          ? descParts.join(' | ') + (event.description ? ` - ${event.description}` : '')
          : event.description || `Evento: ${event.title}`

        imageUrl = event.image_url || ''
        contentUrl = `${appUrl}/evento/${slug}`
      }
    } else if (type === 'event' && id) {
      const { data: event, error } = await supabaseClient
        .from('events')
        .select('title, description, image_url, start_date, location')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching event:', error)
      } else if (event) {
        title = event.title
        description = event.description || `Evento: ${event.title}`
        imageUrl = event.image_url || ''
        contentUrl = `${appUrl}/events`
      }
    } else if (type === 'plan') {
      const { data: plan, error } = await supabaseClient
        .from('reading_plans')
        .select('title, description, thumbnail_url, duration_days')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching plan:', error)
      } else if (plan) {
        title = plan.title
        description = plan.description || `Plano de ${plan.duration_days} dias`
        imageUrl = plan.thumbnail_url || ''
        contentUrl = `${appUrl}/plans/${id}`
      }
    }

    // Use church settings already fetched for fallback branding
    // Priority: content-specific image > seo_og_image > logo > favicon
    if (churchSettings && !imageUrl) {
      imageUrl = churchSettings.seo_og_image_url || churchSettings.logo_url || churchSettings.favicon_url || ''
    }

    // Truncate description to 160 chars for OG
    if (description.length > 160) {
      description = description.substring(0, 157) + '...'
    }

    console.log('Returning OG meta for crawler:', { title, description, imageUrl, contentUrl })

    // Return HTML with meta tags for crawlers
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(contentUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">` : ''}
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ''}
  
  <!-- Redirect for browsers that render this page -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(contentUrl)}">
</head>
<body>
  <p>Redirecionando para <a href="${escapeHtml(contentUrl)}">${escapeHtml(title)}</a>...</p>
  <script>window.location.href = "${escapeJs(contentUrl)}";</script>
</body>
</html>`

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })

  } catch (err) {
    const error = err as Error
    console.error('OG Meta error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
