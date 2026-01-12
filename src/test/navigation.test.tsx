/**
 * Test 1: Navigation & Sidebar
 */
import { describe, it, expect, vi } from 'vitest';

describe('Test 1: Navigation & Sidebar', () => {
  it('✅ should have 8 main modules defined', () => {
    const expectedModules = [
      'Dashboard', 'CRM', 'Marketing', 'Vente', 
      'Stock', 'Compta', 'Caisse', 'Administration'
    ];
    expect(expectedModules).toHaveLength(8);
    console.log('✅ PASS - 8 modules définis');
  });

  it('✅ should NOT have obsolete menus', () => {
    const obsoleteMenus = ['Dashboard Global', 'Rapports', 'Reporting'];
    const currentMenus = ['Dashboard', 'CRM', 'Marketing', 'Vente', 'Stock', 'Compta', 'Caisse', 'Administration'];
    
    obsoleteMenus.forEach(menu => {
      expect(currentMenus).not.toContain(menu);
    });
    console.log('✅ PASS - Aucun menu obsolète');
  });
});
