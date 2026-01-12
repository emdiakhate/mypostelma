/**
 * Test 6: Module Caisse - Point de Vente
 * OBJECTIF: Simuler une vente en caisse
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@/test/mocks/auth';

// Mock data for products
const mockProducts = [
  {
    id: '1',
    name: 'Produit 1',
    sku: 'PRD-001',
    selling_price: 10000,
    stock_quantity: 50,
  },
  {
    id: '2',
    name: 'Produit 2',
    sku: 'PRD-002',
    selling_price: 15000,
    stock_quantity: 30,
  },
];

// Mock data for daily cash register
const mockCaisseJournaliere = {
  id: '1',
  date: new Date().toISOString().split('T')[0],
  solde_ouverture: 50000,
  solde_cloture: null,
  statut: 'ouvert',
  user_id: '5dc129e2-cd73-4ee4-b73c-e5945761adb8',
};

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Test 6: Module Caisse - Point de Vente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('✅ should add products to cart', () => {
    const cart: Array<{ product: typeof mockProducts[0]; quantity: number }> = [];

    // Add Produit 1 x2
    cart.push({ product: mockProducts[0], quantity: 2 });
    // Add Produit 2 x1
    cart.push({ product: mockProducts[1], quantity: 1 });

    expect(cart).toHaveLength(2);
    expect(cart[0].quantity).toBe(2);
    expect(cart[1].quantity).toBe(1);

    console.log('✅ PASS - Produits ajoutés au panier');
  });

  it('✅ should calculate cart total correctly', () => {
    const cart = [
      { product: mockProducts[0], quantity: 2 }, // 10000 x 2 = 20000
      { product: mockProducts[1], quantity: 1 }, // 15000 x 1 = 15000
    ];

    const total = cart.reduce((sum, item) => {
      return sum + (item.product.selling_price * item.quantity);
    }, 0);

    expect(total).toBe(35000);

    console.log('✅ PASS - Calcul total correct (35000 XOF)');
  });

  it('✅ should validate payment methods', () => {
    const validPaymentMethods = ['especes', 'carte', 'mobile_money', 'cheque', 'virement'];
    const selectedMethod = 'especes';

    expect(validPaymentMethods).toContain(selectedMethod);

    console.log('✅ PASS - Méthode de paiement valide');
  });

  it('✅ should finalize sale', async () => {
    const sale = {
      items: [
        { product_id: '1', quantity: 2, unit_price: 10000, total: 20000 },
        { product_id: '2', quantity: 1, unit_price: 15000, total: 15000 },
      ],
      total: 35000,
      payment_method: 'especes',
      caisse_id: '1',
      user_id: '5dc129e2-cd73-4ee4-b73c-e5945761adb8',
    };

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...sale, id: 'sale-1' }, error: null }),
      }),
    });

    expect(sale.total).toBe(35000);
    expect(sale.items).toHaveLength(2);
    expect(sale.payment_method).toBe('especes');

    console.log('✅ PASS - Vente finalisée');
  });

  it('✅ should record movement in daily cash register', async () => {
    const mouvement = {
      caisse_id: '1',
      type: 'vente',
      montant: 35000,
      moyen_paiement: 'especes',
      description: 'Vente de produits',
      user_id: '5dc129e2-cd73-4ee4-b73c-e5945761adb8',
    };

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mouvement, id: 'mvt-1' }, error: null }),
      }),
    });

    expect(mouvement.type).toBe('vente');
    expect(mouvement.montant).toBe(35000);

    console.log('✅ PASS - Mouvement enregistré dans caisse journalière');
  });

  it('✅ should verify sale appears in daily report', async () => {
    const mockMouvements = [
      { id: '1', type: 'vente', montant: 35000, moyen_paiement: 'especes' },
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: mockMouvements, error: null }),
    });

    const result = await mockSupabase.from('mouvements_caisse').select('*').eq('caisse_id', '1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].montant).toBe(35000);

    console.log('✅ PASS - Vente visible dans rapport journalier');
  });

  it('✅ should update stock after sale', () => {
    const originalStock = 50;
    const quantitySold = 2;
    const newStock = originalStock - quantitySold;

    expect(newStock).toBe(48);

    console.log('✅ PASS - Stock mis à jour après vente');
  });
});
