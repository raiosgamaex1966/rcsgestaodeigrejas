import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHUNK_SIZE = 15 * 1024 * 1024; // 15MB per chunk for Whisper
const MAX_TOTAL_SIZE = 150 * 1024 * 1024; // 150MB max total

async function transcribeChunk(
  audioBlob: Blob,
  extension: string,
  apiKey: string,
  chunkIndex: number,
  totalChunks: number
): Promise<string> {
  console.log(`Transcribing chunk ${chunkIndex + 1}/${totalChunks}, size: ${audioBlob.size} bytes`);

  const formData = new FormData();
  formData.append("file", audioBlob, `audio_chunk_${chunkIndex}.${extension}`);
  formData.append("model", "whisper-1");
  formData.append("language", "pt");
  formData.append("response_format", "text");

  const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!whisperResponse.ok) {
    const errorText = await whisperResponse.text();
    console.error(`Whisper API error for chunk ${chunkIndex}:`, whisperResponse.status, errorText);

    if (whisperResponse.status === 401) {
      throw new Error("Chave API inválida. Verifique as configurações de IA.");
    } else if (whisperResponse.status === 429) {
      throw new Error("Limite de requisições da OpenAI excedido. Tente novamente mais tarde.");
    } else if (whisperResponse.status === 402) {
      throw new Error("Créditos insuficientes na conta OpenAI.");
    }

    throw new Error(`Falha na transcrição do chunk ${chunkIndex + 1}: ${whisperResponse.status}`);
  }

  const text = await whisperResponse.text();
  console.log(`Chunk ${chunkIndex + 1} transcribed, length: ${text.length} chars`);
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sermonId, transcript, audioUrl } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch church settings to get OpenAI API key
    console.log("Fetching church settings for API key...");
    const { data: churchSettings, error: settingsError } = await supabase
      .from("church_settings")
      .select("openai_api_key, ai_enabled, ai_model_chat")
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching church settings:", settingsError);
      throw new Error("Erro ao buscar configurações");
    }

    const OPENAI_API_KEY = churchSettings?.openai_api_key;
    const aiEnabled = churchSettings?.ai_enabled || false;
    const chatModel = churchSettings?.ai_model_chat || "gpt-4o-mini";

    if (!aiEnabled || !OPENAI_API_KEY) {
      throw new Error(
        "IA não configurada. Configure sua chave API da OpenAI no Painel Admin → Configurações → Inteligência Artificial"
      );
    }

    let textToProcess = transcript;

    // If no transcript provided but audio URL exists, transcribe
    if (!textToProcess && audioUrl) {
      console.log("Checking audio file size from URL:", audioUrl);

      try {
        // First, check file size with HEAD request
        const headResponse = await fetch(audioUrl, { method: "HEAD" });
        const contentLength = headResponse.headers.get("content-length");
        const fileSize = contentLength ? parseInt(contentLength) : 0;

        console.log("Audio file size:", fileSize, "bytes", `(${Math.round(fileSize / 1024 / 1024)}MB)`);

        if (fileSize > MAX_TOTAL_SIZE) {
          throw new Error(
            `O arquivo de áudio é muito grande (${Math.round(fileSize / 1024 / 1024)}MB). ` +
            `O limite máximo é ${Math.round(MAX_TOTAL_SIZE / 1024 / 1024)}MB. ` +
            `Por favor, comprima o arquivo ou adicione a transcrição manualmente.`
          );
        }

        // Download the audio file
        console.log("Downloading audio file...");
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
          throw new Error(`Failed to download audio: ${audioResponse.status}`);
        }

        const audioBuffer = await audioResponse.arrayBuffer();
        const audioBlob = new Blob([audioBuffer]);
        console.log("Audio downloaded, size:", audioBlob.size, "bytes");

        // Determine file extension from URL
        let extension = "mp3";
        if (audioUrl.includes(".m4a")) extension = "m4a";
        else if (audioUrl.includes(".wav")) extension = "wav";
        else if (audioUrl.includes(".webm")) extension = "webm";
        else if (audioUrl.includes(".mp4")) extension = "mp4";

        // Check if we need to chunk the file
        if (audioBlob.size <= CHUNK_SIZE) {
          // Single chunk - process normally
          console.log("File small enough for single transcription");
          textToProcess = await transcribeChunk(audioBlob, extension, OPENAI_API_KEY, 0, 1);
        } else {
          // Need to chunk the file
          const totalChunks = Math.ceil(audioBlob.size / CHUNK_SIZE);
          console.log(`File needs chunking: ${totalChunks} chunks of ~${Math.round(CHUNK_SIZE / 1024 / 1024)}MB each`);

          const transcriptions: string[] = [];

          for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, audioBlob.size);
            const chunk = audioBlob.slice(start, end);

            // Convert chunk to proper blob with type
            const chunkBlob = new Blob([chunk], { type: audioBlob.type || `audio/${extension}` });

            const chunkText = await transcribeChunk(chunkBlob, extension, OPENAI_API_KEY, i, totalChunks);
            transcriptions.push(chunkText);

            // Small delay between chunks to avoid rate limiting
            if (i < totalChunks - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          textToProcess = transcriptions.join(" ");
          console.log("All chunks transcribed, total length:", textToProcess.length);
        }
      } catch (transcriptionError: unknown) {
        console.error("Transcription error:", transcriptionError);
        const errMsg = transcriptionError instanceof Error ? transcriptionError.message : "Unknown error";
        throw new Error(errMsg);
      }
    }

    if (!textToProcess) {
      throw new Error("Nenhum áudio ou transcrição disponível para processar");
    }

    // Process with AI to extract summary, topics and references using OpenAI
    console.log("Processing transcript with OpenAI...");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: chatModel,
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em análise de ministrações cristãs.
Sua tarefa é analisar a transcrição de uma ministração e:
1. Criar um resumo conciso (máximo 3 parágrafos)
2. Identificar os principais tópicos abordados (3-5 tópicos)
3. Extrair todas as referências bíblicas mencionadas

Responda APENAS com um JSON válido no formato:
{
  "summary": "Resumo da ministração...",
  "topics": [
    {"title": "Tópico 1", "description": "Breve descrição"},
    {"title": "Tópico 2", "description": "Breve descrição"}
  ],
  "references": ["João 3:16", "Romanos 8:28", "Salmos 23:1"]
}`,
          },
          {
            role: "user",
            content: `Analise esta ministração:\n\n${textToProcess}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 401) {
        throw new Error("Chave API inválida. Verifique as configurações de IA.");
      } else if (aiResponse.status === 429) {
        throw new Error("Limite de requisições da OpenAI excedido. Tente novamente mais tarde.");
      } else if (aiResponse.status === 402) {
        throw new Error("Créditos insuficientes na conta OpenAI.");
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
      parsedContent = {
        summary: content.substring(0, 500),
        topics: [],
        references: [],
      };
    }

    // Update sermon in database
    const { error: updateError } = await supabase
      .from("sermons")
      .update({
        summary: parsedContent.summary,
        topics: parsedContent.topics,
        bible_references: parsedContent.references,
        transcript: textToProcess,
        processed_at: new Date().toISOString(),
      })
      .eq("id", sermonId);

    if (updateError) {
      throw updateError;
    }

    console.log("Sermon processed successfully");

    return new Response(JSON.stringify({ success: true, data: parsedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error processing sermon:", error);

    // Determine if it's a validation error (400) or internal error (500)
    const isValidationError =
      error.message?.includes("IA não configurada") ||
      error.message?.includes("Nenhum áudio ou transcrição") ||
      error.message?.includes("arquivo de áudio é muito grande");

    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: isValidationError ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});