export const mockMessageTemplates = {
  whatsapp: [
    {
      id: '1',
      name: 'Premier contact',
      category: 'contact',
      content: `Bonjour {{nom}} 👋

J'ai découvert {{entreprise}} et je suis impressionné par votre activité dans le domaine {{categorie}}.

Je me permets de vous contacter car nous aidons des entreprises comme la vôtre à augmenter leur visibilité sur les réseaux sociaux.

Seriez-vous disponible pour un échange de 15 minutes cette semaine ?

Bien cordialement,
{{mon_prenom}}`
    },
    {
      id: '2',
      name: 'Relance 1',
      category: 'relance',
      content: `Bonjour {{nom}},

Je reviens vers vous concernant ma proposition d'échange sur votre stratégie digitale.

Je comprends que vous êtes probablement très occupé(e). 

Auriez-vous 10 minutes cette semaine pour en discuter ?

{{mon_prenom}}`
    },
    {
      id: '3',
      name: 'Relance 2',
      category: 'relance',
      content: `Bonjour {{nom}},

Dernière tentative de ma part 🙂

J'ai remarqué que plusieurs entreprises de {{ville}} dans le secteur {{categorie}} ont considérablement augmenté leur chiffre d'affaires grâce à une meilleure présence digitale.

Si cela vous intéresse, je serais ravi d'en discuter.

Sinon, je ne vous dérangerai plus.

{{mon_prenom}}`
    },
    {
      id: '4',
      name: 'Après appel',
      category: 'suivi',
      content: `Bonjour {{nom}},

Merci pour notre échange téléphonique de ce jour.

Comme convenu, je vous envoie les informations dont nous avons discuté.

N'hésitez pas si vous avez des questions !

{{mon_prenom}}`
    }
  ],
  
  email: [
    {
      id: 'e1',
      name: 'Premier contact',
      category: 'contact',
      subject: 'Opportunité de collaboration - {{entreprise}}',
      content: `Bonjour {{nom}},

Je me permets de vous contacter après avoir découvert {{entreprise}} à {{ville}}.

Votre activité dans le secteur {{categorie}} a retenu mon attention et je pense que nous pourrions collaborer pour renforcer votre présence digitale.

Nous accompagnons des entreprises comme la vôtre à :
- Augmenter leur visibilité sur les réseaux sociaux
- Générer plus de leads qualifiés
- Améliorer leur image de marque en ligne

Seriez-vous disponible pour un échange téléphonique de 15 minutes cette semaine ?

Dans l'attente de votre retour,

Cordialement,
{{mon_prenom}} {{mon_nom}}
{{mon_entreprise}}
{{mon_telephone}}`
    },
    {
      id: 'e2',
      name: 'Relance 1',
      category: 'relance',
      subject: 'Re: Opportunité de collaboration - {{entreprise}}',
      content: `Bonjour {{nom}},

Je me permets de revenir vers vous suite à mon message précédent concernant une collaboration potentielle.

Je comprends parfaitement que vous soyez occupé(e), c'est pourquoi je vous propose un échange rapide de 10 minutes par téléphone ou visio.

Si le sujet ne vous intéresse pas actuellement, n'hésitez pas à me le faire savoir.

Cordialement,
{{mon_prenom}} {{mon_nom}}`
    },
    {
      id: 'e3',
      name: 'Relance 2',
      category: 'relance',
      subject: 'Dernière tentative - {{entreprise}}',
      content: `Bonjour {{nom}},

Je comprends que ma proposition ne soit peut-être pas une priorité pour vous en ce moment.

Cependant, j'ai récemment aidé plusieurs entreprises de {{ville}} dans le secteur {{categorie}} à doubler leur génération de leads en 3 mois.

Si vous changez d'avis, ma porte reste ouverte.

Sinon, je vous souhaite une excellente continuation et ne vous dérangerai plus.

Cordialement,
{{mon_prenom}} {{mon_nom}}
{{mon_entreprise}}`
    },
    {
      id: 'e4',
      name: 'Envoi de devis',
      category: 'closing',
      subject: 'Devis - {{entreprise}}',
      content: `Bonjour {{nom}},

Suite à notre échange, vous trouverez ci-joint notre proposition commerciale pour {{entreprise}}.

Je reste à votre disposition pour toute question ou précision.

Dans l'attente de votre retour,

Cordialement,
{{mon_prenom}} {{mon_nom}}
{{mon_entreprise}}
{{mon_telephone}}`
    }
  ]
};

// Fonction pour remplacer les variables
export function replaceVariables(
  template: string, 
  variables: Record<string, string>
): string {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || `[${key}]`);
  });
  return result;
}
