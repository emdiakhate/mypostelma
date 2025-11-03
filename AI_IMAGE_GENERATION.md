# Génération d'Images avec IA - Documentation

## Vue d'ensemble

L'application dispose de **deux systèmes** de génération d'images avec IA :

### 1. **Génération Simple (FAL.ai + Nano Banana)**

**Edge Function**: `supabase/functions/fal-image-generation/index.ts`
**Modèle**: `fal-ai/nano-banana` (Google Gemini 2.5 Flash Image Preview)

**Fonctionnalités disponibles** :
- ✅ **Génération simple** : Créer une image à partir d'un prompt texte
- ✅ **Édition d'image** : Modifier une image existante avec un prompt
- ✅ **Combinaison** : Combiner deux images selon un prompt
- ✅ **UGC (User Generated Content)** : Créer du contenu de type utilisateur

**Comment ça marche** :
1. L'utilisateur saisit un prompt dans `AiImageGenerationModal.tsx`
2. Le modal appelle l'edge function `fal-image-generation`
3. L'edge function envoie une requête à l'API FAL.ai avec le modèle Nano Banana
4. FAL.ai retourne un `request_id` pour le traitement asynchrone
5. L'edge function interroge périodiquement l'API (polling toutes les 5 secondes, max 60 tentatives = 5 minutes)
6. Une fois l'image générée, l'URL est retournée au client
7. L'image est affichée dans le modal et peut être utilisée dans le post

**Limitations** :
- ⚠️ Actuellement, seule la **génération simple** fonctionne
- ⚠️ L'édition, la combinaison et l'UGC nécessitent des images sources mais le traitement peut échouer
- ⚠️ Le temps de génération peut être long (jusqu'à 5 minutes)

**Code clé** :
```typescript
// Dans AiImageGenerationModal.tsx (ligne 103-126)
const { data, error } = await supabase.functions.invoke('fal-image-generation', {
  body: {
    prompt: aiPrompt,
    image_url: aiSourceImages[0] || null,
    type: aiGenerationType
  }
});
```

**API FAL.ai utilisée** :
- Endpoint simple : `https://queue.fal.run/fal-ai/nano-banana`
- Endpoint edit : `https://queue.fal.run/fal-ai/nano-banana/edit`

---

### 2. **Génération Avancée (Gemini + Banana.dev)** - ❌ NON FONCTIONNEL

**Edge Function**: `supabase/functions/generate-image-gemini/index.ts`
**Modèles** : 
- Gemini 2.0 Flash (amélioration du prompt)
- Banana.dev (génération Stable Diffusion)

**Processus en 2 étapes** :
1. **Étape 1** : Gemini améliore le prompt de l'utilisateur en un prompt détaillé optimisé pour Stable Diffusion
2. **Étape 2** : Banana.dev génère l'image avec le prompt amélioré

**Problème** :
- ❌ Cette fonction n'est **pas appelée** depuis l'interface
- ❌ Les secrets `GEMINI_API_KEY` et `BANANA_API_KEY` sont configurés mais inutilisés
- ❌ Le code existe mais n'est pas intégré au flux de l'application

---

## Recommandations

### Pour résoudre le problème de génération simple :

1. **Vérifier la clé API FAL.ai**
   - Assurez-vous que `FAL_AI_API_KEY` est correctement configuré dans les secrets Supabase
   - Testez la clé directement avec l'API FAL.ai

2. **Déboguer l'edge function**
   - Consultez les logs de l'edge function `fal-image-generation`
   - Vérifiez les erreurs lors du polling du statut

3. **Alternative : Utiliser Gemini + Banana.dev**
   - Intégrer l'edge function `generate-image-gemini` dans le composant `AiImageGenerationModal`
   - Remplacer l'appel à `fal-image-generation` par `generate-image-gemini`

### Code à modifier pour utiliser Gemini + Banana.dev :

```typescript
// Dans AiImageGenerationModal.tsx, remplacer ligne 104 par :
const { data, error } = await supabase.functions.invoke('generate-image-gemini', {
  body: {
    prompt: aiPrompt
  }
});

// Le reste du code reste identique
```

---

## Statut actuel

| Fonctionnalité | Statut | Edge Function | Modèle IA |
|----------------|--------|---------------|-----------|
| Génération Simple | ⚠️ Configuré mais ne génère pas | `fal-image-generation` | FAL.ai Nano Banana |
| Édition d'image | ⚠️ Configuré mais ne génère pas | `fal-image-generation` | FAL.ai Nano Banana |
| Combinaison | ⚠️ Configuré mais ne génère pas | `fal-image-generation` | FAL.ai Nano Banana |
| UGC | ⚠️ Configuré mais ne génère pas | `fal-image-generation` | FAL.ai Nano Banana |
| Gemini + Banana | ❌ Non intégré | `generate-image-gemini` | Gemini 2.0 Flash + Banana.dev |

---

## Pour déboguer

1. **Consulter les logs de l'edge function** :
   - Aller dans Lovable Cloud > Edge Functions > `fal-image-generation`
   - Regarder les logs pour voir les erreurs

2. **Tester manuellement l'API FAL.ai** :
   ```bash
   curl -X POST https://queue.fal.run/fal-ai/nano-banana \
     -H "Authorization: Key YOUR_FAL_AI_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "prompt": "A beautiful sunset over mountains",
       "image_size": "square_hd",
       "num_inference_steps": 4,
       "num_images": 1
     }'
   ```

3. **Vérifier la réponse de FAL.ai** :
   - Le `request_id` est-il retourné ?
   - Le statut de la requête évolue-t-il vers `COMPLETED` ?

---

## Conclusion

Le système de génération d'images est **partiellement implémenté** mais ne fonctionne pas actuellement. Il faut soit :
1. Déboguer la connexion à FAL.ai
2. Basculer sur Gemini + Banana.dev (qui sont déjà configurés)
