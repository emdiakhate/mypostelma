-- Drop and recreate all views with SECURITY INVOKER to enforce RLS policies

-- 1. competitor_comparison
DROP VIEW IF EXISTS public.competitor_comparison;
CREATE VIEW public.competitor_comparison 
WITH (security_invoker = on)
AS
SELECT c.id,
    c.name,
    c.industry,
    c.instagram_followers::integer AS instagram_followers,
    c.facebook_likes::integer AS facebook_likes,
    c.linkedin_followers::integer AS linkedin_followers,
    count(DISTINCT cp.id) AS total_posts_tracked,
    avg(cp.engagement_rate) AS avg_engagement_rate,
    c.last_analyzed_at
FROM competitors c
LEFT JOIN competitor_posts cp ON c.id = cp.competitor_id
GROUP BY c.id, c.name, c.industry, c.instagram_followers, c.facebook_likes, c.linkedin_followers, c.last_analyzed_at;

-- 2. competitor_latest_analysis
DROP VIEW IF EXISTS public.competitor_latest_analysis;
CREATE VIEW public.competitor_latest_analysis 
WITH (security_invoker = on)
AS
SELECT c.id AS competitor_id,
    c.last_analyzed_at,
    ca.analysis_cost,
    c.name,
    c.industry,
    c.instagram_url,
    c.facebook_url,
    c.linkedin_url,
    c.website_url,
    ca.positioning,
    ca.content_strategy,
    ca.tone,
    ca.strengths,
    ca.weaknesses,
    ca.opportunities_for_us,
    ca.social_media_presence,
    ca.summary
FROM competitors c
LEFT JOIN LATERAL (
    SELECT competitor_analysis.id,
        competitor_analysis.competitor_id,
        competitor_analysis.positioning,
        competitor_analysis.content_strategy,
        competitor_analysis.tone,
        competitor_analysis.target_audience,
        competitor_analysis.strengths,
        competitor_analysis.weaknesses,
        competitor_analysis.opportunities_for_us,
        competitor_analysis.social_media_presence,
        competitor_analysis.estimated_budget,
        competitor_analysis.key_differentiators,
        competitor_analysis.recommendations,
        competitor_analysis.summary,
        competitor_analysis.instagram_data,
        competitor_analysis.facebook_data,
        competitor_analysis.linkedin_data,
        competitor_analysis.website_data,
        competitor_analysis.analyzed_at,
        competitor_analysis.tokens_used,
        competitor_analysis.analysis_cost,
        competitor_analysis.version,
        competitor_analysis.twitter_data,
        competitor_analysis.tiktok_data
    FROM competitor_analysis
    WHERE competitor_analysis.competitor_id = c.id
    ORDER BY competitor_analysis.analyzed_at DESC
    LIMIT 1
) ca ON true;

-- 3. competitor_recent_activity
DROP VIEW IF EXISTS public.competitor_recent_activity;
CREATE VIEW public.competitor_recent_activity 
WITH (security_invoker = on)
AS
SELECT c.name AS competitor_name,
    cp.platform,
    cp.caption AS post_text,
    cp.post_url,
    cp.likes,
    cp.comments,
    cp.engagement_rate,
    cp.posted_at
FROM competitor_posts cp
JOIN competitors c ON cp.competitor_id = c.id
WHERE cp.posted_at >= (now() - '30 days'::interval)
ORDER BY cp.posted_at DESC;

-- 4. connected_accounts_with_stats
DROP VIEW IF EXISTS public.connected_accounts_with_stats;
CREATE VIEW public.connected_accounts_with_stats 
WITH (security_invoker = on)
AS
SELECT ca.id,
    ca.user_id,
    ca.platform,
    ca.platform_account_id,
    ca.account_name,
    ca.avatar_url,
    ca.status,
    ca.error_message,
    ca.access_token,
    ca.refresh_token,
    ca.token_expires_at,
    ca.config,
    ca.messages_received,
    ca.messages_sent,
    ca.last_sync_at,
    ca.connected_at,
    ca.updated_at,
    count(DISTINCT c.id) AS active_conversations,
    count(DISTINCT
        CASE
            WHEN c.status::text = 'unread'::text THEN c.id
            ELSE NULL::uuid
        END) AS unread_conversations
FROM connected_accounts ca
LEFT JOIN conversations c ON c.connected_account_id = ca.id
GROUP BY ca.id;

-- 5. conversations_with_last_message
DROP VIEW IF EXISTS public.conversations_with_last_message;
CREATE VIEW public.conversations_with_last_message 
WITH (security_invoker = on)
AS
SELECT c.id,
    c.user_id,
    c.connected_account_id,
    c.platform,
    c.platform_conversation_id,
    c.participant_id,
    c.participant_name,
    c.participant_username,
    c.participant_avatar_url,
    c.status,
    c.assigned_to,
    c.assigned_at,
    c.tags,
    c.notes,
    c.sentiment,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    m.text_content AS last_message_text,
    m.sent_at AS last_message_sent_at,
    m.direction AS last_message_direction,
    (SELECT count(*) FROM messages WHERE messages.conversation_id = c.id AND messages.is_read = false AND messages.direction::text = 'incoming'::text) AS unread_count
