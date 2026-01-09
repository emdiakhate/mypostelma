/**
 * useGlobalStats Hook - Statistiques globales cross-modules
 *
 * Agrège les données de CRM, Vente, Stock et Compta
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface GlobalStatsFilters {
  days?: number;
}

interface GlobalStats {
  // Revenue
  totalRevenue: number;
  revenueChange: number;
  monthlyRevenue: number[];
  revenueByCategory: Record<string, number>;

  // Clients
  totalClients: number;
  newClients: number;
  monthlyNewClients: number[];

  // Commandes
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;

  // Stock
  totalProducts: number;
  lowStockItems: number;

  // Compta
  monthlyInvoiced: number[];
  pendingInvoices: number;
  pendingInvoicesCount: number;
  overdueInvoices: number;
  overdueAmount: number;
  averagePaymentDelay: number;
}

export const useGlobalStats = (filters?: GlobalStatsFilters) => {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const days = filters?.days || 30;

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Non authentifié');

      const now = new Date();
      const startDate = startOfDay(subDays(now, days));
      const previousStartDate = startOfDay(subDays(now, days * 2));

      // ============================================================
      // 1. REVENUE (depuis commandes de vente)
      // ============================================================
      const { data: orders, error: ordersError } = await supabase
        .from('vente_orders')
        .select('total, created_at, status')
        .eq('user_id', userData.user.id)
        .gte('created_at', previousStartDate.toISOString());

      if (ordersError) throw ordersError;

      const currentPeriodOrders = orders.filter(
        (o) => new Date(o.created_at) >= startDate
      );
      const previousPeriodOrders = orders.filter(
        (o) =>
          new Date(o.created_at) >= previousStartDate &&
          new Date(o.created_at) < startDate
      );

      const totalRevenue = currentPeriodOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const previousRevenue = previousPeriodOrders.reduce(
        (sum, o) => sum + Number(o.total),
        0
      );
      const revenueChange =
        previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // ============================================================
      // 2. CLIENTS
      // ============================================================
      const { data: clients, error: clientsError } = await supabase
        .from('crm_clients')
        .select('id, created_at')
        .eq('user_id', userData.user.id);

      if (clientsError) throw clientsError;

      const totalClients = clients.length;
      const newClients = clients.filter((c) => new Date(c.created_at) >= startDate).length;

      // ============================================================
      // 3. COMMANDES & CONVERSION
      // ============================================================
      const { data: quotes, error: quotesError } = await supabase
        .from('compta_quotes')
        .select('id, status')
        .eq('user_id', userData.user.id)
        .gte('created_at', startDate.toISOString());

      if (quotesError) throw quotesError;

      const totalOrders = currentPeriodOrders.length;
      const totalQuotes = quotes.length;
      const conversionRate =
        totalQuotes > 0 ? (totalOrders / totalQuotes) * 100 : 0;
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // ============================================================
      // 4. STOCK
      // ============================================================
      const { data: products, error: productsError } = await supabase
        .from('vente_products')
        .select('id, stock')
        .eq('user_id', userData.user.id);

      if (productsError) throw productsError;

      const totalProducts = products.length;
      const lowStockItems = products.filter(
        (p) => p.stock != null && p.stock < 10
      ).length;

      // ============================================================
      // 5. FACTURES COMPTA
      // ============================================================
      const { data: invoices, error: invoicesError } = await supabase
        .from('compta_invoices')
        .select('id, total, status, due_date, issue_date')
        .eq('user_id', userData.user.id);

      if (invoicesError) throw invoicesError;

      const pendingInvoicesData = invoices.filter(
        (i) => i.status === 'sent' || i.status === 'partial'
      );
      const pendingInvoices = pendingInvoicesData.reduce(
        (sum, i) => sum + Number(i.total),
        0
      );
      const pendingInvoicesCount = pendingInvoicesData.length;

      const now2 = new Date();
      const overdueInvoicesData = invoices.filter(
        (i) =>
          (i.status === 'sent' || i.status === 'partial') &&
          new Date(i.due_date) < now2
      );
      const overdueInvoices = overdueInvoicesData.length;
      const overdueAmount = overdueInvoicesData.reduce(
        (sum, i) => sum + Number(i.total),
        0
      );

      // Délai moyen de paiement (calculé sur les factures payées)
      const paidInvoices = invoices.filter((i) => i.status === 'paid');
      const totalDelay = paidInvoices.reduce((sum, i) => {
        const issueDate = new Date(i.issue_date);
        const dueDate = new Date(i.due_date);
        const delay = Math.floor(
          (dueDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + delay;
      }, 0);
      const averagePaymentDelay =
        paidInvoices.length > 0 ? Math.round(totalDelay / paidInvoices.length) : 0;

      // ============================================================
      // 6. EVOLUTION MENSUELLE (6 derniers mois)
      // ============================================================
      const monthlyRevenue = Array(6).fill(0);
      const monthlyInvoiced = Array(6).fill(0);
      const monthlyNewClients = Array(6).fill(0);

      // Simplification: on ne calcule que pour la période actuelle
      // Pour une vraie implémentation, il faudrait faire des requêtes par mois

      // ============================================================
      // 7. REVENUE PAR CATEGORIE
      // ============================================================
      const { data: orderItems, error: itemsError } = await supabase
        .from('vente_order_items')
        .select('product_id, quantity, unit_price, vente_products(category)')
        .in(
          'order_id',
          currentPeriodOrders.map((o) => o.id)
        );

      if (itemsError) throw itemsError;

      const revenueByCategory: Record<string, number> = {};
      orderItems?.forEach((item: any) => {
        const category = item.vente_products?.category || 'Autre';
        const revenue = Number(item.quantity) * Number(item.unit_price);
        revenueByCategory[category] = (revenueByCategory[category] || 0) + revenue;
      });

      // ============================================================
      // MISE À JOUR DES STATS
      // ============================================================
      setStats({
        totalRevenue,
        revenueChange,
        monthlyRevenue,
        revenueByCategory,
        totalClients,
        newClients,
        monthlyNewClients,
        totalOrders,
        averageOrderValue,
        conversionRate,
        totalProducts,
        lowStockItems,
        monthlyInvoiced,
        pendingInvoices,
        pendingInvoicesCount,
        overdueInvoices,
        overdueAmount,
        averagePaymentDelay,
      });
    } catch (error: any) {
      console.error('Error loading global stats:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les statistiques globales.',
      });
    } finally {
      setLoading(false);
    }
  }, [days, toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    loadStats,
  };
};
