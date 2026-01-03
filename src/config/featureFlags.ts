/**
 * Feature Flags pour la migration progressive vers la nouvelle architecture
 *
 * Ces flags permettent d'activer/désactiver les nouvelles fonctionnalités
 * pendant la période de migration
 */

export const FEATURE_FLAGS = {
  // Flag principal pour activer la nouvelle architecture
  ENABLE_NEW_ARCHITECTURE: false,

  // Flags par module
  ENABLE_NEW_SIDEBAR: false,
  ENABLE_NEW_DASHBOARD: false,
  ENABLE_NEW_CRM: false,
  ENABLE_NEW_MARKETING: false,
  ENABLE_VENTE_MODULE: false,
  ENABLE_COMPTA_MODULE: false,
  ENABLE_NEW_REPORTING: false,
  ENABLE_NEW_ADMIN: false,
} as const;

/**
 * Fonction helper pour vérifier si un feature flag est activé
 */
export const isFeatureEnabled = (flag: keyof typeof FEATURE_FLAGS): boolean => {
  // En développement, on peut override via localStorage
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem(`feature_${flag}`);
    if (override !== null) {
      return override === 'true';
    }
  }

  return FEATURE_FLAGS[flag];
};

/**
 * Fonction helper pour activer/désactiver un flag (dev only)
 */
export const toggleFeature = (flag: keyof typeof FEATURE_FLAGS, enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`feature_${flag}`, enabled.toString());
    console.log(`Feature ${flag} ${enabled ? 'enabled' : 'disabled'}`);
  }
};

/**
 * Debug: afficher l'état de tous les flags
 */
export const debugFeatureFlags = (): void => {
  console.group('🚩 Feature Flags Status');
  Object.entries(FEATURE_FLAGS).forEach(([key, value]) => {
    const actualValue = isFeatureEnabled(key as keyof typeof FEATURE_FLAGS);
    console.log(`${key}: ${actualValue} ${actualValue !== value ? '(overridden)' : ''}`);
  });
  console.groupEnd();
};

// Exposer dans window en dev pour debug facile
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).featureFlags = {
    toggle: toggleFeature,
    debug: debugFeatureFlags,
    isEnabled: isFeatureEnabled,
  };

  console.log('💡 Feature flags available in console: window.featureFlags');
  console.log('   - window.featureFlags.debug() - Show all flags');
  console.log('   - window.featureFlags.toggle("ENABLE_NEW_SIDEBAR", true) - Toggle a flag');
  console.log('   - window.featureFlags.isEnabled("ENABLE_NEW_CRM") - Check a flag');
}
