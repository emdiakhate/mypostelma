-- Table communication_logs pour l'historique des communications
CREATE TABLE public.communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'sms')),
  recipient TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'read')),
  provider_response JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own communication logs"
ON public.communication_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own communication logs"
ON public.communication_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own communication logs"
ON public.communication_logs FOR UPDATE
USING (auth.uid() = user_id);

-- Index for fast queries
CREATE INDEX idx_communication_logs_lead_id ON public.communication_logs(lead_id);
CREATE INDEX idx_communication_logs_user_id ON public.communication_logs(user_id);
CREATE INDEX idx_communication_logs_created_at ON public.communication_logs(created_at DESC);

-- Table user_templates pour les templates de messages personnalisés
CREATE TABLE public.user_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'sms')),
  category TEXT NOT NULL DEFAULT 'contact',
  subject TEXT,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own templates"
ON public.user_templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
ON public.user_templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.user_templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.user_templates FOR DELETE
USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_templates_user_id ON public.user_templates(user_id);
CREATE INDEX idx_user_templates_channel ON public.user_templates(channel);

-- Storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('email-attachments', 'email-attachments', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for email-attachments bucket
CREATE POLICY "Users can upload their own email attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'email-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own email attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own email attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'email-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);