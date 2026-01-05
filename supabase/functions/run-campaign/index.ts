import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignRequest {
  campaign_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { campaign_id }: CampaignRequest = await req.json();

    if (!campaign_id) {
      throw new Error("campaign_id is required");
    }

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("crm_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .eq("user_id", user.id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found or access denied");
    }

    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      throw new Error(`Campaign cannot be run - current status: ${campaign.status}`);
    }

    // Build lead query based on targeting
    let leadsQuery = supabase
      .from("leads")
      .select("id, name, email, phone, whatsapp")
      .eq("user_id", user.id);

    // Apply targeting filters
    if (campaign.target_sector_ids && campaign.target_sector_ids.length > 0) {
      leadsQuery = leadsQuery.in("sector_id", campaign.target_sector_ids);
    }
    if (campaign.target_segment_ids && campaign.target_segment_ids.length > 0) {
      leadsQuery = leadsQuery.in("segment_id", campaign.target_segment_ids);
    }
    if (campaign.target_status && campaign.target_status.length > 0) {
      leadsQuery = leadsQuery.in("status", campaign.target_status);
    }
    if (campaign.target_cities && campaign.target_cities.length > 0) {
      leadsQuery = leadsQuery.in("city", campaign.target_cities);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      throw new Error(`Failed to fetch leads: ${leadsError.message}`);
    }

    if (!leads || leads.length === 0) {
      throw new Error("No leads match the campaign targeting criteria");
    }

    // Filter leads based on channel
    const eligibleLeads = leads.filter(lead => {
      if (campaign.channel === "email") {
        return lead.email;
      } else if (campaign.channel === "whatsapp") {
        return lead.whatsapp || lead.phone;
      } else if (campaign.channel === "both") {
        return lead.email || lead.whatsapp || lead.phone;
      }
      return false;
    });

    if (eligibleLeads.length === 0) {
      throw new Error(`No leads have valid contact info for channel: ${campaign.channel}`);
    }

    // Update campaign status to sending
    await supabase
      .from("crm_campaigns")
      .update({
        status: "sending",
        sent_at: new Date().toISOString(),
        total_leads: eligibleLeads.length,
      })
      .eq("id", campaign_id);

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process each lead
    for (const lead of eligibleLeads) {
      try {
        // Personalize message
        const personalizedMessage = campaign.message
          .replace(/\{\{name\}\}/g, lead.name || "")
          .replace(/\{\{first_name\}\}/g, lead.name?.split(" ")[0] || "");

        const personalizedSubject = campaign.subject
          ? campaign.subject
              .replace(/\{\{name\}\}/g, lead.name || "")
              .replace(/\{\{first_name\}\}/g, lead.name?.split(" ")[0] || "")
          : undefined;

        // Send based on channel
        if (campaign.channel === "email" || campaign.channel === "both") {
          if (lead.email) {
            const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
              },
              body: JSON.stringify({
                to: lead.email,
                subject: personalizedSubject || "Message from our team",
                html: personalizedMessage,
                lead_id: lead.id,
              }),
            });

            if (!emailResponse.ok) {
              throw new Error(`Email send failed: ${await emailResponse.text()}`);
            }
          }
        }

        if (campaign.channel === "whatsapp" || campaign.channel === "both") {
          const whatsappNumber = lead.whatsapp || lead.phone;
          if (whatsappNumber) {
            const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
              },
              body: JSON.stringify({
                to: whatsappNumber,
                message: personalizedMessage,
                lead_id: lead.id,
              }),
            });

            if (!whatsappResponse.ok) {
              throw new Error(`WhatsApp send failed: ${await whatsappResponse.text()}`);
            }
          }
        }

        // Record interaction
        await supabase.from("crm_lead_interactions").insert({
          lead_id: lead.id,
          user_id: user.id,
          campaign_id: campaign_id,
          type: "campaign_message",
          channel: campaign.channel,
          subject: personalizedSubject,
          content: personalizedMessage,
          status: "sent",
        });

        sentCount++;
      } catch (error: unknown) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Lead ${lead.id}: ${errorMessage}`);
        console.error(`Failed to send to lead ${lead.id}:`, error);
      }
    }

    // Update campaign with final stats
    const finalStatus = failedCount === eligibleLeads.length ? "failed" : "sent";
    await supabase
      .from("crm_campaigns")
      .update({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id,
        total_leads: eligibleLeads.length,
        sent_count: sentCount,
        failed_count: failedCount,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in run-campaign:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
