# 📡 Communication Frontend ↔ Backend
## Présentation - Application PERT

---

## 🎯 Vue d'ensemble

L'application utilise une **architecture client-serveur** :
- **Frontend** : React + TypeScript (déployé sur **Vercel**)
- **Backend** : Laravel (PHP) (déployé sur **Render**)
- **Communication** : API REST via HTTP/HTTPS

---

## 📊 Flux de Communication

```
┌─────────────────┐                    ┌─────────────────┐
│   FRONTEND      │                    │    BACKEND      │
│   (Vercel)      │                    │   (Render)      │
│                 │                    │                 │
│  React/TS       │  1. Requête HTTP  │  Laravel API    │
│  + Axios        │ ─────────────────>│  + Routes       │
│                 │                    │  + Controller   │
│                 │  2. Réponse JSON   │                 │
│                 │ <─────────────────│                 │
└─────────────────┘                    └─────────────────┘
```

---

## 🔵 CÔTÉ FRONTEND

### 1. **Fichier principal : `frontend-pert/src/App.tsx`**

**Ligne 11-13** : Configuration de l'URL de l'API
```typescript
const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://localhost:8000/api";
```

**Ligne 52-66** : Fonction qui envoie la requête
```typescript
const handleGenerateDiagram = async () => {
  // ...
  try {
    // Appel à l'API Laravel
    const response = await axios.post(`${API_URL}/pert/calculate`, {
      tasks,    // Données envoyées
      t0        // Date de début
    });
    
    // Traitement de la réponse
    const tasksMap = new Map();
    response.data.tasks.forEach((task: any) => {
      tasksMap.set(task.id, task);
    });
    // ...
  }
}
```

**Rôle** : 
- Définit l'URL du backend (variable d'environnement ou localhost)
- Envoie les données (tâches) au backend via `axios.post()`
- Reçoit et traite la réponse JSON

---

### 2. **Service API : `frontend-pert/src/services/api.js`**

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:8000/api';

export const generatePertDiagram = async (tasks, t0) => {
  const response = await axios.post(`${API_URL}/pert/calculate`, {
    tasks,
    t0
  });
  return response.data;
};
```

**Rôle** : 
- Fonction réutilisable pour les appels API
- Encapsule la logique de communication
- Retourne directement les données

---

### 3. **Configuration : Variable d'environnement**

**Fichier** : `.env` ou configuration Vercel
```
VITE_API_URL=https://pert-backend-4ngk.onrender.com
```

**Rôle** : 
- Permet de changer l'URL du backend selon l'environnement
- En développement : `http://localhost:8000`
- En production : `https://pert-backend-4ngk.onrender.com`

---

## 🔴 CÔTÉ BACKEND

### 1. **Routes API : `backend-pert/routes/api.php`**

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PertApiController;

// Route OPTIONS pour CORS (requêtes preflight)
Route::options('/{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
        ->header('Access-Control-Max-Age', '86400');
})->where('any', '.*');

// Route principale pour le calcul PERT
Route::post('/pert/calculate', [PertApiController::class, 'calculate']);

// Autres routes
Route::get('/pert/projects', [PertApiController::class, 'listProjects']);
Route::get('/pert/projects/{filename}', [PertApiController::class, 'getProject']);
Route::delete('/pert/projects/{filename}', [PertApiController::class, 'deleteProject']);
```

**Rôle** : 
- Définit les **endpoints** (URLs) accessibles
- Associe chaque route à un **contrôleur**
- Gère les requêtes CORS (preflight)

**URL complète** : `https://pert-backend-4ngk.onrender.com/api/pert/calculate`

---

### 2. **Contrôleur : `backend-pert/app/Http/Controllers/Api/PertApiController.php`**

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\PertService;

class PertApiController extends Controller
{
    public function calculate(Request $request, PertService $pert)
    {
        try {
            // 1. VALIDATION des données reçues
            $validated = $request->validate([
                't0' => ['nullable', 'integer', 'min:1'],
                'tasks' => ['required', 'array', 'min:1'],
                'tasks.*.id' => ['required', 'string'],
                'tasks.*.duration' => ['required', 'numeric', 'gt:0'],
                'tasks.*.predecessors' => ['array'],
            ]);

            // 2. PRÉPARATION des données
            $prepared = [];
            foreach ($validated['tasks'] as $task) {
                $prepared[] = [
                    'name' => strtoupper(trim($task['id'])),
                    'expected_duration' => max(1, round($task['duration'])),
                    'predecessors' => $task['predecessors'] ?? [],
                ];
            }

            // 3. CALCUL via le service
            $result = $pert->compute($prepared, $validated['t0'] ?? 1);

            // 4. FORMATAGE de la réponse
            $response = [
                'tasks' => $tasks,
                'projectDuration' => $result['duration'],
                'criticalPath' => $result['critical'],
                'criticalEdges' => $criticalEdges,
            ];

            // 5. RETOUR de la réponse JSON
            return response()->json($response);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage(),
            ], 500);
        }
    }
}
```

**Rôle** : 
- **Reçoit** les données du frontend
- **Valide** les données
- **Traite** les données (calcul PERT)
- **Retourne** une réponse JSON

---

### 3. **Configuration CORS : `backend-pert/config/cors.php`**

```php
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://pert-app.vercel.app',      // Frontend Vercel
        'https://pert-app-*.vercel.app',    // Preview deployments
        'http://localhost:5173',            // Dev local
    ],
    'allowed_headers' => ['*'],
    'max_age' => 86400,
];
```

**Rôle** : 
- Autorise les requêtes depuis le frontend Vercel
- Configure les en-têtes CORS
- Sécurise la communication cross-origin

---

### 4. **Middleware CORS : `backend-pert/bootstrap/app.php`**

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        \Illuminate\Http\Middleware\HandleCors::class,
    ]);
})
```

