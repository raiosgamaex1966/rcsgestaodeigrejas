import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'request' | 'approved' | 'rejected';
  expenseId: string;
  expenseDescription: string;
  expenseAmount: number;
  approvalLevel: string;
  requesterName?: string;
  approverName?: string;
  rejectionReason?: string;
  recipientEmail?: string;
  recipientName?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getEmailContent = (data: NotificationRequest) => {
  const amount = formatCurrency(data.expenseAmount);
  const level = data.approvalLevel === 'conselho' ? 'Conselho' : 'Tesoureiro';

  switch (data.type) {
    case 'request':
      return {
        subject: `🔔 Nova despesa aguardando aprovação: ${amount}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .amount { font-size: 32px; font-weight: bold; color: #4338ca; margin: 20px 0; }
              .detail { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4338ca; }
              .button { display: inline-block; background: #4338ca; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Nova Solicitação de Aprovação</h1>
                <p>Uma despesa precisa da sua aprovação</p>
              </div>
              <div class="content">
                <p>Olá ${data.recipientName || 'Aprovador'},</p>
                <p>Uma nova despesa foi cadastrada e requer aprovação do <strong>${level}</strong>:</p>
                
                <div class="amount">${amount}</div>
                
                <div class="detail">
                  <strong>📝 Descrição:</strong><br>
                  ${data.expenseDescription}
                </div>
                
                <div class="detail">
                  <strong>👤 Solicitado por:</strong><br>
                  ${data.requesterName || 'Não informado'}
                </div>
                
                <p>Acesse o sistema para aprovar ou rejeitar esta despesa.</p>
              </div>
              <div class="footer">
                <p>Este é um email automático do sistema financeiro da igreja.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'approved':
      return {
        subject: `✅ Despesa aprovada: ${amount}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .amount { font-size: 32px; font-weight: bold; color: #059669; margin: 20px 0; }
              .detail { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
              .badge { display: inline-block; background: #d1fae5; color: #059669; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Despesa Aprovada</h1>
                <p>Sua solicitação foi aprovada</p>
              </div>
              <div class="content">
                <p>Olá ${data.recipientName || 'Solicitante'},</p>
                <p>Ótimas notícias! Sua despesa foi <strong>aprovada</strong>:</p>
                
                <div class="amount">${amount}</div>
                
                <div class="detail">
                  <strong>📝 Descrição:</strong><br>
                  ${data.expenseDescription}
                </div>
                
                <div class="detail">
                  <strong>✅ Aprovado por:</strong><br>
                  ${data.approverName || 'Não informado'}
                </div>
                
                <p><span class="badge">Aprovado pelo ${level}</span></p>
              </div>
              <div class="footer">
                <p>Este é um email automático do sistema financeiro da igreja.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    case 'rejected':
      return {
        subject: `❌ Despesa rejeitada: ${amount}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
              .amount { font-size: 32px; font-weight: bold; color: #dc2626; margin: 20px 0; }
              .detail { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ef4444; }
              .reason { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ Despesa Rejeitada</h1>
                <p>Sua solicitação não foi aprovada</p>
              </div>
              <div class="content">
                <p>Olá ${data.recipientName || 'Solicitante'},</p>
                <p>Infelizmente sua despesa foi <strong>rejeitada</strong>:</p>
                
                <div class="amount">${amount}</div>
                
                <div class="detail">
                  <strong>📝 Descrição:</strong><br>
                  ${data.expenseDescription}
                </div>
                
                <div class="detail">
                  <strong>❌ Rejeitado por:</strong><br>
                  ${data.approverName || 'Não informado'}
                </div>
                
                ${data.rejectionReason ? `
                <div class="reason">
                  <strong>📋 Motivo da rejeição:</strong><br>
                  ${data.rejectionReason}
                </div>
                ` : ''}
                
                <p>Entre em contato com a administração para mais informações.</p>
              </div>
              <div class="footer">
                <p>Este é um email automático do sistema financeiro da igreja.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

    default:
      throw new Error('Invalid notification type');
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    
    console.log('Sending approval notification:', { 
      type: data.type, 
      expenseId: data.expenseId,
      recipientEmail: data.recipientEmail 
    });

    if (!data.recipientEmail) {
      console.log('No recipient email provided, skipping notification');
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { subject, html } = getEmailContent(data);

    const emailResponse = await resend.emails.send({
      from: "Igreja <noreply@resend.dev>",
      to: [data.recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-approval-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
