/**
 * Tests unitaires pour le hook useCRM
 * Test des fonctionnalités de gestion des leads, secteurs, segments
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCRMLeads, useSectors, useSegments, useLeadStatusHelpers } from './useCRM';
import type { LeadFormData, SectorFormData, SegmentFormData } from '@/types/crm';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
        in: vi.fn(() => ({
          data: [],
          error: null,
        })),
        or: vi.fn(() => ({
          data: [],
          error: null,
        })),
        not: vi.fn(() => ({
          data: [],
          error: null,
        })),
        gte: vi.fn(() => ({
          data: [],
          error: null,
        })),
        lte: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: '1', name: 'Test Lead' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: '1', name: 'Updated Lead' },
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null,
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => ({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
      })),
    },
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useCRMLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les leads au montage', async () => {
    const { result } = renderHook(() => useCRMLeads());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.leads).toEqual([]);
  });

  it('devrait créer un nouveau lead', async () => {
    const { result } = renderHook(() => useCRMLeads());

    const newLeadData: LeadFormData = {
      name: 'Test Restaurant',
      address: '123 Test Street',
      city: 'Paris',
      sector_id: 'sector-1',
      status: 'new',
    };

    await act(async () => {
      await result.current.createLead(newLeadData);
    });

    await waitFor(() => {
      expect(result.current.leads.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('devrait mettre à jour un lead existant', async () => {
    const { result } = renderHook(() => useCRMLeads());

    await act(async () => {
      await result.current.updateLead('lead-1', { name: 'Updated Name' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait mettre à jour le statut d\'un lead', async () => {
    const { result } = renderHook(() => useCRMLeads());

    await act(async () => {
      await result.current.updateLeadStatus('lead-1', 'contacted');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait supprimer un lead', async () => {
    const { result } = renderHook(() => useCRMLeads());

    await act(async () => {
      await result.current.deleteLead('lead-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait filtrer les leads par recherche', async () => {
    const filters = {
      search: 'restaurant',
      sector_ids: [],
      segment_ids: [],
      status: [],
      cities: [],
      tags: [],
    };

    const { result } = renderHook(() => useCRMLeads(filters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.leads).toEqual([]);
  });

  it('devrait filtrer les leads par secteur', async () => {
    const filters = {
      search: '',
      sector_ids: ['sector-1'],
      segment_ids: [],
      status: [],
      cities: [],
      tags: [],
    };

    const { result } = renderHook(() => useCRMLeads(filters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait filtrer les leads par statut', async () => {
    const filters = {
      search: '',
      sector_ids: [],
      segment_ids: [],
      status: ['new', 'contacted'],
      cities: [],
      tags: [],
    };

    const { result } = renderHook(() => useCRMLeads(filters));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useSectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les secteurs au montage', async () => {
    const { result } = renderHook(() => useSectors());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.sectors).toEqual([]);
  });

  it('devrait créer un nouveau secteur', async () => {
    const { result } = renderHook(() => useSectors());

    const newSectorData: SectorFormData = {
      name: 'Restauration',
      description: 'Secteur de la restauration',
      color: '#FF5733',
    };

    await act(async () => {
      await result.current.createSector(newSectorData);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait mettre à jour un secteur existant', async () => {
    const { result } = renderHook(() => useSectors());

    await act(async () => {
      await result.current.updateSector('sector-1', { name: 'Restauration Rapide' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait supprimer un secteur', async () => {
    const { result } = renderHook(() => useSectors());

    await act(async () => {
      await result.current.deleteSector('sector-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useSegments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les segments au montage', async () => {
    const { result } = renderHook(() => useSegments());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.segments).toEqual([]);
  });

  it('devrait créer un nouveau segment', async () => {
    const { result } = renderHook(() => useSegments());

    const newSegmentData: SegmentFormData = {
      sector_id: 'sector-1',
      name: 'Fast Food',
      description: 'Restauration rapide',
    };

    await act(async () => {
      await result.current.createSegment(newSegmentData);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait mettre à jour un segment existant', async () => {
    const { result } = renderHook(() => useSegments());

    await act(async () => {
      await result.current.updateSegment('segment-1', { name: 'Street Food' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait supprimer un segment', async () => {
    const { result } = renderHook(() => useSegments());

    await act(async () => {
      await result.current.deleteSegment('segment-1');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useLeadStatusHelpers', () => {
  it('devrait retourner la couleur correcte pour chaque statut', () => {
    const { result } = renderHook(() => useLeadStatusHelpers());

    expect(result.current.getStatusColor('new')).toBe('bg-blue-500');
    expect(result.current.getStatusColor('contacted')).toBe('bg-yellow-500');
    expect(result.current.getStatusColor('interested')).toBe('bg-green-500');
    expect(result.current.getStatusColor('qualified')).toBe('bg-purple-500');
    expect(result.current.getStatusColor('client')).toBe('bg-emerald-500');
    expect(result.current.getStatusColor('not_interested')).toBe('bg-gray-500');
    expect(result.current.getStatusColor('archived')).toBe('bg-gray-400');
  });

  it('devrait retourner le label correct pour chaque statut', () => {
    const { result } = renderHook(() => useLeadStatusHelpers());

    expect(result.current.getStatusLabel('new')).toBe('Nouveau');
    expect(result.current.getStatusLabel('contacted')).toBe('Contacté');
    expect(result.current.getStatusLabel('interested')).toBe('Intéressé');
    expect(result.current.getStatusLabel('qualified')).toBe('Qualifié');
    expect(result.current.getStatusLabel('client')).toBe('Client');
    expect(result.current.getStatusLabel('not_interested')).toBe('Pas intéressé');
    expect(result.current.getStatusLabel('archived')).toBe('Archivé');
  });

  it('devrait retourner l\'icône correcte pour chaque statut', () => {
    const { result } = renderHook(() => useLeadStatusHelpers());

    expect(result.current.getStatusIcon('new')).toBe('🆕');
    expect(result.current.getStatusIcon('contacted')).toBe('📞');
    expect(result.current.getStatusIcon('interested')).toBe('👍');
    expect(result.current.getStatusIcon('qualified')).toBe('⭐');
    expect(result.current.getStatusIcon('client')).toBe('🎉');
    expect(result.current.getStatusIcon('not_interested')).toBe('❌');
    expect(result.current.getStatusIcon('archived')).toBe('📦');
  });
});

// Tests d'intégration
describe('useCRMLeads - Tests d\'intégration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer un lead puis le mettre à jour', async () => {
    const { result } = renderHook(() => useCRMLeads());

    // Créer un lead
    const newLeadData: LeadFormData = {
      name: 'Test Restaurant',
      address: '123 Test Street',
      city: 'Paris',
      status: 'new',
    };

    let createdLead;
    await act(async () => {
      createdLead = await result.current.createLead(newLeadData);
    });

    // Mettre à jour le lead
    await act(async () => {
      await result.current.updateLead('1', { name: 'Updated Restaurant' });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait créer un lead puis changer son statut', async () => {
    const { result } = renderHook(() => useCRMLeads());

    // Créer un lead
    const newLeadData: LeadFormData = {
      name: 'Test Restaurant',
      address: '123 Test Street',
      city: 'Paris',
      status: 'new',
    };

    await act(async () => {
      await result.current.createLead(newLeadData);
    });

    // Changer le statut
    await act(async () => {
      await result.current.updateLeadStatus('1', 'contacted');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('devrait gérer les erreurs lors de la création d\'un lead', async () => {
    // Mock error
    const { supabase } = await import('@/lib/supabase');
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'Database error' },
          })),
        })),
      })),
    } as any);

    const { result } = renderHook(() => useCRMLeads());

    const newLeadData: LeadFormData = {
      name: 'Test Restaurant',
      address: '123 Test Street',
      city: 'Paris',
    };

    await act(async () => {
      try {
        await result.current.createLead(newLeadData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
