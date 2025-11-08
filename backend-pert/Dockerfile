FROM richarvey/nginx-php-fpm:3.1.6

# Copier les fichiers
COPY . /var/www/html

WORKDIR /var/www/html

# Installer les dépendances
RUN composer install --no-dev --optimize-autoloader

# Permissions
RUN chown -R nginx:nginx /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Configuration Nginx pour Laravel
RUN rm -f /etc/nginx/sites-enabled/default.conf && \
    echo 'server {' > /etc/nginx/sites-enabled/default.conf && \
    echo '    listen 8080;' >> /etc/nginx/sites-enabled/default.conf && \
    echo '    server_name _;' >> /etc/nginx/sites-enabled/default.conf && \
    echo '    root /var/www/html/public;' >> /etc/nginx/sites-enabled/default.conf && \
    echo '    index index.php index.html;' >> /etc/nginx/sites-enabled/default.conf && \
    echo '' >> /etc/nginx/sites-enabled/default.conf && \
    echo '    location / {' >> /etc/nginx/sites-enabled/default.conf && \
    echo '        try_files $uri $uri/ /index.php?$query_string;' >> /etc/nginx/sites-enabled/default.conf && \
    echo '    }' >> /etc/nginx/sites-enabled/default.conf && \
    echo '' >> /etc/nginx/sites-enabled/default.conf && \
    echo '    location ~ \.php$ {' >> /etc/nginx/sites-enabled/default.conf && \
    echo '        fastcgi_pass 127.0.0.1:9000;' >> /etc/nginx/sites-enabled/default.conf && \
    echo '        fastcgi_index index.php;' >> /etc/nginx/sites-enabled/default.conf && \
    echo '        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;' >> /etc/nginx/sites-enabled/default.conf && \
    echo '        include fastcgi_params;' >> /etc/nginx/sites-enabled/default.conf && \
    echo '    }' >> /etc/nginx/sites-enabled/default.conf && \
    echo '}' >> /etc/nginx/sites-enabled/default.conf

# Script de démarrage
RUN echo '#!/bin/sh' > /start-laravel.sh && \
    echo 'php artisan config:cache' >> /start-laravel.sh && \
    echo 'php artisan route:cache' >> /start-laravel.sh && \
    echo 'php artisan view:cache' >> /start-laravel.sh && \
    echo 'php-fpm -D' >> /start-laravel.sh && \
    echo 'nginx -g "daemon off;"' >> /start-laravel.sh && \
    chmod +x /start-laravel.sh

CMD ["/start-laravel.sh"]
