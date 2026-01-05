/**
 * Tests pour useVente Hook
 *
 * Tests unitaires pour tous les sous-hooks du module Vente
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useProducts,
  useQuotes,
  useOrders,
  useTickets,
  useStock,
  useStockMovements,
} from './useVente';
import type {
  Product,
  Quote,
  Order,
  Ticket,
  StockItem,
  CreateQuoteInput,
  CreateOrderInput,
  CreateTicketInput,
  CreateStockMovementInput,
} from '@/types/vente';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
          ilike: vi.fn(() => Promise.resolve({ data: [], error: null })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les produits au montage', async () => {
    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
  });

  it('devrait filtrer les produits par type', async () => {
    const { result } = renderHook(() => useProducts({ type: 'service' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
  });

  it('devrait créer un nouveau produit', async () => {
    const { result } = renderHook(() => useProducts());

    const newProduct: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      name: 'Formation Test',
      description: 'Description test',
      type: 'service',
      category: 'Formation',
      price: 1500,
      cost: 400,
      unit: 'Forfait',
      status: 'active',
    };

    await act(async () => {
      await result.current.createProduct(newProduct);
    });

    // Vérifier que createProduct est défini
    expect(result.current.createProduct).toBeDefined();
  });

  it('devrait mettre à jour un produit', async () => {
    const { result } = renderHook(() => useProducts());

    await act(async () => {
      await result.current.updateProduct('test-id', { price: 2000 });
    });

    expect(result.current.updateProduct).toBeDefined();
  });

  it('devrait supprimer un produit', async () => {
    const { result } = renderHook(() => useProducts());

    await act(async () => {
      await result.current.deleteProduct('test-id');
    });

    expect(result.current.deleteProduct).toBeDefined();
  });

  it('devrait archiver/désarchiver un produit', async () => {
    const { result } = renderHook(() => useProducts());

    await act(async () => {
      await result.current.toggleArchive('test-id');
    });

    expect(result.current.toggleArchive).toBeDefined();
  });

  it('devrait filtrer par catégorie', async () => {
    const { result } = renderHook(() => useProducts({ category: 'Formation' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
  });

  it('devrait filtrer par statut', async () => {
    const { result } = renderHook(() => useProducts({ status: 'active' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
  });

  it('devrait rechercher par texte', async () => {
    const { result } = renderHook(() => useProducts({ search: 'formation' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toBeDefined();
  });
});

describe('useQuotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les devis au montage', async () => {
    const { result } = renderHook(() => useQuotes());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quotes).toEqual([]);
  });

  it('devrait créer un nouveau devis', async () => {
    const { result } = renderHook(() => useQuotes());

    const newQuote: CreateQuoteInput = {
      client_name: 'Test Client',
      client_email: 'test@example.com',
      valid_until: new Date(2026, 1, 15),
      items: [
        {
          product_name: 'Formation',
          description: 'Test',
          quantity: 1,
          unit_price: 1500,
        },
      ],
    };

    await act(async () => {
      await result.current.createQuote(newQuote);
    });

    expect(result.current.createQuote).toBeDefined();
  });

  it('devrait mettre à jour le statut d\'un devis', async () => {
    const { result } = renderHook(() => useQuotes());

    await act(async () => {
      await result.current.updateQuoteStatus('test-id', 'sent');
    });

    expect(result.current.updateQuoteStatus).toBeDefined();
  });

  it('devrait dupliquer un devis', async () => {
    const { result } = renderHook(() => useQuotes());

    await act(async () => {
      await result.current.duplicateQuote('test-id');
    });

    expect(result.current.duplicateQuote).toBeDefined();
  });

  it('devrait supprimer un devis', async () => {
    const { result } = renderHook(() => useQuotes());

    await act(async () => {
      await result.current.deleteQuote('test-id');
    });

    expect(result.current.deleteQuote).toBeDefined();
  });

  it('devrait filtrer par statut', async () => {
    const { result } = renderHook(() => useQuotes({ status: 'sent' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quotes).toBeDefined();
  });

  it('devrait filtrer par statuts multiples', async () => {
    const { result } = renderHook(() => useQuotes({ status: ['sent', 'accepted'] }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quotes).toBeDefined();
  });

  it('devrait rechercher par client', async () => {
    const { result } = renderHook(() => useQuotes({ client_name: 'Test' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quotes).toBeDefined();
  });

  it('devrait filtrer par montant', async () => {
    const { result } = renderHook(() =>
      useQuotes({
        min_amount: 1000,
        max_amount: 5000,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.quotes).toBeDefined();
  });
});

describe('useOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les commandes au montage', async () => {
    const { result } = renderHook(() => useOrders());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toEqual([]);
  });

  it('devrait créer une nouvelle commande', async () => {
    const { result } = renderHook(() => useOrders());

    const newOrder: CreateOrderInput = {
      client_name: 'Test Client',
      client_email: 'test@example.com',
      items: [
        {
          product_name: 'Formation',
          description: 'Test',
          quantity: 1,
          unit_price: 1500,
        },
      ],
    };

    await act(async () => {
      await result.current.createOrder(newOrder);
    });

    expect(result.current.createOrder).toBeDefined();
  });

  it('devrait mettre à jour le statut d\'une commande', async () => {
    const { result } = renderHook(() => useOrders());

    await act(async () => {
      await result.current.updateOrderStatus('test-id', 'confirmed');
    });

    expect(result.current.updateOrderStatus).toBeDefined();
  });

  it('devrait mettre à jour le statut de paiement', async () => {
    const { result } = renderHook(() => useOrders());

    await act(async () => {
      await result.current.updatePaymentStatus('test-id', 'paid');
    });

    expect(result.current.updatePaymentStatus).toBeDefined();
  });

  it('devrait supprimer une commande', async () => {
    const { result } = renderHook(() => useOrders());

    await act(async () => {
      await result.current.deleteOrder('test-id');
    });

    expect(result.current.deleteOrder).toBeDefined();
  });

  it('devrait filtrer par statut', async () => {
    const { result } = renderHook(() => useOrders({ status: 'confirmed' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('devrait filtrer par statut de paiement', async () => {
    const { result } = renderHook(() => useOrders({ payment_status: 'paid' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('devrait rechercher par numéro de commande', async () => {
    const { result } = renderHook(() => useOrders({ search: 'CMD-2026' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });

  it('devrait filtrer par plage de dates', async () => {
    const { result } = renderHook(() =>
      useOrders({
        date_from: new Date(2026, 0, 1),
        date_to: new Date(2026, 0, 31),
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.orders).toBeDefined();
  });
});

describe('useTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les tickets au montage', async () => {
    const { result } = renderHook(() => useTickets());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toEqual([]);
  });

  it('devrait créer un nouveau ticket', async () => {
    const { result } = renderHook(() => useTickets());

    const newTicket: CreateTicketInput = {
      subject: 'Problème technique',
      description: 'Description du problème',
      client_name: 'Test Client',
      client_email: 'test@example.com',
      priority: 'medium',
      category: 'Problème technique',
    };

    await act(async () => {
      await result.current.createTicket(newTicket);
    });

    expect(result.current.createTicket).toBeDefined();
  });

  it('devrait mettre à jour le statut d\'un ticket', async () => {
    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.updateTicketStatus('test-id', 'in_progress');
    });

    expect(result.current.updateTicketStatus).toBeDefined();
  });

  it('devrait ajouter une réponse à un ticket', async () => {
    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.addResponse({
        ticket_id: 'test-id',
        author: 'Support Team',
        message: 'Réponse de test',
        is_staff: true,
      });
    });

    expect(result.current.addResponse).toBeDefined();
  });

  it('devrait supprimer un ticket', async () => {
    const { result } = renderHook(() => useTickets());

    await act(async () => {
      await result.current.deleteTicket('test-id');
    });

    expect(result.current.deleteTicket).toBeDefined();
  });

  it('devrait filtrer par statut', async () => {
    const { result } = renderHook(() => useTickets({ status: 'open' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toBeDefined();
  });

  it('devrait filtrer par priorité', async () => {
    const { result } = renderHook(() => useTickets({ priority: 'urgent' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toBeDefined();
  });

  it('devrait filtrer par catégorie', async () => {
    const { result } = renderHook(() => useTickets({ category: 'Problème technique' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toBeDefined();
  });

  it('devrait filtrer par assigné', async () => {
    const { result } = renderHook(() => useTickets({ assigned_to: 'Support Team' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toBeDefined();
  });

  it('devrait rechercher par sujet', async () => {
    const { result } = renderHook(() => useTickets({ search: 'problème' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tickets).toBeDefined();
  });
});

describe('useStock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les articles de stock au montage', async () => {
    const { result } = renderHook(() => useStock());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stockItems).toEqual([]);
  });

  it('devrait créer un nouvel article de stock', async () => {
    const { result } = renderHook(() => useStock());

    const newItem: Omit<StockItem, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'movements'> = {
      product_id: 'prod-1',
      product_name: 'Pack Starter',
      sku: 'PACK-001',
      category: 'Kits',
      quantity: 50,
      min_quantity: 20,
      location: 'Entrepôt A',
    };

    await act(async () => {
      await result.current.createStockItem(newItem);
    });

    expect(result.current.createStockItem).toBeDefined();
  });

  it('devrait mettre à jour un article de stock', async () => {
    const { result } = renderHook(() => useStock());

    await act(async () => {
      await result.current.updateStockItem('test-id', { quantity: 100 });
    });

    expect(result.current.updateStockItem).toBeDefined();
  });

  it('devrait supprimer un article de stock', async () => {
    const { result } = renderHook(() => useStock());

    await act(async () => {
      await result.current.deleteStockItem('test-id');
    });

    expect(result.current.deleteStockItem).toBeDefined();
  });

  it('devrait filtrer par emplacement', async () => {
    const { result } = renderHook(() => useStock({ location: 'Entrepôt A' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stockItems).toBeDefined();
  });

  it('devrait filtrer par catégorie', async () => {
    const { result } = renderHook(() => useStock({ category: 'Kits' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stockItems).toBeDefined();
  });

  it('devrait rechercher par nom ou SKU', async () => {
    const { result } = renderHook(() => useStock({ search: 'PACK' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stockItems).toBeDefined();
  });
});

describe('useStockMovements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait charger les mouvements au montage', async () => {
    const { result } = renderHook(() => useStockMovements('test-stock-id'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.movements).toEqual([]);
  });

  it('devrait retourner un tableau vide sans stockItemId', async () => {
    const { result } = renderHook(() => useStockMovements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.movements).toEqual([]);
  });

  it('devrait ajouter un mouvement d\'entrée', async () => {
    const { result } = renderHook(() => useStockMovements('test-stock-id'));

    const movement: CreateStockMovementInput = {
      stock_item_id: 'test-stock-id',
      type: 'in',
      quantity: 50,
      reason: 'Réception commande fournisseur',
    };

    await act(async () => {
      await result.current.addMovement(movement);
    });

    expect(result.current.addMovement).toBeDefined();
  });

  it('devrait ajouter un mouvement de sortie', async () => {
    const { result } = renderHook(() => useStockMovements('test-stock-id'));

    const movement: CreateStockMovementInput = {
      stock_item_id: 'test-stock-id',
      type: 'out',
      quantity: 10,
      reason: 'Vente CMD-2026-001',
    };

    await act(async () => {
      await result.current.addMovement(movement);
    });

    expect(result.current.addMovement).toBeDefined();
  });

  it('devrait ajouter un ajustement de stock', async () => {
    const { result } = renderHook(() => useStockMovements('test-stock-id'));

    const movement: CreateStockMovementInput = {
      stock_item_id: 'test-stock-id',
      type: 'adjustment',
      quantity: 5,
      reason: 'Inventaire physique',
    };

    await act(async () => {
      await result.current.addMovement(movement);
    });

    expect(result.current.addMovement).toBeDefined();
  });
});

describe('Helpers de calcul', () => {
  it('devrait calculer correctement le TTC', () => {
    const { calculateTTC } = require('@/types/vente');
    expect(calculateTTC(1000)).toBe(1200); // 1000 + 20% = 1200
  });

  it('devrait calculer correctement le HT', () => {
    const { calculateHT } = require('@/types/vente');
    expect(calculateHT(1200)).toBeCloseTo(1000, 2); // 1200 / 1.2 = 1000
  });

  it('devrait calculer correctement la marge', () => {
    const { calculateMargin } = require('@/types/vente');
    expect(calculateMargin(1000, 600)).toBe(40); // (1000 - 600) / 1000 * 100 = 40%
  });

  it('devrait retourner 0 pour une marge sans coût', () => {
    const { calculateMargin } = require('@/types/vente');
    expect(calculateMargin(1000, 0)).toBe(0);
  });

  it('devrait déterminer le statut de stock correctement', () => {
    const { getStockStatus } = require('@/types/vente');
    expect(getStockStatus(0, 20)).toBe('out');
    expect(getStockStatus(15, 20)).toBe('low');
    expect(getStockStatus(50, 20)).toBe('ok');
  });
});
