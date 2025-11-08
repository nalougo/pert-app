# PERT Diagram Generator

Application web Laravel permettant de générer des diagrammes PERT  à partir de tâches saisies par l'utilisateur. Le système calcule automatiquement les dates au plus tôt/au plus tard, les marges (totale et libre), identifie le chemin critique et génère un diagramme interactif.

![Laravel](https://img.shields.io/badge/Laravel-11.x-red.svg)
![PHP](https://img.shields.io/badge/PHP-8.2+-blue.svg)

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Architecture](#-architecture)
- [Algorithme PERT](#-algorithme-pert)
- [Export et partage](#-export-et-partage)
- [Dépannage](#-dépannage)

## ✨ Fonctionnalités

### Saisie des données
- **Interface intuitive** : Formulaire dynamique avec ajout/suppression de tâches en temps réel
- **Paramétrage T0** : Date de début du projet configurable (par défaut: 1)
- **Saisie simplifiée** : 
  - Durée en jours (entiers)
  - Prédécesseurs multiples dans un seul champ (séparés par espaces ou virgules, ex: `A B` ou `A, B`)
  - Exemple pré-rempli disponible pour tester rapidement

### Calculs PERT automatiques
- **Dates au plus tôt** : D+tôt (Début au plus tôt) et F+tôt (Fin au plus tôt)
- **Dates au plus tard** : D+tard (Début au plus tard) et F+tard (Fin au plus tard)
- **Marges** :
  - Marge totale : flexibilité pour retarder une tâche sans retarder le projet
  - Marge libre : flexibilité sans impacter les tâches suivantes
- **Chemin critique** : Identification automatique des tâches critiques (marge totale = 0)
- **Durée du projet** : Calcul automatique de la durée totale

### Visualisation
- **Diagramme horizontal** : Graphique orienté gauche→droite pour une meilleure lisibilité
- **Mise en évidence** : Tâches critiques en rouge dans le diagramme
- **Tableau récapitulatif** : Vue détaillée de toutes les métriques par tâche
- **Restauration automatique** : Les données saisies sont conservées si vous revenez au formulaire

### Exports
- **Diagramme SVG** : Export vectoriel de haute qualité
- **Diagramme PNG** : Export image pour documents et présentations
- **Tableau CSV** : Export des données du tableau récapitulatif

## 🔧 Prérequis

- **PHP** : Version 8.2 ou supérieure
- **Composer** : Gestionnaire de dépendances PHP
- **Node.js** (optionnel) : Uniquement si vous souhaitez compiler les assets avec Vite

> **Note** : L'application fonctionne sans base de données. Aucune configuration de DB n'est requise.

## 🚀 Installation

1. **Cloner ou télécharger le projet**
   ```bash
   cd pert-app
   ```

2. **Installer les dépendances PHP**
   ```bash
   composer install
   ```

3. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Lancer l'application**
   ```bash
   php artisan serve
   ```

5. **Accéder à l'application**
   - Ouvrir votre navigateur à l'adresse : `http://127.0.0.1:8000`
   - Vous serez automatiquement redirigé vers `/pert` (formulaire de saisie)

## 📖 Utilisation

### Étape 1 : Saisir les tâches

1. **Définir la date de début (T0)**
   - Par défaut : 1
   - Peut être modifiée selon vos besoins

2. **Ajouter des tâches**
   - Cliquez sur **"+ Ajouter une tâche"**
   - Pour chaque tâche :
     - **Nom** : Code court unique (A, B, C, etc.)
     - **Durée** : Nombre de jours (entier)
     - **Prédécesseurs** (optionnel) : 
       - Codes des tâches précédentes
       - Plusieurs prédécesseurs peuvent être saisis dans un même champ
       - Format : `A B` ou `A, B` (espaces ou virgules)

3. **Exemple rapide**
   - Cliquez sur **"Remplir un exemple (A,B,C)"** pour pré-remplir un exemple simple

### Étape 2 : Générer le diagramme

1. Cliquez sur **"Générer"**
2. Le système :
   - Valide les données (prédécesseurs existants, pas de cycles)
   - Calcule toutes les métriques PERT
   - Génère le diagramme et le tableau

### Étape 3 : Consulter les résultats

- **Diagramme PERT** : Visualisation graphique du réseau de tâches
- **Tableau récapitulatif** : Détails complets pour chaque tâche
  - D+tôt, F+tôt, D+tard, F+tard
  - Marge totale et marge libre
  - Statut critique (Oui/Non)

### Étape 4 : Exporter (optionnel)

- **Exporter SVG** : Pour intégrer dans des documents vectoriels
- **Exporter PNG** : Pour présentation ou impression
- **Exporter CSV** : Pour analyse dans Excel/LibreOffice

## 🏗️ Architecture

### Structure du projet

```
pert-app/
├── app/
│   ├── Http/Controllers/
│   │   └── PertController.php      # Validation, traitement des données
│   ├── Models/
│   │   └── Task.php                 # Modèle de tâche (mapping données)
│   └── Services/
│       └── PertService.php          # Logique PERT (calculs, Mermaid)
├── resources/
│   └── views/
│       ├── layouts/
│       │   └── app.blade.php        # Layout principal
│       └── pert/
│           ├── form.blade.php       # Formulaire de saisie
│           └── result.blade.php     # Page de résultats
├── routes/
│   └── web.php                      # Définition des routes
└── README.md
```

### Composants principaux

#### `PertService.php`
Service central contenant la logique métier :
- **Tri topologique** (algorithme de Kahn) pour ordonner les tâches
- **Passe avant** : Calcul des dates au plus tôt (ES, EF)
- **Passe arrière** : Calcul des dates au plus tard (LS, LF)
- **Marges** : Calcul de la marge totale et marge libre
- **Chemin critique** : Identification des tâches critiques
- **Génération Mermaid** : Création du code du diagramme

#### `PertController.php`
Contrôleur gérant :
- Validation des données d'entrée
- Nettoyage et normalisation (uppercase, parsing prédécesseurs multiples)
- Détection de cycles et validation des dépendances
- Stockage en session pour restauration
- Gestion des erreurs et messages utilisateur

#### Vues Blade
- **form.blade.php** : Interface de saisie dynamique (JavaScript vanilla)
- **result.blade.php** : Affichage diagramme Mermaid + tableau + exports

## 🧮 Algorithme PERT

### Règles de calcul (entiers)

#### Passe avant (Dates au plus tôt)

- **Tâche initiale** (sans prédécesseur) :
  - `D+tôt = T0`
  - `F+tôt = D+tôt + durée - 1`

- **Tâche avec prédécesseurs** :
  - `D+tôt = max(F+tôt des prédécesseurs) + 1`
  - `F+tôt = D+tôt + durée - 1`

- **Fin du projet** :
  - `T_f = max(F+tôt de toutes les tâches)`

#### Passe arrière (Dates au plus tard)

- **Tâche terminale** (sans successeur) :
  - `F+tard = T_f`
  - `D+tard = F+tard - durée + 1`

- **Tâche avec successeurs** :
  - `F+tard = min(D+tard des successeurs) - 1`
  - `D+tard = F+tard - durée + 1`

#### Marges

- **Marge totale** :
  - `MargeTot = D+tard - D+tôt`
  - Indique la flexibilité totale pour retarder une tâche

- **Marge libre** :
  - Si la tâche a des successeurs : `MargeLibre = min(D+tôt des successeurs) - 1 - F+tôt`
  - Sinon : `MargeLibre = T_f - F+tôt`
  - Indique la flexibilité sans impacter les tâches suivantes

#### Chemin critique

Les tâches avec **MargeTot = 0** forment le chemin critique. Aucun retard n'est autorisé sur ces tâches sans retarder le projet global.

### Validation des données

Le système vérifie automatiquement :
- ✅ Absence de cycles dans les dépendances
- ✅ Existence des prédécesseurs référencés
- ✅ Absence d'auto-dépendances (une tâche ne peut pas se précéder)
- ✅ Durée valide (entier > 0)

## Export et partage

### Export SVG
- Format vectoriel, idéal pour intégration dans documents
- Qualité infinie, redimensionnable sans perte
- Compatible avec Illustrator, Inkscape, etc.

### Export PNG
- Format image raster
- Fond blanc pour impression
- Dimensions automatiques selon le diagramme

### Export CSV
- Toutes les données du tableau récapitulatif
- Séparateur : virgule
- Compatible Excel, LibreOffice Calc, Google Sheets

##  Dépannage

### Problème : "View [layouts.app] not found"
**Solution** : Vérifiez que le fichier `resources/views/layouts/app.blade.php` existe.

### Problème : "Cycle détecté dans les dépendances"
**Solution** : Vérifiez vos prédécesseurs. Une tâche ne peut pas dépendre directement ou indirectement d'elle-même.

**Exemple de cycle** :
- A → B → C → A ❌
- A → B → C → D ✅

### Problème : "Le prédécesseur 'X' n'existe pas"
**Solution** : Vérifiez que tous les codes de prédécesseurs correspondent exactement aux noms de tâches (attention à la casse, normalement convertie en majuscules).

### Problème : Diagramme ne s'affiche pas
**Solution** :
1. Vérifiez la console du navigateur (F12) pour les erreurs JavaScript
2. Vérifiez votre connexion internet (Mermaid est chargé via CDN)
3. Vérifiez que les données sont valides (pas de cycles, prédécesseurs existants)

### Problème : Données perdues après retour au formulaire
**Solution** : Les données sont automatiquement restaurées depuis la session. Si cela ne fonctionne pas, vérifiez que les cookies sont activés dans votre navigateur.

### Problème : Export ne fonctionne pas
**Solution** :
- **SVG/PNG** : Attendez que le diagramme soit complètement rendu (chargement Mermaid terminé)
- **CSV** : Vérifiez les permissions d'écriture du navigateur pour télécharger les fichiers

## 🔮 Évolutions possibles

- [ ] Persistance des projets dans une base de données
- [ ] Import depuis CSV/Excel
- [ ] Export PDF côté serveur
- [ ] Mode PERT probabiliste (a/m/b avec variance)
- [ ] Calcul de probabilité d'achèvement
- [ ] Gestion des ressources et contraintes
- [ ] Diagramme Gantt en complément
- [ ] API REST pour intégration externe
- [ ] Tests unitaires automatisés

## 📝 Exemple de données

### Projet simple : A → B → C

```
T0: 1
Tâche A: Durée 5 jours, Prédécesseurs: (aucun)
Tâche B: Durée 2 jours, Prédécesseurs: A
Tâche C: Durée 4 jours, Prédécesseurs: B
```

**Résultat attendu** :
- Durée projet : 11 jours (5 + 2 + 4)
- Chemin critique : A → B → C (toutes les tâches sont critiques)

### Projet avec parallélisme : A → (B, C) → D

```
T0: 1
Tâche A: Durée 3 jours, Prédécesseurs: (aucun)
Tâche B: Durée 2 jours, Prédécesseurs: A
Tâche C: Durée 5 jours, Prédécesseurs: A
Tâche D: Durée 1 jour, Prédécesseurs: B C
```

**Résultat attendu** :
- Durée projet : 9 jours (3 + 5 + 1)
- Chemin critique : A → C → D
- Tâche B a une marge totale de 3 jours

