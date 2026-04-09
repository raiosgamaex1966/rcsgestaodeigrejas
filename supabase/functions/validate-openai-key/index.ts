import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ valid: false, error: "API key is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!apiKey.startsWith("sk-")) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid API key format. Must start with 'sk-'" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test the API key by making a simple request to OpenAI
    console.log("Validating OpenAI API key...");
    
    const testResponse = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (testResponse.ok) {
      console.log("API key is valid");
      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const errorData = await testResponse.json().catch(() => ({}));
    console.error("API key validation failed:", testResponse.status, errorData);

    let errorMessage = "Invalid API key";
    if (testResponse.status === 401) {
      errorMessage = "Chave API inválida ou expirada";
    } else if (testResponse.status === 429) {
      errorMessage = "Limite de requisições excedido. Tente novamente mais tarde.";
    } else if (testResponse.status === 403) {
      errorMessage = "Chave API sem permissões necessárias";
    }

    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error validating API key:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
