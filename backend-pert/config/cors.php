<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://pert-app.vercel.app',
        'https://pert-app-*.vercel.app', // Pour les preview deployments Vercel
        'http://localhost:5173',
        'http://localhost:3000',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 86400, // Cache preflight pendant 24h
    'supports_credentials' => false,
];
