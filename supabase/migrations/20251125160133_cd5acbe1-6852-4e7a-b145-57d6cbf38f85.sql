-- Fix security warnings: Add search_path to functions

CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_connected_account_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION increment_quick_reply_usage(reply_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE quick_replies
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = reply_id;
END;
$$;

CREATE OR REPLACE FUNCTION update_connected_account_message_counts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.direction = 'incoming' THEN
        UPDATE connected_accounts
        SET messages_received = messages_received + 1,
            last_sync_at = NOW()
        WHERE id = (
            SELECT connected_account_id
            FROM conversations
            WHERE id = NEW.conversation_id
        );
    ELSIF NEW.direction = 'outgoing' THEN
        UPDATE connected_accounts
        SET messages_sent = messages_sent + 1
        WHERE id = (
            SELECT connected_account_id
            FROM conversations
            WHERE id = NEW.conversation_id
        );
    END IF;

    RETURN NEW;
END;
$$;