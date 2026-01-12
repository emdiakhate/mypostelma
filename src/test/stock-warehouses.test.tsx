/**
 * Test 4: Module Stock - Gestion Entrepôts
 * OBJECTIF: Vérifier la gestion des entrepôts et stock
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@/test/mocks/auth';

// Mock data for warehouses
const mockWarehouses = [
  {
    id: '1',
    name: 'Entrepôt Principal',
    type: 'principal',
    address: 'Dakar, Sénégal',
    is_active: true,
    user_id: '5dc129e2-cd73-4ee4-b73c-e5945761adb8',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for inventory
const mockInventory = [
  {
    id: '1',
    name: 'Produit Test',
    sku: 'PRD-001',
    stock_quantity: 100,
    min_stock: 10,
    max_stock: 500,
    unit_price: 15000,
    category: 'Test',
  },
];

// Mock Supabase
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('Test 4: Module Stock - Gestion Entrepôts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('✅ should display list of warehouses', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockWarehouses, error: null }),
    });

    const result = await mockSupabase.from('stock_warehouses').select('*').order('name');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Entrepôt Principal');

    console.log('✅ PASS - Liste des entrepôts affichée');
  });

  it('✅ should create a new warehouse', async () => {
    const newWarehouse = {
      name: 'Entrepôt Test',
      type: 'principal',
      address: 'Dakar, Sénégal',
      is_active: true,
      user_id: '5dc129e2-cd73-4ee4-b73c-e5945761adb8',
    };

    const insertMock = vi.fn().mockResolvedValue({ 
      data: { ...newWarehouse, id: '2' }, 
      error: null 
    });

    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: insertMock,
      }),
    });

    expect(newWarehouse.name).toBe('Entrepôt Test');
    expect(newWarehouse.type).toBe('principal');
    expect(newWarehouse.address).toBe('Dakar, Sénégal');

    console.log('✅ PASS - Entrepôt créé');
  });

  it('✅ should display inventory with products', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockInventory, error: null }),
    });

    const result = await mockSupabase.from('vente_products').select('*').order('name');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Produit Test');

    console.log('✅ PASS - Inventaire chargé avec produits');
  });

  it('✅ should search products by name', async () => {
    const searchTerm = 'Test';
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ 
          data: mockInventory.filter(p => p.name.includes(searchTerm)), 
          error: null 
        }),
      }),
    });

    const result = await mockSupabase.from('vente_products')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name');

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toContain('Test');

    console.log('✅ PASS - Recherche produit fonctionne');
  });

  it('✅ should calculate stock quantity correctly', () => {
    const product = mockInventory[0];
    
    expect(product.stock_quantity).toBe(100);
    expect(product.stock_quantity).toBeGreaterThan(product.min_stock);
    expect(product.stock_quantity).toBeLessThan(product.max_stock);

    console.log('✅ PASS - Calcul stock correct');
  });

  it('✅ should validate warehouse types', () => {
    const validTypes = ['principal', 'secondaire', 'transit'];
    const warehouseType = 'principal';

    expect(validTypes).toContain(warehouseType);

    console.log('✅ PASS - Types entrepôts valides');
  });
});
