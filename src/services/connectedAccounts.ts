/**
 * Service for managing connected accounts (Gmail, Outlook, Telegram, WhatsApp)
 */

import { supabase } from '@/lib/supabase';
import type {
  ConnectedAccount,
  ConnectedAccountWithStats,
  Platform,
  ConnectGmailPayload,
  ConnectOutlookPayload,
  ConnectTelegramPayload,
  ConnectWhatsAppTwilioPayload,
} from '@/types/inbox';

// =====================================================
// GET CONNECTED ACCOUNTS
// =====================================================

export async function getConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('connected_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConnectedAccountsWithStats(
  userId: string
): Promise<ConnectedAccountWithStats[]> {
  const { data, error } = await supabase
    .from('connected_accounts_with_stats')
    .select('*')
    .eq('user_id', userId)
    .order('connected_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConnectedAccountById(
  accountId: string
): Promise<ConnectedAccount | null> {
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error) throw error;
  return data;
}

export async function getConnectedAccountByPlatform(
  userId: string,
  platform: Platform,
  platformAccountId: string
): Promise<ConnectedAccount | null> {
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('platform_account_id', platformAccountId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

// =====================================================
// CONNECT ACCOUNTS
// =====================================================

export async function connectGmail(
  userId: string,
  payload: ConnectGmailPayload
): Promise<ConnectedAccount> {
  // Call Edge Function to exchange code for tokens
  const { data: authData, error: authError } = await supabase.functions.invoke('connect-gmail', {
    body: payload,
  });

  if (authError) throw authError;

  const { email, access_token, refresh_token, expires_at } = authData;

  // Store in database
  const { data, error } = await supabase
    .from('connected_accounts')
    .insert({
      user_id: userId,
      platform: 'gmail',
      platform_account_id: email,
      account_name: email,
      status: 'active',
      access_token,
      refresh_token,
      token_expires_at: expires_at,
      config: { email },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function connectOutlook(
  userId: string,
  payload: ConnectOutlookPayload
): Promise<ConnectedAccount> {
  // Call Edge Function to exchange code for tokens
  const { data: authData, error: authError } = await supabase.functions.invoke(
    'connect-outlook',
    {
      body: payload,
    }
  );

  if (authError) throw authError;

  const { email, access_token, refresh_token, expires_at } = authData;

  // Store in database
  const { data, error } = await supabase
    .from('connected_accounts')
    .insert({
      user_id: userId,
      platform: 'outlook',
      platform_account_id: email,
      account_name: email,
      status: 'active',
      access_token,
      refresh_token,
      token_expires_at: expires_at,
      config: { email },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function connectTelegram(
  userId: string,
  payload: ConnectTelegramPayload
): Promise<ConnectedAccount> {
  // Call Edge Function to validate bot token and set webhook
  const { data: botData, error: botError } = await supabase.functions.invoke('connect-telegram', {
    body: payload,
  });

  if (botError) throw botError;

  const { bot_username, bot_id, webhook_url } = botData;

  // Store in database
  const { data, error } = await supabase
    .from('connected_accounts')
    .insert({
      user_id: userId,
      platform: 'telegram',
      platform_account_id: bot_id.toString(),
      account_name: `@${bot_username}`,
      status: 'active',
      config: {
        bot_token: payload.bot_token,
        bot_username,
        webhook_url,
      },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function connectWhatsAppTwilio(
  userId: string,
  payload: ConnectWhatsAppTwilioPayload
): Promise<ConnectedAccount> {
  // Call Edge Function to validate Twilio credentials and set webhook
  const { data: twilioData, error: twilioError } = await supabase.functions.invoke(
    'connect-whatsapp-twilio',
    {
      body: payload,
    }
  );

  if (twilioError) throw twilioError;

  const { webhook_url } = twilioData;

  // Store in database
  const { data, error } = await supabase
    .from('connected_accounts')
    .insert({
      user_id: userId,
      platform: 'whatsapp_twilio',
      platform_account_id: payload.phone_number,
      account_name: payload.phone_number,
      status: 'active',
      config: {
        account_sid: payload.account_sid,
        auth_token: payload.auth_token,
        phone_number: payload.phone_number,
        whatsapp_number: `whatsapp:${payload.phone_number}`,
        webhook_url,
      },
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// UPDATE ACCOUNT
// =====================================================

export async function updateConnectedAccount(
  accountId: string,
  updates: Partial<Omit<ConnectedAccount, 'id' | 'user_id' | 'connected_at'>>
): Promise<ConnectedAccount> {
  const { data, error } = await supabase
    .from('connected_accounts')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAccountStatus(
  accountId: string,
  status: 'active' | 'disconnected' | 'error',
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('connected_accounts')
    .update({
      status,
      error_message: errorMessage || null,
    })
    .eq('id', accountId);

  if (error) throw error;
}

// =====================================================
// DISCONNECT ACCOUNT
// =====================================================

export async function disconnectAccount(accountId: string): Promise<void> {
  // First, get the account to know which platform
  const account = await getConnectedAccountById(accountId);
  if (!account) throw new Error('Account not found');

  // Call Edge Function to revoke tokens/webhooks
  await supabase.functions.invoke('disconnect-account', {
    body: { account_id: accountId, platform: account.platform },
  });

  // Delete from database (cascade will handle related conversations/messages)
  const { error } = await supabase.from('connected_accounts').delete().eq('id', accountId);

  if (error) throw error;
}

// =====================================================
// REFRESH TOKENS (for OAuth platforms)
// =====================================================

export async function refreshAccountToken(accountId: string): Promise<ConnectedAccount> {
  const account = await getConnectedAccountById(accountId);
  if (!account) throw new Error('Account not found');

  if (!['gmail', 'outlook'].includes(account.platform)) {
    throw new Error('Token refresh only available for Gmail and Outlook');
  }

  // Call Edge Function to refresh token
  const { data: tokenData, error: tokenError } = await supabase.functions.invoke('refresh-token', {
    body: {
      platform: account.platform,
      refresh_token: account.refresh_token,
    },
  });

  if (tokenError) throw tokenError;

  const { access_token, expires_at } = tokenData;

  // Update in database
  return await updateConnectedAccount(accountId, {
    access_token,
    token_expires_at: expires_at,
    status: 'active',
    error_message: null,
  });
}

// =====================================================
// SYNC MESSAGES (pull messages from platform)
// =====================================================

export async function syncAccountMessages(accountId: string): Promise<{ synced: number }> {
  const account = await getConnectedAccountById(accountId);
  if (!account) throw new Error('Account not found');

  // Call Edge Function to pull messages
  const { data, error } = await supabase.functions.invoke('sync-messages', {
    body: { account_id: accountId },
  });

  if (error) throw error;

  return data;
}

// =====================================================
// TEST CONNECTION
// =====================================================

export async function testConnection(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const account = await getConnectedAccountById(accountId);
    if (!account) return { success: false, error: 'Account not found' };

    // Call Edge Function to test connection
    const { data, error } = await supabase.functions.invoke('test-connection', {
      body: { account_id: accountId },
    });

    if (error) {
      await updateAccountStatus(accountId, 'error', error.message);
      return { success: false, error: error.message };
    }

    await updateAccountStatus(accountId, 'active');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
