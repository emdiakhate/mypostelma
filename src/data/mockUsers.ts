/**
 * Données mock pour les utilisateurs
 * Phase 1: Gestion des Utilisateurs & Rôles
 */

import { User, UserRole, ROLE_PERMISSIONS } from '@/types/user';

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'manager@postelma.com',
    name: 'Manager Postelma',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    createdAt: new Date('2024-01-01'),
    permissions: ROLE_PERMISSIONS.manager,
    isActive: true,
    lastLogin: new Date()
  }
];

// Fonction pour charger les utilisateurs depuis localStorage
export const loadUsersFromStorage = (): User[] => {
  try {
    const stored = localStorage.getItem('postelma_users');
    if (stored) {
      const users = JSON.parse(stored);
      // Convertir les dates string en Date objects
      return users.map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
      }));
    }
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
  }
  return mockUsers;
};

// Fonction pour sauvegarder les utilisateurs dans localStorage
export const saveUsersToStorage = (users: User[]): void => {
  try {
    localStorage.setItem('postelma_users', JSON.stringify(users));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des utilisateurs:', error);
  }
};

// Fonction pour ajouter un nouvel utilisateur
export const addUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const newUser: User = {
    ...user,
    id: Date.now().toString(),
    createdAt: new Date()
  };
  
  const users = loadUsersFromStorage();
  users.push(newUser);
  saveUsersToStorage(users);
  
  return newUser;
};

// Fonction pour mettre à jour un utilisateur
export const updateUser = (userId: string, updates: Partial<User>): User | null => {
  const users = loadUsersFromStorage();
  const userIndex = users.findIndex(user => user.id === userId);
  
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsersToStorage(users);
  
  return users[userIndex];
};

// Fonction pour supprimer un utilisateur
export const deleteUser = (userId: string): boolean => {
  const users = loadUsersFromStorage();
  const filteredUsers = users.filter(user => user.id !== userId);
  
  if (filteredUsers.length === users.length) return false;
  
  saveUsersToStorage(filteredUsers);
  return true;
};
