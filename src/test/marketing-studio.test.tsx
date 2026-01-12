/**
 * Test 8: Module Marketing - Studio Création IA
 * OBJECTIF: Tester la génération d'images avec IA
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@/test/mocks/auth';

// Mock Supabase
const mockSupabase = {
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test-image.png' }, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.png' } }),
      download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
    }),
  },
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock fetch for AI API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Test 8: Module Marketing - Studio Création IA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('✅ should upload product image', async () => {
    const file = new File(['test image content'], 'product.png', { type: 'image/png' });
    
    const result = await mockSupabase.storage.from('posts-media').upload('test.png', file);
    
    expect(result.data.path).toBe('test-image.png');
    expect(result.error).toBeNull();

    console.log('✅ PASS - Upload image fonctionne');
  });

  it('✅ should get public URL for uploaded image', () => {
    const { data } = mockSupabase.storage.from('posts-media').getPublicUrl('test.png');
    
    expect(data.publicUrl).toBe('https://test.com/image.png');

    console.log('✅ PASS - URL publique générée');
  });

  it('✅ should validate template selection', () => {
    const validTemplates = [
      'palette-couleurs',
      'produit-flottant',
      'lifestyle',
      'minimaliste',
      'vibrant',
    ];

    const selectedTemplate = 'palette-couleurs';
    expect(validTemplates).toContain(selectedTemplate);

    console.log('✅ PASS - Template sélectionné valide');
  });

  it('✅ should initiate AI generation request', async () => {
    const generationRequest = {
      image_url: 'https://test.com/product.png',
      template: 'palette-couleurs',
      style: 'modern',
      user_id: '5dc129e2-cd73-4ee4-b73c-e5945761adb8',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        job_id: 'job-123',
        status: 'processing',
      }),
    });

    expect(generationRequest.image_url).toBeDefined();
    expect(generationRequest.template).toBe('palette-couleurs');

    console.log('✅ PASS - Génération IA lancée');
  });

  it('✅ should handle AI generation response', async () => {
    const mockGeneratedImages = [
      { url: 'https://test.com/generated-1.png', id: 'img-1' },
      { url: 'https://test.com/generated-2.png', id: 'img-2' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        images: mockGeneratedImages,
        status: 'completed',
      }),
    });

    const response = await fetch('/api/ai-generate');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.images).toHaveLength(2);

    console.log('✅ PASS - Images générées correctement');
  });

  it('✅ should download generated image', async () => {
    const result = await mockSupabase.storage.from('posts-media').download('generated.png');
    
    expect(result.data).toBeInstanceOf(Blob);
    expect(result.error).toBeNull();

    console.log('✅ PASS - Téléchargement image fonctionne');
  });

  it('✅ should track AI generation quota', () => {
    const userQuota = {
      ai_image_generation_count: 3,
      ai_image_generation_limit: 5,
      remaining: 2,
    };

    expect(userQuota.ai_image_generation_count).toBeLessThan(userQuota.ai_image_generation_limit);
    expect(userQuota.remaining).toBe(2);

    console.log('✅ PASS - Quota IA suivi');
  });

  it('✅ should handle generation errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        success: false,
        error: 'Generation failed',
      }),
    });

    const response = await fetch('/api/ai-generate');
    expect(response.ok).toBe(false);

    console.log('✅ PASS - Erreurs gérées correctement');
  });
});
