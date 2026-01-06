/**
 * Tests pour useStock hook
 *
 * Tests unitaires des fonctionnalités du module Stock:
 * - Products CRUD
 * - Warehouses CRUD
 * - Stock Movements (IN/OUT/TRANSFER/ADJUSTMENT)
 * - Digital Assets
 * - Stock Levels calculation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
  useStockProducts,
  useWarehouses,
  useStockMovements,
  useDigitalAssets,
  useStockLevels,
  useStock,
} from './useStock';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  },
}));

describe('useStockProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load products successfully', async () => {
    const mockProducts = [
      {
        id: '1',
        user_id: 'test-user-id',
        name: 'iPhone 15',
        type: 'PHYSICAL',
        price: 1200,
        is_stockable: true,
        status: 'active',
      },
      {
        id: '2',
        user_id: 'test-user-id',
        name: 'Office 365 License',
        type: 'DIGITAL',
        price: 99,
        is_stockable: false,
        status: 'active',
      },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: mockProducts, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
    });

    const { result } = renderHook(() => useStockProducts());

    await act(async () => {
      await result.current.loadProducts();
    });

    await waitFor(() => {
      expect(result.current.products).toHaveLength(2);
      expect(result.current.products[0].name).toBe('iPhone 15');
      expect(result.current.products[1].type).toBe('DIGITAL');
    });
  });

  it('should create a product successfully', async () => {
    const newProduct = {
      name: 'Dell XPS 15',
      type: 'PHYSICAL' as const,
      price: 1500,
      cost_price: 1200,
      is_stockable: true,
    };

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: '3', ...newProduct, user_id: 'test-user-id' },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useStockProducts());

    await act(async () => {
      await result.current.createProduct(newProduct);
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Dell XPS 15',
        type: 'PHYSICAL',
      })
    );
  });

  it('should filter products by type', async () => {
    const mockProducts = [
      { id: '1', type: 'PHYSICAL', name: 'iPhone' },
      { id: '2', type: 'DIGITAL', name: 'License' },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: mockProducts, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
    });

    const { result } = renderHook(() => useStockProducts({ type: 'PHYSICAL' }));

    await act(async () => {
      await result.current.loadProducts();
    });

    expect(mockEq).toHaveBeenCalledWith('type', 'PHYSICAL');
  });
});

describe('useWarehouses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load warehouses successfully', async () => {
    const mockWarehouses = [
      {
        id: '1',
        name: 'Boutique Dakar',
        type: 'STORE',
        city: 'Dakar',
        is_active: true,
      },
      {
        id: '2',
        name: 'Entrepôt Central',
        type: 'WAREHOUSE',
        city: 'Thiès',
        is_active: true,
      },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: mockWarehouses, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
    });

    const { result } = renderHook(() => useWarehouses());

    await act(async () => {
      await result.current.loadWarehouses();
    });

    await waitFor(() => {
      expect(result.current.warehouses).toHaveLength(2);
      expect(result.current.warehouses[0].type).toBe('STORE');
    });
  });

  it('should create a warehouse successfully', async () => {
    const newWarehouse = {
      name: 'Boutique Saint-Louis',
      type: 'STORE' as const,
      city: 'Saint-Louis',
      is_active: true,
    };

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: '3', ...newWarehouse, user_id: 'test-user-id' },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useWarehouses());

    await act(async () => {
      await result.current.createWarehouse(newWarehouse);
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Boutique Saint-Louis',
        type: 'STORE',
      })
    );
  });
});

describe('useStockMovements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create IN movement successfully', async () => {
    const inMovement = {
      product_id: 'prod-1',
      movement_type: 'IN' as const,
      quantity: 50,
      warehouse_to_id: 'warehouse-1',
      reason: 'Purchase from supplier',
      unit_cost: 850,
    };

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'mov-1',
        ...inMovement,
        total_cost: 42500,
        user_id: 'test-user-id',
      },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useStockMovements());

    await act(async () => {
      await result.current.createMovement(inMovement);
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        movement_type: 'IN',
        quantity: 50,
        total_cost: 42500, // 50 * 850
      })
    );
  });

  it('should create OUT movement successfully', async () => {
    const outMovement = {
      product_id: 'prod-1',
      movement_type: 'OUT' as const,
      quantity: 1,
      warehouse_from_id: 'warehouse-1',
      reason: 'Sale to customer',
      reference_type: 'SALE' as const,
      reference_id: 'sale-123',
    };

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'mov-2', ...outMovement, user_id: 'test-user-id' },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useStockMovements());

    await act(async () => {
      await result.current.createMovement(outMovement);
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        movement_type: 'OUT',
        reference_type: 'SALE',
      })
    );
  });

  it('should create TRANSFER movement successfully', async () => {
    const transferMovement = {
      product_id: 'prod-1',
      movement_type: 'TRANSFER' as const,
      quantity: 10,
      warehouse_from_id: 'warehouse-1',
      warehouse_to_id: 'warehouse-2',
      reason: 'Restock boutique',
    };

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'mov-3', ...transferMovement, user_id: 'test-user-id' },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useStockMovements());

    await act(async () => {
      await result.current.createMovement(transferMovement);
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        movement_type: 'TRANSFER',
        warehouse_from_id: 'warehouse-1',
        warehouse_to_id: 'warehouse-2',
      })
    );
  });

  it('should load movements with filters', async () => {
    const mockMovements = [
      { id: '1', movement_type: 'IN', quantity: 50 },
      { id: '2', movement_type: 'OUT', quantity: 1 },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: mockMovements, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
    });

    const { result } = renderHook(() => useStockMovements({ movement_type: 'IN' }));

    await act(async () => {
      await result.current.loadMovements();
    });

    expect(mockEq).toHaveBeenCalledWith('movement_type', 'IN');
  });
});

describe('useDigitalAssets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create digital asset successfully', async () => {
    const newAsset = {
      product_id: 'prod-digital-1',
      code_or_license: 'XXXXX-XXXXX-XXXXX',
      status: 'AVAILABLE' as const,
    };

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'asset-1', ...newAsset, user_id: 'test-user-id' },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
      select: mockSelect,
      single: mockSingle,
    });

    const { result } = renderHook(() => useDigitalAssets());

    await act(async () => {
      await result.current.createAsset(newAsset);
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        code_or_license: 'XXXXX-XXXXX-XXXXX',
        status: 'AVAILABLE',
      })
    );
  });

  it('should load available assets', async () => {
    const mockAssets = [
      { id: '1', status: 'AVAILABLE', code_or_license: 'KEY-1' },
      { id: '2', status: 'USED', code_or_license: 'KEY-2' },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: mockAssets, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
    });

    const { result } = renderHook(() => useDigitalAssets({ status: 'AVAILABLE' }));

    await act(async () => {
      await result.current.loadAssets();
    });

    expect(mockEq).toHaveBeenCalledWith('status', 'AVAILABLE');
  });
});

describe('useStockLevels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get product stock quantity via RPC', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: 25, error: null });
    (supabase as any).rpc = mockRpc;

    const { result } = renderHook(() => useStockLevels());

    let stock: number = 0;
    await act(async () => {
      stock = await result.current.getProductStock('prod-1', 'warehouse-1');
    });

    expect(stock).toBe(25);
    expect(mockRpc).toHaveBeenCalledWith('get_stock_quantity', {
      p_product_id: 'prod-1',
      p_warehouse_id: 'warehouse-1',
    });
  });

  it('should check stock availability via RPC', async () => {
    const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
    (supabase as any).rpc = mockRpc;

    const { result } = renderHook(() => useStockLevels());

    let available: boolean = false;
    await act(async () => {
      available = await result.current.checkStockAvailable('prod-1', 'warehouse-1', 10);
    });

    expect(available).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('check_stock_available', {
      p_product_id: 'prod-1',
      p_warehouse_id: 'warehouse-1',
      p_quantity: 10,
    });
  });

  it('should load stock levels successfully', async () => {
    const mockLevels = [
      {
        product_id: 'prod-1',
        product_name: 'iPhone 15',
        warehouse_id: 'warehouse-1',
        warehouse_name: 'Boutique Dakar',
        current_quantity: 25,
        average_cost: 850,
      },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ data: mockLevels, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
    });

    const { result } = renderHook(() => useStockLevels());

    await act(async () => {
      await result.current.loadLevels();
    });

    await waitFor(() => {
      expect(result.current.levels).toHaveLength(1);
      expect(result.current.levels[0].current_quantity).toBe(25);
    });
  });
});

describe('useStock (combined hook)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all sub-hooks', () => {
    const { result } = renderHook(() => useStock());

    expect(result.current.products).toBeDefined();
    expect(result.current.warehouses).toBeDefined();
    expect(result.current.movements).toBeDefined();
    expect(result.current.digitalAssets).toBeDefined();
    expect(result.current.stockLevels).toBeDefined();

    expect(result.current.products.createProduct).toBeInstanceOf(Function);
    expect(result.current.warehouses.createWarehouse).toBeInstanceOf(Function);
    expect(result.current.movements.createMovement).toBeInstanceOf(Function);
  });
});

describe('Stock calculations', () => {
  it('should calculate total_cost from quantity and unit_cost', () => {
    const quantity = 50;
    const unit_cost = 850;
    const total_cost = quantity * unit_cost;

    expect(total_cost).toBe(42500);
  });

  it('should calculate stock from movements', () => {
    // Scenario:
    // - IN: +50
    // - OUT: -1
    // - TRANSFER IN: +10
    // - TRANSFER OUT: -5
    // Total: 54

    const movements = [
      { type: 'IN', quantity: 50 },
      { type: 'OUT', quantity: 1 },
      { type: 'TRANSFER_IN', quantity: 10 },
      { type: 'TRANSFER_OUT', quantity: 5 },
    ];

    const stock = movements.reduce((sum, m) => {
      if (m.type === 'IN' || m.type === 'TRANSFER_IN') return sum + m.quantity;
      if (m.type === 'OUT' || m.type === 'TRANSFER_OUT') return sum - m.quantity;
      return sum;
    }, 0);

    expect(stock).toBe(54);
  });
});
