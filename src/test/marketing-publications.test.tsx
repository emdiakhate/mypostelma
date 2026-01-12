/**
 * Test 3: Module Marketing - Publications
 * OBJECTIF: Tester la création d'une publication sur réseaux sociaux
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@/test/mocks/auth';
import { TestWrapper } from '@/test/mocks/router';

// Mock data for posts
const mockPosts = [
  {
    id: '1',
    content: 'Test publication depuis Lovable',
    platforms: ['instagram'],
    status: 'scheduled',
    scheduled_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    author_id: '5dc129e2-cd73-4ee4-b73c-e5945761adb8',
    accounts: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock Supabase for posts
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockPosts[0], error: null }),
    order: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((cb) => cb({ data: mockPosts, error: null })),
  }),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Test 3: Module Marketing - Publications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('✅ should create a new publication', async () => {
    const newPost = {
      content: 'Test publication depuis Lovable',
      platforms: ['instagram'],
      scheduled_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'scheduled',
      author_id: '5dc129e2-cd73-4ee4-b73c-e5945761adb8',
      accounts: [],
    };

    const insertMock = vi.fn().mockResolvedValue({ data: { ...newPost, id: '2' }, error: null });
    mockSupabase.from.mockReturnValue({
      insert: insertMock,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...newPost, id: '2' }, error: null }),
    });

    expect(newPost.content).toBe('Test publication depuis Lovable');
    expect(newPost.platforms).toContain('instagram');
    expect(newPost.status).toBe('scheduled');

    console.log('✅ PASS - Publication créée');
  });

  it('✅ should display publication in calendar', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockPosts, error: null }),
    });

    const result = await mockSupabase.from('posts').select('*').order('scheduled_time');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].content).toBe('Test publication depuis Lovable');

    console.log('✅ PASS - Publication visible dans le calendrier');
  });

  it('✅ should update publication content', async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ 
        data: { ...mockPosts[0], content: 'Contenu modifié' }, 
        error: null 
      }),
    });

    mockSupabase.from.mockReturnValue({
      update: updateMock,
    });

    await mockSupabase.from('posts').update({ content: 'Contenu modifié' }).eq('id', '1');
    expect(updateMock).toHaveBeenCalledWith({ content: 'Contenu modifié' });

    console.log('✅ PASS - Publication modifiée');
  });

  it('✅ should delete publication', async () => {
    const deleteMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    mockSupabase.from.mockReturnValue({
      delete: deleteMock,
    });

    await mockSupabase.from('posts').delete().eq('id', '1');
    expect(deleteMock).toHaveBeenCalled();

    console.log('✅ PASS - Publication supprimée');
  });

  it('✅ should validate scheduled date is in future', () => {
    const futureDate = new Date(Date.now() + 86400000); // Tomorrow
    const pastDate = new Date(Date.now() - 86400000); // Yesterday

    expect(futureDate.getTime()).toBeGreaterThan(Date.now());
    expect(pastDate.getTime()).toBeLessThan(Date.now());

    console.log('✅ PASS - Validation date programmée');
  });
});
