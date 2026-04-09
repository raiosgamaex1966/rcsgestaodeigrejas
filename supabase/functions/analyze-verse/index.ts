import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerseAnalysis {
  pretext: string;
  historicalContext: {
    author: string;
    audience: string;
    date: string;
    circumstances: string;
  };
  textAnalysis: string;
  originalWords: Array<{
    word: string;
    original: string;
    language: string;
    meaning: string;
    strongs?: string;
  }>;
  practicalApplication: string;
  crossReferences: Array<{
    reference: string;
    text: string;
    connection: string;
  }>;
}

interface VerseInput {
  number: number;
  text: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { book, chapter, verses, version } = body;
    
    // Support both old single-verse format and new multi-verse format
    let verseList: VerseInput[] = [];
    
    if (verses && Array.isArray(verses)) {
      verseList = verses;
    } else if (body.verse && body.verseText) {
      // Legacy single verse support
      verseList = [{ number: body.verse, text: body.verseText }];
    }

    if (!book || !chapter || verseList.length === 0) {
      throw new Error('Dados do versículo são obrigatórios');
    }

    // Create Supabase client to fetch church settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch church settings to get OpenAI API key
    const { data: settings, error: settingsError } = await supabase
      .from('church_settings')
      .select('openai_api_key, ai_enabled, ai_model_chat')
      .single();

    if (settingsError || !settings) {
      throw new Error('Configurações da igreja não encontradas');
    }

    if (!settings.ai_enabled || !settings.openai_api_key) {
      throw new Error('IA não configurada. Acesse o painel administrativo para configurar a API Key da OpenAI.');
    }

    const model = settings.ai_model_chat || 'gpt-4o-mini';
    
    // Build reference string
    const sortedVerses = verseList.sort((a, b) => a.number - b.number);
    const reference = sortedVerses.length === 1
      ? `${book} ${chapter}:${sortedVerses[0].number}`
      : `${book} ${chapter}:${sortedVerses[0].number}-${sortedVerses[sortedVerses.length - 1].number}`;
    
    const combinedText = sortedVerses.map(v => `${v.number} ${v.text}`).join(' ');

    console.log(`Analyzing passage: ${reference} with model ${model}`);

    const isPassage = sortedVerses.length > 1;
    
    const systemPrompt = `Você é um teólogo e estudioso bíblico experiente. Sua tarefa é fornecer uma análise profunda e academicamente precisa de ${isPassage ? 'passagens bíblicas' : 'versículos bíblicos'}. 

IMPORTANTE:
- Toda análise deve ser 100% baseada na Bíblia e em fontes teológicas confiáveis
- Inclua palavras no hebraico (Antigo Testamento) ou grego (Novo Testamento) com transliteração
- Seja específico sobre o contexto histórico e literário
- Forneça referências cruzadas relevantes
- Mantenha uma abordagem respeitosa e edificante
${isPassage ? '- Analise a passagem como um todo, identificando a mensagem central e o fluxo do argumento' : ''}

Responda SEMPRE em JSON válido no formato especificado.`;

    const userPrompt = `Analise ${isPassage ? 'a seguinte passagem bíblica' : 'o seguinte versículo bíblico'}:

📖 Referência: ${reference}
📜 Texto: "${combinedText}"
📚 Versão: ${version || 'ARA'}

Forneça uma análise completa no seguinte formato JSON:

{
  "pretext": "Explique o que acontece imediatamente antes ${isPassage ? 'desta passagem' : 'deste versículo'} (contexto narrativo)",
  "historicalContext": {
    "author": "Autor do livro",
    "audience": "Audiência original",
    "date": "Data aproximada de escrita",
    "circumstances": "Circunstâncias históricas"
  },
  "textAnalysis": "${isPassage ? 'Análise detalhada da passagem como um todo, identificando a mensagem central, o fluxo do argumento e a estrutura literária' : 'Análise detalhada do significado do texto, estrutura literária e mensagem principal'}",
  "originalWords": [
    {
      "word": "Palavra traduzida",
      "original": "Palavra original em hebraico/grego",
      "language": "Hebraico ou Grego",
      "meaning": "Significado amplo e nuances",
      "strongs": "Número Strong se aplicável"
    }
  ],
  "practicalApplication": "Como aplicar esta ${isPassage ? 'passagem' : 'passagem'} na vida cristã hoje",
  "crossReferences": [
    {
      "reference": "Livro capítulo:versículo",
      "text": "Texto resumido",
      "connection": "Como se relaciona com ${isPassage ? 'a passagem analisada' : 'o versículo analisado'}"
    }
  ]
}

Inclua ${isPassage ? '3-6' : '2-4'} palavras-chave no original e ${isPassage ? '4-6' : '3-5'} referências cruzadas relevantes.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openai_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI error:', errorData);
      throw new Error(errorData.error?.message || 'Erro na API OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    const analysis: VerseAnalysis = JSON.parse(content);

    console.log(`Analysis completed for ${reference}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        reference,
        model 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-verse:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao analisar versículo';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
