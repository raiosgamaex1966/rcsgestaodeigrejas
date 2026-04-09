import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, theme, duration, subject, expectation, message } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch church settings to get OpenAI API key
    console.log("Fetching church settings for API key...");
    const { data: churchSettings, error: settingsError } = await supabase
      .from("church_settings")
      .select("openai_api_key, ai_enabled, ai_model_generation")
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching church settings:", settingsError);
      throw new Error("Erro ao buscar configurações");
    }

    const OPENAI_API_KEY = churchSettings?.openai_api_key;
    const aiEnabled = churchSettings?.ai_enabled || false;
    const generationModel = churchSettings?.ai_model_generation || "gpt-4o";

    if (!aiEnabled || !OPENAI_API_KEY) {
      throw new Error(
        "IA não configurada. Configure sua chave API da OpenAI no Painel Admin → Configurações → Inteligência Artificial"
      );
    }

    const systemPrompt = `Você é um assistente especializado em criar ministrações cristãs profundas e bem estruturadas.

Sua tarefa é criar uma ministração completa baseada nos parâmetros fornecidos pelo ministro.

A ministração deve:
1. Ser bíblica e fundamentada nas Escrituras
2. Ter uma estrutura clara com introdução, desenvolvimento (3-5 tópicos), aplicação prática e conclusão
3. Incluir versículos relevantes para cada ponto
4. Ser adequada para o tempo de duração especificado
5. Transmitir a mensagem que o ministro deseja passar

Responda APENAS com um JSON válido no formato:
{
  "title": "Título impactante da ministração",
  "introduction": "Texto da introdução que contextualiza o tema e capta a atenção",
  "topics": [
    {
      "title": "Título do Tópico 1",
      "content": "Desenvolvimento detalhado do ponto com explicações",
      "verse": "Versículo principal (ex: João 3:16)"
    },
    {
      "title": "Título do Tópico 2",
      "content": "Desenvolvimento detalhado do ponto",
      "verse": "Versículo principal"
    }
  ],
  "application": "Como aplicar esta mensagem na vida prática",
  "conclusion": "Conclusão que resume e faz um chamado",
  "references": ["Lista", "de", "todas", "as referências", "bíblicas", "usadas"]
}`;

    const userPrompt = `Crie uma ministração com os seguintes parâmetros:

📅 Data: ${date}
⏱️ Duração: ${duration} minutos
📌 Tema: ${theme || "Livre"}
📝 Assunto principal: ${subject}
💭 Expectativa/Resumo: ${expectation || "Não especificado"}
🎯 Mensagem central a transmitir: ${message || "Não especificado"}

Crie uma ministração completa, profunda e bem estruturada.`;

    console.log("Generating sermon with OpenAI model:", generationModel);

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: generationModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: "Chave API inválida. Verifique as configurações de IA." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes na conta OpenAI." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    // Parse JSON response
    let parsedContent;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      // Return a basic structure with the raw content
      parsedContent = {
        title: subject,
        introduction: "Erro ao processar. Conteúdo bruto:",
        topics: [{ title: "Conteúdo", content: content.substring(0, 2000), verse: "" }],
        application: "",
        conclusion: "",
        references: [],
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating sermon:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
