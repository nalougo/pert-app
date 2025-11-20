# 🖼️ Génération de l'Image du Diagramme PERT
## Comment le Frontend génère et télécharge l'image

---

## 📍 Fichier Principal

**Fichier** : `frontend-pert/src/components/PertDiagram.tsx`

---

## 🎨 Processus de Génération

Le diagramme est généré en **3 étapes** :

1. **Création du SVG** : Le diagramme est d'abord dessiné en SVG (Scalable Vector Graphics)
2. **Conversion SVG → Canvas** : Le SVG est converti en Canvas HTML5
3. **Export Canvas → PNG** : Le Canvas est converti en image PNG téléchargeable

---

## 📝 Code Complet de la Fonction

### **Fonction `downloadDiagram()`** (lignes 70-102)

```typescript
const downloadDiagram = () => {
  // Étape 1 : Vérifier que le SVG existe
  if (!svgRef.current) return;

  // Étape 2 : Convertir le SVG en chaîne de caractères XML
  const svgData = new XMLSerializer().serializeToString(svgRef.current);
  
  // Étape 3 : Créer un Canvas HTML5
  const canvas = document.createElement('canvas');
  canvas.width = svgWidth * 2;   // Double la résolution pour meilleure qualité
  canvas.height = svgHeight * 2;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return;

  // Étape 4 : Créer une image à partir du SVG
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  // Étape 5 : Quand l'image est chargée, la dessiner sur le Canvas
  img.onload = () => {
    // Fond blanc
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner l'image SVG sur le Canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Étape 6 : Convertir le Canvas en Blob PNG
    canvas.toBlob((blob) => {
      if (blob) {
        // Étape 7 : Créer un lien de téléchargement
        const link = document.createElement('a');
        link.download = 'diagramme-pert.png';  // Nom du fichier
        link.href = URL.createObjectURL(blob);
        link.click();  // Déclencher le téléchargement
        
        // Nettoyer l'URL créée
        URL.revokeObjectURL(url);
      }
    });
  };

  // Charger l'image SVG
  img.src = url;
};
```

---

## 🔍 Explication Détaillée Étape par Étape

### **Étape 1 : Référence au SVG**
```typescript
const svgRef = useRef<SVGSVGElement>(null);
```
- Utilise `useRef` pour référencer l'élément SVG dans le DOM
- Le SVG est rendu dans le JSX (lignes 125-267)

### **Étape 2 : Sérialisation du SVG**
```typescript
const svgData = new XMLSerializer().serializeToString(svgRef.current);
```
- Convertit l'élément SVG en chaîne XML
- Permet de manipuler le SVG comme du texte

### **Étape 3 : Création du Canvas**
```typescript
const canvas = document.createElement('canvas');
canvas.width = svgWidth * 2;   // Résolution 2x pour meilleure qualité
canvas.height = svgHeight * 2;
const ctx = canvas.getContext('2d');
```
- Crée un Canvas HTML5 invisible
- Double la résolution pour une image plus nette
- Obtient le contexte 2D pour dessiner

### **Étape 4 : Création du Blob SVG**
```typescript
const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
const url = URL.createObjectURL(svgBlob);
```
- Crée un Blob (objet binaire) à partir du SVG
- Génère une URL temporaire pour charger l'image

### **Étape 5 : Chargement et Dessin**
```typescript
img.onload = () => {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);  // Fond blanc
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);  // Dessiner le SVG
};
```
- Attend que l'image SVG soit chargée
- Dessine un fond blanc
- Dessine le SVG sur le Canvas

### **Étape 6 : Conversion en PNG**
```typescript
canvas.toBlob((blob) => {
  // blob contient l'image PNG
});
```
- Convertit le Canvas en Blob PNG
- Format PNG pour une bonne qualité

### **Étape 7 : Téléchargement**
```typescript
const link = document.createElement('a');
link.download = 'diagramme-pert.png';
link.href = URL.createObjectURL(blob);
link.click();
```
- Crée un lien de téléchargement invisible
- Déclenche le téléchargement automatiquement
- Le fichier est sauvegardé avec le nom `diagramme-pert.png`

---

## 🎨 Création du SVG (Affichage)

Le SVG est créé dans le JSX (lignes 125-267) :

```typescript
<svg
  ref={svgRef}  // Référence pour le téléchargement
  width={svgWidth}
  height={svgHeight}
  className="bg-white"
>
  {/* Définir les marqueurs pour les flèches */}
  <defs>
    <marker id="arrowhead">...</marker>
    <marker id="arrowhead-critical">...</marker>
  </defs>

  {/* Dessiner les arêtes (lignes entre les nœuds) */}
  {Array.from(result.tasks.values()).map(task => (
    task.predecessors.map((predId: string) => {
      return (
        <line
          x1={x1} y1={y1}
          x2={x2} y2={y2}
          stroke={isCritical ? '#dc2626' : '#666'}
          strokeWidth={isCritical ? '3' : '2'}
        />
      );
    })
  ))}

  {/* Dessiner les nœuds (rectangles avec les informations) */}
  {Array.from(result.tasks.entries()).map(([taskId, task]) => {
    return (
      <g key={taskId}>
        <rect ... />  {/* Rectangle principal */}
        <text ... />  {/* Textes avec les données */}
      </g>
    );
  })}
</svg>
```

---

## 🔄 Flux Complet

```
┌─────────────────┐
│  Utilisateur    │
│  clique sur     │
│  "Télécharger"  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ downloadDiagram │
│   () => { ... } │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SVG → String   │
│  (XMLSerializer)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  String → Blob  │
│  (SVG Blob)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Blob → Image   │
│  (new Image())  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Image → Canvas │
│  (drawImage)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Canvas → PNG   │
│  (toBlob)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PNG → Download │
│  (link.click)   │
└─────────────────┘
```

---

## 🎯 Points Clés

1. **SVG d'abord** : Le diagramme est d'abord créé en SVG (vectoriel, scalable)
2. **Canvas intermédiaire** : Le Canvas sert d'intermédiaire pour la conversion
3. **PNG final** : Le format PNG est utilisé pour le téléchargement (bonne qualité)
4. **Résolution 2x** : Le Canvas est 2x plus grand pour une meilleure qualité
5. **Tout côté client** : Tout se passe dans le navigateur, pas de serveur nécessaire

---

## 📋 Technologies Utilisées

- **SVG** : Format vectoriel pour le dessin
- **Canvas API** : API HTML5 pour la manipulation d'images
- **Blob API** : Pour créer des objets binaires
- **URL.createObjectURL** : Pour créer des URLs temporaires
- **XMLSerializer** : Pour convertir le SVG en texte XML

---

## 💡 Pourquoi cette Approche ?

1. **Qualité** : SVG → Canvas → PNG garantit une bonne qualité
2. **Flexibilité** : Le SVG peut être modifié avant conversion
3. **Performance** : Tout se fait côté client, pas de charge serveur
4. **Compatibilité** : Fonctionne dans tous les navigateurs modernes

---

## 🎤 Points pour la Présentation

1. **Le diagramme est d'abord créé en SVG** (format vectoriel)
2. **Conversion SVG → Canvas** pour manipulation
3. **Export Canvas → PNG** pour téléchargement
4. **Tout se passe dans le navigateur** (côté client)
5. **Résolution doublée** pour meilleure qualité d'image

---

**Fichier complet** : `frontend-pert/src/components/PertDiagram.tsx`
**Fonction principale** : `downloadDiagram()` (lignes 70-102)

