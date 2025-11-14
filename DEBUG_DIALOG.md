# 🔧 Debug Rapide - Bouton "Ajouter un concurrent"

## Test Immédiat dans le Navigateur

### 1. Ouvrez la Console (F12) et testez:

```javascript
// Test 1: Vérifier l'authentification
const checkAuth = async () => {
  const token = localStorage.getItem('sb-8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b-auth-token');
  console.log('Auth token exists:', !!token);
  if (token) {
    const parsed = JSON.parse(token);
    console.log('User:', parsed.user?.email);
  }
};
checkAuth();

// Test 2: Vérifier que le bouton existe
const button = document.querySelector('button');
console.log('Button found:', !!button);
console.log('Button text:', button?.textContent);

// Test 3: Forcer l'ouverture du Dialog
// Cherchez le bouton avec le texte "Add Competitor"
const addButton = Array.from(document.querySelectorAll('button'))
  .find(btn => btn.textContent.includes('Add Competitor'));
console.log('Add Competitor button:', addButton);
if (addButton) {
  addButton.click();
  console.log('Clicked!');
}

// Test 4: Vérifier les erreurs React
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});
```

### 2. Si le Dialog ne s'ouvre toujours pas:

**Vérifiez dans la console s'il y a des erreurs comme:**
- `Cannot read property 'addEventListener' of null`
- `Uncaught ReferenceError`
- `React is not defined`
- Erreurs de @radix-ui

### 3. Solution de Contournement Temporaire

Si le Dialog ne fonctionne vraiment pas, testez en ajoutant directement en base:

```sql
-- Dans Supabase SQL Editor
INSERT INTO competitors (
  user_id,
  name,
  industry,
  instagram_url,
  twitter_url,
  facebook_url,
  website_url
) VALUES (
  auth.uid(), -- Votre user_id
  'Nike',
  'Sports & Apparel',
  'https://www.instagram.com/nike/',
  'https://twitter.com/Nike',
  'https://www.facebook.com/nike',
  'https://www.nike.com'
);
```

Rechargez la page, le concurrent devrait apparaître.

---

## 🐛 Debugging par Étapes

### Étape 1: Vérifier que vous êtes sur la bonne page
```
URL devrait être: http://localhost:5173/competitors
```

### Étape 2: Vérifier le state React
```javascript
// Dans la console React DevTools (F12 → Components)
// Cherchez le composant "CompetitorsPage"
// Vérifiez:
// - isAddDialogOpen: false (au départ)
// - isLoading: false
// - competitors: [...array]
```

### Étape 3: Forcer l'ouverture manuellement
```javascript
// Dans la console, forcer le state
// (nécessite React DevTools)
// Cherchez CompetitorsPage dans React DevTools
// Changez isAddDialogOpen de false à true
```

### Étape 4: Tester le composant isolé

Créez un fichier de test `/src/pages/DialogTest.tsx`:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function DialogTest() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <h1>Dialog Test</h1>

      {/* Test 1: Simple Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Open Dialog Test</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
          </DialogHeader>
          <p>If you see this, the Dialog works!</p>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>

      {/* Test 2: Manual open */}
      <div className="mt-4">
        <Button onClick={() => {
          console.log('Manual open clicked');
          setOpen(true);
        }}>
          Manual Open (via setState)
        </Button>
        <p>Current state: {open ? 'OPEN' : 'CLOSED'}</p>
      </div>
    </div>
  );
}
```

Puis ajoutez cette route dans votre routeur et testez:
```
http://localhost:5173/dialog-test
```

---

## 🔍 Problèmes Connus et Solutions

### Problème 1: Portal not found
**Symptôme:** Dialog ne s'affiche pas, pas d'erreur console
**Cause:** Radix UI Portal ne trouve pas le conteneur
**Solution:**
```html
<!-- Vérifiez que dans index.html il y a: -->
<div id="root"></div>
```

### Problème 2: Z-index issues
**Symptôme:** Dialog s'ouvre mais est caché derrière d'autres éléments
**Solution:**
```javascript
// Dans la console, vérifiez:
const overlay = document.querySelector('[data-radix-dialog-overlay]');
const content = document.querySelector('[data-radix-dialog-content]');
console.log('Overlay z-index:', window.getComputedStyle(overlay).zIndex);
console.log('Content z-index:', window.getComputedStyle(content).zIndex);
```

### Problème 3: Click event blocked
**Symptôme:** Clic ne fait rien, pas d'erreur
**Cause:** Un élément parent bloque les events
**Solution:**
```javascript
// Testez avec stopPropagation
const btn = document.querySelector('button');
btn.addEventListener('click', (e) => {
  e.stopPropagation();
  console.log('Button clicked!');
}, true); // useCapture = true
```

### Problème 4: Supabase RLS Policy
**Symptôme:** Dialog s'ouvre mais le formulaire ne sauvegarde pas
**Cause:** RLS policy empêche l'insertion
**Solution:**
```sql
-- Vérifiez les policies
SELECT * FROM pg_policies WHERE tablename = 'competitors';

-- Créez une policy si manquante
CREATE POLICY "Users can insert their own competitors"
ON competitors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

---

## ✅ Validation Rapide

Copiez-collez ce script dans la console pour un diagnostic complet:

```javascript
const diagnose = async () => {
  console.log('=== DIAGNOSTIC COMPLET ===');

  // 1. Auth
  const authToken = localStorage.getItem('sb-8d78b74c-d99b-412c-b6e5-b9e0cb9a4c8b-auth-token');
  console.log('✓ Authenticated:', !!authToken);

  // 2. Page
  console.log('✓ Current URL:', window.location.href);
  console.log('✓ Should be:', 'http://localhost:5173/competitors');

  // 3. Button
  const buttons = document.querySelectorAll('button');
  const addBtn = Array.from(buttons).find(b => b.textContent.includes('Add Competitor'));
  console.log('✓ Add Competitor button exists:', !!addBtn);
  if (addBtn) {
    console.log('✓ Button disabled:', addBtn.disabled);
    console.log('✓ Button onclick:', addBtn.onclick);
  }

  // 4. Dialog components
  console.log('✓ Dialog overlay exists:', !!document.querySelector('[data-radix-dialog-overlay]'));
  console.log('✓ Dialog content exists:', !!document.querySelector('[data-radix-dialog-content]'));

  // 5. React errors
  const hasReactErrors = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.rendererInterfaces?.size > 0;
  console.log('✓ React DevTools detected:', hasReactErrors);

  // 6. Supabase
  console.log('✓ Supabase client exists:', typeof window.supabase !== 'undefined');

  console.log('=== FIN DIAGNOSTIC ===');
};

diagnose();
```

**Résultats attendus:**
```
✓ Authenticated: true
✓ Current URL: http://localhost:5173/competitors
✓ Add Competitor button exists: true
✓ Button disabled: false
✓ Dialog overlay exists: false (normal, fermé au départ)
✓ Dialog content exists: false (normal, fermé au départ)
✓ React DevTools detected: true
✓ Supabase client exists: true
```

Si tous les checks passent mais le Dialog ne s'ouvre pas, il y a probablement un problème avec React state management. Essayez de vider le cache et redémarrer:

```bash
rm -rf node_modules/.vite
npm run dev
```
