/**
 * Utilitaire pour formater les noms d'utilisateur selon les règles Upload-Post
 * Règles : uniquement lettres, chiffres, underscores, @ et tirets
 */

/**
 * Convertit un nom complet en username valide pour Upload-Post
 * @param name - Nom complet de l'utilisateur
 * @param userId - ID de l'utilisateur pour garantir l'unicité
 * @returns Username formaté et valide
 */
export function formatUsernameForUploadPost(name: string, userId?: string): string {
  // Convertir en minuscules et enlever les espaces au début/fin
  let username = name.toLowerCase().trim();
  
  // Remplacer les espaces par des underscores
  username = username.replace(/\s+/g, '_');
  
  // Enlever tous les caractères non autorisés (garder uniquement lettres, chiffres, _, @, -)
  username = username.replace(/[^a-z0-9_@-]/g, '');
  
  // S'assurer qu'il n'est pas vide
  if (!username || username.length === 0) {
    username = 'user';
  }
  
  // Limiter à 30 caractères pour éviter les noms trop longs
  username = username.substring(0, 30);
  
  // Ajouter un suffixe unique si userId est fourni (utiliser les 8 premiers caractères de l'UUID)
  if (userId) {
    const suffix = userId.substring(0, 8).replace(/-/g, '');
    username = `${username}_${suffix}`;
  }
  
  return username;
}

/**
 * Valide qu'un username respecte les règles Upload-Post
 * @param username - Username à valider
 * @returns true si valide, false sinon
 */
export function isValidUploadPostUsername(username: string): boolean {
  // Doit contenir uniquement lettres, chiffres, underscores, @ et tirets
  const validPattern = /^[a-zA-Z0-9_@-]+$/;
  return validPattern.test(username) && username.length > 0;
}