FROM conversations c
LEFT JOIN LATERAL (
    SELECT messages.text_content,
        messages.sent_at,
        messages.direction
    FROM messages
    WHERE messages.conversation_id = c.id
    ORDER BY messages.sent_at DESC
    LIMIT 1
) m ON true;

-- 6. conversations_with_teams
DROP VIEW IF EXISTS public.conversations_with_teams;
CREATE VIEW public.conversations_with_teams 
WITH (security_invoker = on)
AS
SELECT c.id,
    c.user_id,
    c.connected_account_id,
    c.platform,
    c.platform_conversation_id,
    c.participant_id,
    c.participant_name,
    c.participant_username,
    c.participant_avatar_url,
    c.status,
    c.assigned_to,
    c.assigned_at,
    c.tags,
    c.notes,
    c.sentiment,
    c.last_message_at,
    c.created_at,
    c.updated_at,
    array_agg(DISTINCT jsonb_build_object('team_id', t.id, 'team_name', t.name, 'team_color', t.color, 'auto_assigned', ct.auto_assigned, 'confidence_score', ct.confidence_score)) FILTER (WHERE t.id IS NOT NULL) AS teams
FROM conversations c
LEFT JOIN conversation_teams ct ON ct.conversation_id = c.id
LEFT JOIN teams t ON t.id = ct.team_id
GROUP BY c.id;

-- 7. crm_leads_by_sector
DROP VIEW IF EXISTS public.crm_leads_by_sector;
CREATE VIEW public.crm_leads_by_sector 
WITH (security_invoker = on)
AS
SELECT s.id AS sector_id,
    s.user_id,
    s.name AS sector_name,
    count(l.id) AS total_leads,
    count(l.id) FILTER (WHERE l.status = 'new'::lead_status) AS new_leads,
    count(l.id) FILTER (WHERE l.status = 'contacted'::lead_status) AS contacted_leads,
    count(l.id) FILTER (WHERE l.status = 'interested'::lead_status) AS interested_leads,
    count(l.id) FILTER (WHERE l.status = 'client'::lead_status) AS client_leads,
    avg(l.score) AS avg_score
FROM crm_sectors s
LEFT JOIN leads l ON l.sector_id = s.id
GROUP BY s.id, s.user_id, s.name;

-- 8. inbox_stats
DROP VIEW IF EXISTS public.inbox_stats;
CREATE VIEW public.inbox_stats 
WITH (security_invoker = on)
AS
SELECT user_id,
    count(*) FILTER (WHERE status::text = 'unread'::text) AS unread_count,
    count(*) FILTER (WHERE status::text = 'read'::text) AS read_count,
    count(*) FILTER (WHERE assigned_to IS NULL) AS unassigned_count,
    avg(EXTRACT(epoch FROM ((SELECT min(m.sent_at) FROM messages m WHERE m.conversation_id = c.id AND m.direction::text = 'outgoing'::text) - last_message_at) / 60::numeric))::integer AS avg_response_time_minutes,
    count(*) FILTER (WHERE sentiment::text = 'negative'::text) AS negative_sentiment_count
FROM conversations c
GROUP BY user_id;

-- 9. my_business_latest_analysis
DROP VIEW IF EXISTS public.my_business_latest_analysis;
CREATE VIEW public.my_business_latest_analysis 
WITH (security_invoker = on)
AS
SELECT DISTINCT ON (mb.id) mb.id,
    mb.user_id,
    mb.business_name,
    mb.industry,
    mb.description,
    mb.website_url,
    mb.instagram_url,
    mb.instagram_followers,
    mb.facebook_url,
    mb.facebook_likes,
    mb.linkedin_url,
    mb.linkedin_followers,
    mb.twitter_url,
    mb.tiktok_url,
    mb.youtube_url,
    mb.created_at,
    mb.updated_at,
    mb.last_analyzed_at,
    mba.id AS analysis_id,
    mba.analyzed_at,
    mba.context_objectives,
    mba.brand_identity,
    mba.offering_positioning,
    mba.digital_presence,
    mba.swot,
    mba.competitive_analysis,
    mba.insights_recommendations,
    mba.metadata
FROM my_business mb
LEFT JOIN my_business_analysis mba ON mb.id = mba.business_id
ORDER BY mb.id, mba.analyzed_at DESC NULLS LAST;

-- 10. teams_with_stats
DROP VIEW IF EXISTS public.teams_with_stats;
CREATE VIEW public.teams_with_stats 
WITH (security_invoker = on)
AS
SELECT t.id,
    t.user_id,
    t.name,
    t.description,
    t.color,
    t.member_count,
    t.conversation_count,
    t.created_at,
    t.updated_at,
    count(DISTINCT tm.id) AS active_members,
    count(DISTINCT ct.conversation_id) AS assigned_conversations
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.status::text = 'accepted'::text
LEFT JOIN conversation_teams ct ON ct.team_id = t.id
GROUP BY t.id;