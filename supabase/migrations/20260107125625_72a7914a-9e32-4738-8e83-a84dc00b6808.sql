-- Create documents bucket for OCR uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload documents
CREATE POLICY "Users can upload documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

-- Create policy for authenticated users to read their documents
CREATE POLICY "Users can read documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents');

-- Create policy for authenticated users to delete their own documents
CREATE POLICY "Users can delete their documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);