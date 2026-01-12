import { vi } from 'vitest';
import { mockUser } from './supabase';

// Mock useAuth hook
export const mockUseAuth = {
  user: mockUser,
  currentUser: mockUser,
  session: { user: mockUser, access_token: 'mock-token' },
  isAuthenticated: true,
  loading: false,
  logout: vi.fn(),
  hasPermission: vi.fn().mockReturnValue(true),
  isRole: vi.fn().mockReturnValue(true),
  canAccess: vi.fn().mockReturnValue(true),
  role: 'manager' as const,
  permissions: {
    canPublish: true,
    canSchedule: true,
    canDelete: true,
    canManageUsers: true,
    canManageAccounts: true,
    canViewAnalytics: true,
    canApproveContent: true,
    canManageBilling: true,
  },
  isOwner: true,
  isManager: true,
  isCreator: false,
  isViewer: false,
  isAdmin: true,
  userRole: 'manager' as const,
};

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));
