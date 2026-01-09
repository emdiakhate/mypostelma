/**
 * useReports Hook - Génération de rapports
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ReportType = 'sales' | 'invoices' | 'clients' | 'stock' | 'global';
type GroupBy = 'day' | 'week' | 'month';

interface ReportFilters {
  type: ReportType;
  dateFrom?: string;
  dateTo?: string;
  groupBy?: GroupBy;
}

export const useReports = (filters: ReportFilters) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      let reportData: any[] = [];

      switch (filters.type) {
        case 'sales':
          reportData = await generateSalesReport(
            userData.user.id,
            filters.dateFrom,
            filters.dateTo,
            filters.groupBy
          );
          break;

        case 'invoices':
          reportData = await generateInvoicesReport(
            userData.user.id,
            filters.dateFrom,
            filters.dateTo
          );
          break;

        case 'clients':
          reportData = await generateClientsReport(
            userData.user.id,
            filters.dateFrom,
            filters.dateTo
          );
          break;

        case 'stock':
          reportData = await generateStockReport(userData.user.id);
          break;

        case 'global':
        default:
          reportData = await generateGlobalReport(
            userData.user.id,
            filters.dateFrom,
            filters.dateTo,
            filters.groupBy
          );
          break;
      }

      setData(reportData);
    } catch (error: any) {
      console.error('Error loading report:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger le rapport.',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return {
    data,
    loading,
    loadReport,
  };
};

// ============================================================================
// GENERATORS
// ============================================================================

async function generateSalesReport(
  userId: string,
  dateFrom?: string,
  dateTo?: string,
  groupBy?: GroupBy
): Promise<any[]> {
  let query = supabase
    .from('vente_orders')
    .select('id, order_number, order_date, total, status, client:client_id(name)')
    .eq('user_id', userId)
    .order('order_date', { ascending: false });

  if (dateFrom) {
    query = query.gte('order_date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('order_date', dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((order) => ({
    numero: order.order_number,
    date: order.order_date,
    client: order.client?.name || 'N/A',
    montant_total: Number(order.total),
    statut: order.status,
  }));
}

async function generateInvoicesReport(
  userId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<any[]> {
  let query = supabase
    .from('compta_invoices')
    .select('id, invoice_number, issue_date, due_date, total, status, client:client_id(name)')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });

  if (dateFrom) {
    query = query.gte('issue_date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('issue_date', dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((invoice) => ({
    numero: invoice.invoice_number,
    date_emission: invoice.issue_date,
    date_echeance: invoice.due_date,
    client: invoice.client?.name || 'N/A',
    montant_total: Number(invoice.total),
    statut: invoice.status,
  }));
}

async function generateClientsReport(
  userId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<any[]> {
  let query = supabase
    .from('crm_clients')
    .select('id, name, email, phone, company, city, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Calculer le CA par client
  const clientsWithRevenue = await Promise.all(
    (data || []).map(async (client) => {
      const { data: orders } = await supabase
        .from('vente_orders')
        .select('total')
        .eq('user_id', userId)
        .eq('client_id', client.id);

      const totalRevenue = (orders || []).reduce((sum, o) => sum + Number(o.total), 0);

      return {
        nom: client.name,
        email: client.email || 'N/A',
        telephone: client.phone || 'N/A',
        entreprise: client.company || 'N/A',
        ville: client.city || 'N/A',
        date_creation: client.created_at,
        chiffre_affaires: totalRevenue,
      };
    })
  );

  return clientsWithRevenue;
}

async function generateStockReport(userId: string): Promise<any[]> {
  const { data: products, error } = await supabase
    .from('vente_products')
    .select('id, name, sku, category, stock, price, cost')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map((product) => ({
    nom: product.name,
    sku: product.sku || 'N/A',
    categorie: product.category || 'Autre',
    stock_actuel: product.stock || 0,
    prix_vente: Number(product.price || 0),
    prix_achat: Number(product.cost || 0),
    valeur_stock: (product.stock || 0) * Number(product.cost || 0),
  }));
}

async function generateGlobalReport(
  userId: string,
  dateFrom?: string,
  dateTo?: string,
  groupBy?: GroupBy
): Promise<any[]> {
  // Rapport global simplifié combinant ventes et factures
  const salesData = await generateSalesReport(userId, dateFrom, dateTo, groupBy);
  const invoicesData = await generateInvoicesReport(userId, dateFrom, dateTo);

  // Calculer des agrégats par période
  const summary = [
    {
      type: 'Ventes',
      nombre: salesData.length,
      montant_total: salesData.reduce((sum, s) => sum + s.montant_total, 0),
    },
    {
      type: 'Factures',
      nombre: invoicesData.length,
      montant_total: invoicesData.reduce((sum, i) => sum + i.montant_total, 0),
    },
  ];

  return summary;
}
