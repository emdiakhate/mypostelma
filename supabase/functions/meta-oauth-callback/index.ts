import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const META_APP_ID = Deno.env.get("META_APP_ID");
const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface FacebookUserInfo {
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[Meta OAuth] Request body received:", JSON.stringify(body));
    
    const { code, redirect_uri, platform, user_id } = body;

    console.log(`[Meta OAuth] Processing ${platform} callback for user ${user_id}`);
    console.log("[Meta OAuth] Redirect URI:", redirect_uri);

    if (!code || !redirect_uri || !platform || !user_id) {
      console.error("[Meta OAuth] Missing parameters:", { code: !!code, redirect_uri: !!redirect_uri, platform, user_id });
      return new Response(
        JSON.stringify({ error: "Missing required parameters: code, redirect_uri, platform, user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!META_APP_ID || !META_APP_SECRET) {
      console.error("[Meta OAuth] Missing META_APP_ID or META_APP_SECRET");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Meta credentials not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${META_APP_SECRET}&code=${code}`;

    console.log("[Meta OAuth] Exchanging code for token...");
    console.log("[Meta OAuth] Redirect URI:", redirect_uri);
    console.log("[Meta OAuth] Platform:", platform);

    const tokenResponse = await fetch(tokenUrl);
    const tokenData: any = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[Meta OAuth] Token exchange failed:");
      console.error("[Meta OAuth] Status:", tokenResponse.status);
      console.error("[Meta OAuth] Response:", JSON.stringify(tokenData));

      // Provide more detailed error message
      let errorMsg = "Failed to exchange code for token";
      if (tokenData.error?.message) {
        errorMsg = tokenData.error.message;
      } else if (tokenData.error_description) {
        errorMsg = tokenData.error_description;
      }

      return new Response(
        JSON.stringify({
          error: errorMsg,
          details: tokenData,
          redirect_uri: redirect_uri,
          hint: "Vérifiez que l'URI de redirection est bien configurée dans votre application Meta Developer"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = tokenData.access_token;
    console.log("[Meta OAuth] Token obtained successfully");

    // Get long-lived token (60 days instead of ~2 hours)
    const longLivedTokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${accessToken}`;
    
    const longLivedResponse = await fetch(longLivedTokenUrl);
    const longLivedData = await longLivedResponse.json();
    
    const finalToken = longLivedData.access_token || accessToken;
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || 5184000; // Default 60 days
    
    console.log("[Meta OAuth] Long-lived token obtained, expires in:", expiresIn, "seconds");

    // Get user info from Facebook
    const userInfoUrl = `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${finalToken}`;
    const userInfoResponse = await fetch(userInfoUrl);
    const userInfo: FacebookUserInfo = await userInfoResponse.json();

    console.log("[Meta OAuth] User info:", { id: userInfo.id, name: userInfo.name });

    let accountData: any = {
      platform: platform,
      platform_account_id: userInfo.id,
      account_name: userInfo.name,
      access_token: finalToken,
      avatar_url: userInfo.picture?.data?.url,
      status: "active",
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      user_id: user_id,
    };

    // For Instagram, we need to get the Instagram Business Account
    if (platform === "instagram") {
      console.log("[Meta OAuth] Fetching Instagram Business Account...");
      
      // Get Facebook Pages with Instagram Business Accounts
      const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${finalToken}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      console.log("[Meta OAuth] Pages response:", JSON.stringify(pagesData));

      const pages: FacebookPage[] = pagesData.data || [];
      const pageWithInstagram = pages.find((p) => p.instagram_business_account);

      if (pageWithInstagram && pageWithInstagram.instagram_business_account) {
        // Get Instagram account details
        const igAccountId = pageWithInstagram.instagram_business_account.id;
        const igUrl = `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,username,name,profile_picture_url&access_token=${finalToken}`;
        const igResponse = await fetch(igUrl);
        const igData: InstagramAccount = await igResponse.json();

        console.log("[Meta OAuth] Instagram account:", igData);

        accountData = {
          ...accountData,
          platform: "instagram",
          platform_account_id: igData.id,
          account_name: igData.username || igData.name,
          avatar_url: igData.profile_picture_url,
          config: {
            facebook_page_id: pageWithInstagram.id,
            facebook_page_name: pageWithInstagram.name,
            instagram_account_id: igData.id,
          },
        };
      } else {
        console.log("[Meta OAuth] No Instagram Business Account found");
        console.log("[Meta OAuth] Available pages:", pages.map(p => ({ id: p.id, name: p.name, hasInstagram: !!p.instagram_business_account })));

        return new Response(
          JSON.stringify({
            error: "Compte Instagram Business non trouvé",
            message: "Aucun compte Instagram Business n'est lié à vos pages Facebook.",
            instructions: [
              "1. Convertissez votre Instagram en compte Business (Paramètres → Compte → Passer à un compte professionnel)",
              "2. Liez-le à une page Facebook (Paramètres → Compte → Page liée)",
              "3. Vérifiez que vous êtes administrateur de la page Facebook",
              "4. Réessayez la connexion"
            ],
            hint: "Vous devez d'abord avoir un compte Instagram Business connecté à une Page Facebook."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For Facebook, get the pages
    if (platform === "facebook") {
      console.log("[Meta OAuth] Fetching Facebook Pages...");
      
      const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${finalToken}`;
      const pagesResponse = await fetch(pagesUrl);
      const pagesData = await pagesResponse.json();

      console.log("[Meta OAuth] Pages response:", JSON.stringify(pagesData));

      const pages: FacebookPage[] = pagesData.data || [];
      
      // IMPORTANT: Si aucune page n'est trouvée, retourner une erreur explicative
      if (pages.length === 0) {
        console.log("[Meta OAuth] No Facebook pages found for user");
        return new Response(
          JSON.stringify({
            error: "Aucune page Facebook trouvée",
            message: "Vous devez être administrateur d'au moins une page Facebook pour publier.",
            instructions: [
              "1. Créez une page Facebook ou demandez à être admin d'une page existante",
              "2. Assurez-vous que votre app Meta a les permissions pages_manage_posts",
              "3. Lors de la connexion, autorisez l'accès à vos pages",
              "4. Réessayez la connexion"
            ],
            hint: "L'API Meta nécessite une page Facebook pour publier du contenu."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      accountData.config = {
        pages: pages.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      };

      // Use the first page as the primary account with PAGE ACCESS TOKEN
      accountData.account_name = pages[0].name;
      accountData.platform_account_id = pages[0].id;
      // CRITICAL: Store the PAGE access token (not user token) - required for publishing
      accountData.access_token = pages[0].access_token;
      
      console.log("[Meta OAuth] Using page:", pages[0].name, "with ID:", pages[0].id);
      console.log("[Meta OAuth] Page access token obtained:", !!pages[0].access_token);
    }

    // Save to database
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check if account already exists
    const { data: existingAccount } = await supabase
      .from("connected_accounts")
      .select("id")
      .eq("user_id", user_id)
      .eq("platform", platform)
      .single();

    let result;
    if (existingAccount) {
      // Update existing account
      result = await supabase
        .from("connected_accounts")
        .update({
          ...accountData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAccount.id)
        .select()
        .single();
      console.log("[Meta OAuth] Updated existing account");
    } else {
      // Insert new account
      result = await supabase
        .from("connected_accounts")
        .insert(accountData)
        .select()
        .single();
      console.log("[Meta OAuth] Created new account");
    }

    if (result.error) {
      console.error("[Meta OAuth] Database error:", result.error);
      return new Response(
        JSON.stringify({ error: "Failed to save account", details: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Meta OAuth] Account saved successfully:", result.data.id);

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          id: result.data.id,
          platform: result.data.platform,
          account_name: result.data.account_name,
          avatar_url: result.data.avatar_url,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Meta OAuth] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
