# Configuration pour la Production (Vercel + Render)

## Problème résolu

Le problème de communication entre le frontend (Vercel) et le backend (Render) a été corrigé. Les modifications suivantes ont été apportées :

1. **Correction de `frontend-pert/src/services/api.js`** : Utilise maintenant la variable d'environnement `VITE_API_URL` au lieu d'une URL codée en dur.
2. **Correction de `frontend-pert/src/App.tsx`** : Harmonisé avec la même logique pour utiliser `VITE_API_URL`.
3. **Amélioration de la configuration CORS** : La configuration Laravel accepte maintenant toutes les origines.

## Configuration requise

### 1. Configuration dans Vercel (Frontend)

1. Allez dans votre projet Vercel
2. Cliquez sur **Settings** → **Environment Variables**
3. Ajoutez la variable suivante :
   - **Nom** : `VITE_API_URL`
   - **Valeur** : L'URL de votre backend Render (ex: `https://votre-app.onrender.com`)
   - **Environnements** : Sélectionnez tous les environnements (Production, Preview, Development)

**Important** : N'incluez PAS `/api` dans l'URL. Le code ajoute automatiquement `/api` à la fin.

**Exemple** :
```
VITE_API_URL=https://mon-backend-pert.onrender.com
```

4. Après avoir ajouté la variable, vous devez **redéployer** votre application Vercel pour que les changements prennent effet.

### 2. Configuration dans Render (Backend)

Assurez-vous que votre backend Laravel est correctement déployé sur Render :

1. Vérifiez que votre service est en cours d'exécution
2. Notez l'URL de votre service (elle devrait ressembler à `https://votre-app.onrender.com`)
3. Assurez-vous que le fichier `config/cors.php` autorise toutes les origines (c'est déjà configuré)

### 3. Vérification

Pour vérifier que tout fonctionne :

1. **Vérifier que le backend répond** :
   - Ouvrez dans votre navigateur : `https://votre-backend.onrender.com/api/pert/projects`
   - Vous devriez voir une réponse JSON

2. **Vérifier la configuration CORS** :
   - Ouvrez la console du navigateur sur votre site Vercel
   - Essayez de faire une requête
   - Vous ne devriez pas voir d'erreur CORS

3. **Tester une requête** :
   - Utilisez votre application Vercel
   - Ajoutez une tâche et générez le diagramme
   - Cela devrait fonctionner maintenant

## Variables d'environnement résumées

### Frontend (Vercel)
- `VITE_API_URL` : URL de base du backend Render (ex: `https://mon-backend.onrender.com`)

### Backend (Render)
- Aucune configuration supplémentaire nécessaire pour le CORS

## Notes importantes

- ⚠️ **Ne mettez jamais `/api` dans `VITE_API_URL`** : Le code ajoute automatiquement `/api` à la fin de l'URL
- 🔄 **Redéployez après avoir ajouté/modifié les variables d'environnement** dans Vercel
- ✅ La configuration CORS autorise toutes les origines (`*`) pour simplifier le déploiement
- 🔒 Pour plus de sécurité en production, vous pouvez restreindre les origines CORS dans `backend-pert/config/cors.php` en spécifiant les domaines Vercel exacts

## Dépannage

Si vous rencontrez encore des problèmes :

1. **Erreur CORS** :
   - Vérifiez que le backend Render est accessible
   - Vérifiez que `config/cors.php` a `'allowed_origins' => ['*']`

2. **404 Not Found** :
   - Vérifiez que l'URL du backend est correcte dans `VITE_API_URL`
   - Assurez-vous que le backend a bien `/api` dans ses routes

3. **Timeout** :
   - Render peut mettre quelques secondes à démarrer le service
   - Vérifiez que votre service Render n'est pas en mode "sleep" (services gratuits)

