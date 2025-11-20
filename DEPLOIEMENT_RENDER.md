# Guide de Déploiement sur Render - Correction CORS

## Problème résolu

Les erreurs CORS entre Vercel (frontend) et Render (backend) ont été corrigées. Voici les modifications effectuées :

1. **Configuration CORS** : `backend-pert/config/cors.php` configuré pour autoriser toutes les origines (`'allowed_origins' => ['*']`)
2. **Middleware CORS** : `backend-pert/bootstrap/app.php` mis à jour pour appliquer correctement le middleware HandleCors aux routes API

## Instructions de déploiement sur Render

### 1. Assurez-vous que les fichiers modifiés sont déployés

Les fichiers suivants ont été modifiés et doivent être dans votre dépôt Git :

- ✅ `backend-pert/config/cors.php`
- ✅ `backend-pert/bootstrap/app.php`

### 2. Après le déploiement sur Render

**Important** : Après chaque déploiement sur Render, vous devez vider le cache de configuration Laravel :

1. Connectez-vous à votre service Render
2. Allez dans la section **Shell** ou utilisez **SSH** pour vous connecter
3. Exécutez les commandes suivantes :

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 3. Configuration automatique (recommandé)

Pour automatiser ces commandes après chaque déploiement, ajoutez-les à votre script de démarrage.

Vérifiez votre fichier `start.sh` :

```bash
#!/bin/bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
```

### 4. Vérification de la configuration CORS

Pour vérifier que la configuration CORS fonctionne :

1. **Testez votre backend directement** :
   ```bash
   curl -H "Origin: https://pert-app.vercel.app" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://pert-backend-4ngk.onrender.com/api/pert/calculate
   ```

   Vous devriez voir les en-têtes CORS dans la réponse :
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: *
   Access-Control-Allow-Headers: *
   ```

2. **Testez depuis votre frontend** :
   - Allez sur votre site Vercel : `https://pert-app.vercel.app`
   - Ouvrez la console du navigateur (F12)
   - Essayez de faire une requête
   - Vous ne devriez plus voir d'erreur CORS

### 5. Si le problème persiste

Si vous rencontrez encore des erreurs CORS après avoir déployé et vidé le cache :

1. **Vérifiez que les fichiers sont bien déployés** :
   - Allez sur votre dépôt Git
   - Vérifiez que `config/cors.php` et `bootstrap/app.php` contiennent les modifications

2. **Vérifiez le cache de configuration** :
   - Connectez-vous à Render via SSH
   - Exécutez : `php artisan config:clear && php artisan cache:clear`

3. **Vérifiez les logs Render** :
   - Allez dans la section **Logs** de votre service Render
   - Cherchez les erreurs liées à CORS ou au middleware

4. **Vérifiez que le middleware est bien appliqué** :
   - Dans `bootstrap/app.php`, assurez-vous que `HandleCors` est bien dans `api(prepend: [...])`

## Configuration finale

### `backend-pert/config/cors.php`
```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // Permet toutes les origines
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```

### `backend-pert/bootstrap/app.php`
```php
->withMiddleware(function (Middleware $middleware) {
    // Ajouter CORS au début de la chaîne pour les routes API
    $middleware->api(prepend: [
        \Illuminate\Http\Middleware\HandleCors::class,
    ]);
})
```

## Notes importantes

- ⚠️ **N'oubliez pas de vider le cache** après chaque déploiement sur Render
- ✅ La configuration CORS autorise toutes les origines (`*`) pour simplifier le déploiement
- 🔒 Pour plus de sécurité en production, vous pouvez restreindre les origines CORS en spécifiant les domaines Vercel exacts dans `config/cors.php`

