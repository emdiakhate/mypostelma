/**
 * Helpers pour servir des images depuis le stockage (logos/signatures)
 * même si le bucket n'est pas public (URL signée).
 */

import { supabase } from '@/integrations/supabase/client';

const getPathFromStorageUrl = (url: string, bucket: string): string | null => {
  // URLs typiques:
  // - .../storage/v1/object/public/logos/<path>
  // - .../storage/v1/object/sign/logos/<path>?token=...
  const marker = `/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;

  const after = url.substring(idx + marker.length);
  const clean = after.split('?')[0];
  return clean || null;
};

export async function getSignedStorageUrlFromPublicUrl(
  url: string | undefined,
  bucket: string,
  expiresInSeconds = 60 * 60
): Promise<string | undefined> {
  if (!url) return undefined;

  // Si ce n'est pas une URL de notre storage, on la laisse telle quelle.
  const path = getPathFromStorageUrl(url, bucket);
  if (!path) return url;

  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) return url;
    return data.signedUrl;
  } catch {
    return url;
  }
}
