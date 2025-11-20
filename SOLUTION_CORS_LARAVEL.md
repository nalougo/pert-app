# Solution CORS pour Laravel (Backend) avec Vercel (Frontend)

## ✅ Corrections appliquées

J'ai appliqué une solution CORS adaptée à **Laravel** (et non Node.js comme mentionné dans certaines réponses). Voici ce qui a été corrigé :

### 1. **Route OPTIONS pour les requêtes preflight** (`routes/api.php`)
- Ajout d'une route OPTIONS catch-all qui intercepte **toutes** les requêtes preflight
- Cette route répond immédiatement avec les en-têtes CORS nécessaires
- Cela garantit que les requêtes OPTIONS sont gérées avant qu'elles n'atteignent le middleware

### 2. **Configuration CORS améliorée** (`config/cors.php`)
- Spécification explicite de l'origine Vercel : `https://pert-app.vercel.app`
- Ajout du pattern pour les preview deployments : `https://pert-app-*.vercel.app`
- Support des origines locales pour le développement
- `max_age` défini à 86400 (24h) pour mettre en cache les réponses preflight

### 3. **Middleware CORS** (`bootstrap/app.php`)
- Le middleware `HandleCors` de Laravel est déjà configuré avec priorité haute
- Il s'applique automatiquement aux routes API

## 🚀 Déploiement

### 1. Commit et push

```bash
git add backend-pert/routes/api.php backend-pert/config/cors.php
git commit -m "Fix CORS: Ajouter route OPTIONS et configurer origines Vercel"
git push
```

### 2. Redéployer sur Render

Render va automatiquement :
- Redéployer votre backend avec les nouvelles modifications
- Mettre à jour la configuration CORS

**Important** : Attendez que le déploiement soit complètement terminé (vérifiez les logs Render).

### 3. Vider le cache Laravel (si nécessaire)

Si vous pouvez accéder au shell Render :

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache
```

## ✅ Vérification

### Test 1 : Requête OPTIONS (preflight)

```bash
curl -X OPTIONS \
     -H "Origin: https://pert-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -v \
     https://pert-backend-4ngk.onrender.com/api/pert/calculate
```

**Résultat attendu** :
- Status: 200 OK
- Headers: `Access-Control-Allow-Origin: https://pert-app.vercel.app`
- Headers: `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
- Headers: `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin`

### Test 2 : Depuis le frontend Vercel

1. Allez sur `https://pert-app.vercel.app`
2. Ouvrez la console du navigateur (F12)
3. Essayez d'ajouter une tâche et générer le diagramme
4. **Aucune erreur CORS ne devrait apparaître**

## 🔍 Pourquoi cette solution fonctionne

1. **Route OPTIONS explicite** : Capture toutes les requêtes preflight avant qu'elles n'atteignent le middleware
2. **Configuration CORS Laravel** : Spécifie explicitement les origines autorisées (Vercel)
3. **Middleware HandleCors** : Ajoute les en-têtes CORS à toutes les réponses API
4. **Double protection** : Si une méthode échoue, l'autre prend le relais

## 📋 Fichiers modifiés

- ✅ `backend-pert/routes/api.php` - Route OPTIONS catch-all
- ✅ `backend-pert/config/cors.php` - Configuration CORS avec origines spécifiques

## 🔒 Sécurité

- **Origines spécifiques** : Au lieu de `'*'`, nous spécifions explicitement les domaines Vercel
- **Headers contrôlés** : Seuls les headers nécessaires sont autorisés
- **Credentials désactivés** : `supports_credentials` est à `false` pour la sécurité

## 📝 Notes importantes

- ⚠️ Cette solution est spécifique à **Laravel** (PHP), pas à Node.js/Express
- ✅ La configuration CORS est maintenant correctement appliquée pour Vercel
- 🔄 Après le déploiement, testez immédiatement depuis votre frontend Vercel
- 🐛 Si l'erreur persiste, vérifiez les logs Render et videz le cache Laravel

