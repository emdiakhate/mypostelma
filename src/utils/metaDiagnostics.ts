/**
 * Utilitaires de diagnostic pour les connexions Meta (Facebook/Instagram)
 */

export interface MetaDiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
  suggestions?: string[];
}

/**
 * Vérifie si un compte Instagram est bien un compte Business
 * en consultant l'API Graph
 */
export async function checkInstagramBusinessAccount(
  accessToken: string
): Promise<MetaDiagnosticResult> {
  try {
    // Récupérer les pages Facebook avec leurs comptes Instagram
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account{id,username,name}&access_token=${accessToken}`;

    const response = await fetch(pagesUrl);
    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des pages Facebook',
        details: data.error,
        suggestions: [
          'Vérifiez que le token d\'accès est valide',
          'Assurez-vous d\'avoir les permissions pages_show_list',
        ],
      };
    }

    const pages = data.data || [];
    const pagesWithInstagram = pages.filter(
      (page: any) => page.instagram_business_account
    );

    if (pagesWithInstagram.length === 0) {
      return {
        success: false,
        message: 'Aucun compte Instagram Business trouvé',
        details: { pages, totalPages: pages.length },
        suggestions: [
          'Convertissez votre compte Instagram en compte Business',
          'Liez votre compte Instagram à une page Facebook',
          'Vérifiez que vous êtes administrateur de la page Facebook',
          'Allez dans Instagram → Paramètres → Compte → Passer à un compte professionnel',
        ],
      };
    }

    return {
      success: true,
      message: `${pagesWithInstagram.length} compte(s) Instagram Business trouvé(s)`,
      details: {
        accounts: pagesWithInstagram.map((page: any) => ({
          pageName: page.name,
          instagramUsername: page.instagram_business_account.username,
          instagramId: page.instagram_business_account.id,
        })),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Erreur lors du diagnostic Instagram',
      details: { error: error.message },
    };
  }
}

/**
 * Vérifie les permissions d'un token d'accès
 */
export async function checkTokenPermissions(
  accessToken: string
): Promise<MetaDiagnosticResult> {
  try {
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`;

    const response = await fetch(debugUrl);
    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        message: 'Token invalide ou expiré',
        details: data.error,
        suggestions: ['Reconnectez votre compte Facebook/Instagram'],
      };
    }

    const tokenData = data.data;
    const scopes = tokenData.scopes || [];
    const expiresAt = tokenData.expires_at
      ? new Date(tokenData.expires_at * 1000)
      : null;

    const requiredScopesForFacebook = [
      'pages_show_list',
      'pages_manage_posts',
      'pages_read_engagement',
    ];

    const requiredScopesForInstagram = [
      'instagram_basic',
      'instagram_manage_messages',
      'pages_show_list',
    ];

    const missingFacebookScopes = requiredScopesForFacebook.filter(
      (scope) => !scopes.includes(scope)
    );

    const missingInstagramScopes = requiredScopesForInstagram.filter(
      (scope) => !scopes.includes(scope)
    );

    const suggestions = [];
    if (missingFacebookScopes.length > 0) {
      suggestions.push(
        `Permissions Facebook manquantes: ${missingFacebookScopes.join(', ')}`
      );
    }
    if (missingInstagramScopes.length > 0) {
      suggestions.push(
        `Permissions Instagram manquantes: ${missingInstagramScopes.join(', ')}`
      );
    }

    const isExpired = expiresAt && expiresAt < new Date();

    return {
      success: !isExpired && suggestions.length === 0,
      message: isExpired
        ? 'Token expiré'
        : suggestions.length > 0
        ? 'Certaines permissions sont manquantes'
        : 'Token valide avec toutes les permissions',
      details: {
        appId: tokenData.app_id,
        userId: tokenData.user_id,
        scopes,
        expiresAt: expiresAt?.toISOString(),
        isExpired,
      },
      suggestions:
        suggestions.length > 0
          ? [...suggestions, 'Déconnectez et reconnectez votre compte']
          : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Erreur lors de la vérification du token',
      details: { error: error.message },
    };
  }
}

/**
 * Vérifie si une page Facebook peut publier
 */
export async function checkPagePublishPermissions(
  pageId: string,
  pageAccessToken: string
): Promise<MetaDiagnosticResult> {
  try {
    // Vérifier les permissions de la page
    const permissionsUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,tasks,is_published&access_token=${pageAccessToken}`;

    const response = await fetch(permissionsUrl);
    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        message: 'Impossible d\'accéder à la page',
        details: data.error,
        suggestions: [
          'Vérifiez que vous êtes administrateur de la page',
          'Reconnectez votre compte Facebook',
        ],
      };
    }

    const tasks = data.tasks || [];
    const canManage = tasks.includes('MANAGE') || tasks.includes('CREATE_CONTENT');

    if (!canManage) {
      return {
        success: false,
        message: 'Permissions insuffisantes pour publier sur cette page',
        details: { tasks, pageName: data.name },
        suggestions: [
          'Vérifiez que vous êtes administrateur ou éditeur de la page',
          'Accordez les permissions de publication lors de la connexion',
        ],
      };
    }

    return {
      success: true,
      message: 'La page peut publier du contenu',
      details: {
        pageName: data.name,
        pageId: data.id,
        tasks,
        isPublished: data.is_published,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Erreur lors de la vérification de la page',
      details: { error: error.message },
    };
  }
}

/**
 * Exécute un diagnostic complet pour un compte Meta
 */
export async function runFullMetaDiagnostic(
  platform: 'facebook' | 'instagram',
  accessToken: string,
  pageId?: string
): Promise<{
  tokenCheck: MetaDiagnosticResult;
  instagramCheck?: MetaDiagnosticResult;
  pageCheck?: MetaDiagnosticResult;
  overallStatus: 'success' | 'warning' | 'error';
}> {
  // 1. Vérifier le token
  const tokenCheck = await checkTokenPermissions(accessToken);

  let instagramCheck: MetaDiagnosticResult | undefined;
  let pageCheck: MetaDiagnosticResult | undefined;

  // 2. Si Instagram, vérifier le compte Business
  if (platform === 'instagram') {
    instagramCheck = await checkInstagramBusinessAccount(accessToken);
  }

  // 3. Si Facebook avec pageId, vérifier les permissions de page
  if (platform === 'facebook' && pageId && accessToken) {
    pageCheck = await checkPagePublishPermissions(pageId, accessToken);
  }

  // Déterminer le statut global
  const checks = [tokenCheck, instagramCheck, pageCheck].filter(Boolean);
  const hasError = checks.some((check) => !check!.success);
  const overallStatus = hasError ? 'error' : 'success';

  return {
    tokenCheck,
    instagramCheck,
    pageCheck,
    overallStatus,
  };
}