**Rôle** : 
- Applique automatiquement les en-têtes CORS
- S'exécute avant chaque requête API

---

## 🔄 Flux Complet d'une Requête

### Exemple : Calcul du diagramme PERT

#### **Étape 1 : Frontend envoie la requête**
```typescript
// frontend-pert/src/App.tsx
const response = await axios.post(
  'https://pert-backend-4ngk.onrender.com/api/pert/calculate',
  {
    tasks: [
      { id: 'A', duration: 5, predecessors: [] },
      { id: 'B', duration: 3, predecessors: ['A'] }
    ],
    t0: 1
  }
);
```

#### **Étape 2 : Backend reçoit la requête**
```php
// backend-pert/routes/api.php
Route::post('/pert/calculate', [PertApiController::class, 'calculate']);
```

#### **Étape 3 : Contrôleur traite la requête**
```php
// backend-pert/app/Http/Controllers/Api/PertApiController.php
public function calculate(Request $request, PertService $pert) {
    // Validation
    // Calcul
    // Retour JSON
}
```

#### **Étape 4 : Backend envoie la réponse**
```json
{
  "tasks": [
    {
      "id": "A",
      "duration": 5,
      "earliestStart": 1,
      "earliestFinish": 6,
      "isCritical": true
    }
  ],
  "projectDuration": 9,
  "criticalPath": ["A", "B"]
}
```

#### **Étape 5 : Frontend reçoit et affiche**
```typescript
// frontend-pert/src/App.tsx
setResult(cpmResult);
setShowDiagram(true);
```

---

## 📁 Récapitulatif des Fichiers

### **FRONTEND** (React/TypeScript)
| Fichier | Rôle |
|---------|------|
| `frontend-pert/src/App.tsx` | Composant principal, envoie les requêtes |
| `frontend-pert/src/services/api.js` | Service API réutilisable |
| `.env` ou Vercel Config | Variable `VITE_API_URL` |

### **BACKEND** (Laravel/PHP)
| Fichier | Rôle |
|---------|------|
| `backend-pert/routes/api.php` | Définit les routes/endpoints |
| `backend-pert/app/Http/Controllers/Api/PertApiController.php` | Traite les requêtes |
| `backend-pert/config/cors.php` | Configuration CORS |
| `backend-pert/bootstrap/app.php` | Configuration middleware |

---

## 🔑 Points Clés à Retenir

1. **Frontend → Backend** : Requête HTTP POST avec données JSON
2. **Backend → Frontend** : Réponse JSON avec résultats
3. **CORS** : Nécessaire car frontend et backend sont sur des domaines différents
4. **Axios** : Bibliothèque utilisée pour les requêtes HTTP
5. **Routes Laravel** : Définissent les endpoints API
6. **Contrôleurs** : Traitent la logique métier

---

## 🎤 Points pour la Présentation

1. **Architecture** : Client-serveur séparés (Vercel + Render)
2. **Communication** : API REST (HTTP/JSON)
3. **Sécurité** : CORS configuré pour autoriser les requêtes cross-origin
4. **Flux** : Frontend envoie → Backend traite → Backend répond → Frontend affiche
5. **Technologies** : React (frontend) + Laravel (backend)

---

## 💡 Questions Possibles

**Q : Pourquoi CORS est nécessaire ?**
R : Le frontend (Vercel) et le backend (Render) sont sur des domaines différents. CORS autorise cette communication.

**Q : Comment changer l'URL du backend ?**
R : Modifier la variable d'environnement `VITE_API_URL` dans Vercel ou `.env` local.

**Q : Que se passe-t-il si le backend est indisponible ?**
R : Le frontend affiche une erreur (gérée dans le `catch` du try/catch).

---

**Bon courage pour votre présentation ! 🚀**

