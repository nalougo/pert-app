#!/bin/bash

# Lancer les commandes Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Lancer les migrations (optionnel, commentez si non souhaité)
# php artisan migrate --force

# Démarrer PHP-FPM et Nginx
php-fpm -D
nginx -g 'daemon off;'
