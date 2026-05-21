# 📚 Documentation complète du code

## ❓ Pourquoi `__init__.py` est vide ?

En Python 3, le fichier `__init__.py` **n'a plus besoin d'être vide**. Voici pourquoi :

### Python 2 vs Python 3

**Python 2 :**
```python
# __init__.py OBLIGATOIRE ET NON VIDE pour que Python reconnaisse les packages
# Sinon, les imports ne fonctionnent pas
```

**Python 3.3+ (Namespace Packages) :**
```python
# __init__.py OPTIONNEL - Python reconnaît automatiquement les dossiers
# Le fichier peut rester vide ou contenir du code pour initialiser le package
```

### Trois options valides :

#### ✅ Option 1 : Vide (actuellement utilisée)
```python
# models/__init__.py
# Le dossier est reconnu comme package
```
**Avantage** : Simple, minimal
**Inconvénient** : Pas d'initialisation du package

#### ✅ Option 2 : Avec une docstring
```python
# models/__init__.py
"""
Couche de modèle de l'application - gère la logique base de données
"""
```
**Avantage** : Documentation du package
**Inconvénient** : Minimaliste

#### ✅ Option 3 : Avec imports pré-configurés
```python
# models/__init__.py
"""Module de gestion des données"""
from models.database import (
    init_db,
    get_all_tasks,
    add_task,
    toggle_task_status,
    delete_task
)

__all__ = [
    'init_db',
    'get_all_tasks',
    'add_task',
    'toggle_task_status',
    'delete_task'
]
```
**Avantage** : Imports plus faciles dans le reste du code
**Inconvénient** : Plus lourd pour un petit projet

**Recommandation pour ce projet** : Laisser vide est parfait pour maintenant, mais Option 2 ou 3 seraient mieux à long terme.

---

## 🏗️ Architecture globale

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (HTML/CSS/JS)                │
│                    templates/index.html                 │
│              static/css/styles.css                      │
│              static/js/logique.js                       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP Requests
                         │ fetch('/api/tasks')
                         ▼
┌─────────────────────────────────────────────────────────┐
│                 Backend Flask (Python)                  │
│                      app.py                             │
│    - Route principal (/)                                │
│    - Routes API (/api/tasks...)                         │
└────────────────┬──────────────────────────────────────┬─┘
                 │                                      │
                 │ Import fonctions                    │
                 │                                      │
                 ▼                                      ▼
    ┌──────────────────────────┐      ┌──────────────────┐
    │  models/database.py      │      │   todo.db        │
    │  - init_db()             │──────│  Base de données │
    │  - get_all_tasks()       │      │  SQLite          │
    │  - add_task()            │      └──────────────────┘
    │  - toggle_task_status()  │
    │  - delete_task()         │
    │  - Context manager       │
    └──────────────────────────┘
```

---

## 📄 Fichiers détaillés

### 1️⃣ `models/database.py` - Couche base de données

**Rôle** : Gérer toutes les opérations avec la base de données SQLite

#### Concepts importants

**Context Manager (`@contextmanager`)** :
```python
@contextmanager
def get_db():
    """Context manager pour gérer la connexion à la base de données"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Permet d'accéder aux colonnes par nom
    try:
        yield conn  # Remet la connexion à qui l'appelle
    finally:
        conn.close()  # Ferme automatiquement la connexion
```

**Avantages du context manager** :
- ✅ Ferme automatiquement la connexion même en cas d'erreur
- ✅ Évite les fuites de connexion
- ✅ Syntaxe élégante : `with get_db() as conn:`
- ✅ Meilleure gestion des ressources

**Utilisation** :
```python
def add_task(title):
    with get_db() as conn:  # La connexion s'ouvre
        conn.execute("INSERT INTO tasks (title) VALUES (?)", (title,))
        conn.commit()
    # La connexion se ferme automatiquement ici
```

#### Fonctions détaillées

| Fonction | Paramètres | Retour | Explication |
|----------|-----------|--------|-------------|
| `init_db()` | Aucun | Aucun | Crée la table `tasks` si elle n'existe pas |
| `get_all_tasks()` | Aucun | Liste de dictionnaires | Récupère toutes les tâches avec SELECT * |
| `add_task(title)` | `title` (str) | Aucun | Insère une nouvelle tâche avec statut par défaut 'pending' |
| `toggle_task_status(task_id)` | `task_id` (int) | Aucun | Change 'pending' → 'done' ou 'done' → 'pending' |
| `delete_task(task_id)` | `task_id` (int) | Aucun | Supprime la tâche par son ID |

#### Schéma de base de données

```sql
CREATE TABLE tasks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,  -- Clé primaire auto-incrémentée
    title           TEXT NOT NULL,                      -- Titre de la tâche (obligatoire)
    status          TEXT DEFAULT 'pending'              -- État : 'pending' ou 'done'
)
```

---

### 2️⃣ `app.py` - Serveur Flask

**Rôle** : Gérer les routes HTTP et la logique serveur

#### Initialisation
```python
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS  # Active les requêtes cross-origin
from models.database import init_db, get_all_tasks, add_task, toggle_task_status, delete_task

app = Flask(__name__)  # Crée l'application Flask
CORS(app)  # Autorise les requêtes depuis n'importe quel domaine
init_db()  # Initialise la BD au démarrage
```

#### Routes

##### 1. Route principale
```python
@app.route('/')
def home():
    """Affiche la page HTML principale"""
    return render_template("index.html")
```
- **URL** : `http://localhost:5000/`
- **Méthode** : GET
- **Retour** : Fichier HTML

##### 2. GET /api/tasks
```python
@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Récupère toutes les tâches"""
    tasks = get_all_tasks()
    return jsonify(tasks)
```
- **Requête** : `fetch('/api/tasks')`
- **Réponse** : `[{id: 1, title: "...", status: "pending"}, ...]`
- **Code HTTP** : 200 OK

##### 3. POST /api/tasks
```python
@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Crée une nouvelle tâche"""
    data = request.json
    title = data.get('title', '').strip()
    
    if not title:
        return jsonify({"error": "Le titre ne peut pas être vide"}), 400
    
    add_task(title)
    return jsonify({"message": "Tâche ajoutée avec succès"}), 201
```
- **Requête** : 
  ```javascript
  fetch('/api/tasks', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({title: "Ma tâche"})
  })
  ```
- **Validation** : Vérifie que le titre n'est pas vide
- **Code HTTP** : 201 Created

##### 4. PUT /api/tasks/<id>
```python
@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Bascule le statut d'une tâche"""
    toggle_task_status(task_id)
    return jsonify({"message": "Tâche mise à jour"}), 200
```
- **Requête** : `fetch('/api/tasks/1', {method: 'PUT'})`
- **Action** : Bascule pending ↔ done
- **Code HTTP** : 200 OK

##### 5. DELETE /api/tasks/<id>
```python
@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def remove_task(task_id):
    """Supprime une tâche"""
    delete_task(task_id)
    return jsonify({"message": "Tâche supprimée"}), 200
```
- **Requête** : `fetch('/api/tasks/1', {method: 'DELETE'})`
- **Action** : Supprime la tâche définitivement
- **Code HTTP** : 200 OK

#### Codes HTTP utilisés

| Code | Situation | Exemple |
|------|-----------|---------|
| 200 | ✅ Succès (GET, PUT, DELETE) | Tâche récupérée/mise à jour/supprimée |
| 201 | ✅ Ressource créée (POST) | Nouvelle tâche ajoutée |
| 400 | ❌ Mauvaise requête | Titre vide |
| 500 | ❌ Erreur serveur | Erreur base de données |

---

### 3️⃣ `static/js/logique.js` - Logique JavaScript

**Rôle** : Gérer l'interface utilisateur et la communication avec le serveur

#### Variables globales

```javascript
let tasks = [];           // Stocke toutes les tâches
let currentFilter = 'all'; // Filtre actuel : 'all', 'pending', 'done'
```

#### Initialisation au chargement

```javascript
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();  // Charge les tâches au démarrage
    
    // Support de la touche Entrée pour ajouter une tâche
    const taskInput = document.getElementById('task-input');
    if (taskInput) {
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });
    }
});
```

#### Principales fonctions

##### 1. `loadTasks()` - Récupère les tâches du serveur
```javascript
function loadTasks() {
    fetch('/api/tasks')
        .then(res => {
            if (!res.ok) throw new Error('Erreur serveur');
            return res.json();
        })
        .then(data => {
            tasks = data;           // Stocke les tâches
            renderTasks();          // Affiche les tâches
            updateStats();          // Met à jour les statistiques
        })
        .catch(err => {
            console.error(err);
            showToast('Erreur de connexion au serveur', 'error');
        });
}
```

**Flux** :
1. Envoie GET à `/api/tasks`
2. Réception de la liste JSON
3. Met à jour l'affichage
4. Gère les erreurs avec un toast

##### 2. `renderTasks()` - Affiche les tâches filtrées
```javascript
function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    const filtered = tasks.filter(t => {
        if (currentFilter === 'all') return true;
        return t.status === currentFilter;
    });
    
    // Si aucune tâche : affiche un message vide
    // Sinon : crée les éléments HTML pour chaque tâche
}
```

**Points importants** :
- Filtre les tâches selon `currentFilter`
- Utilise `escapeHtml()` pour éviter les injections XSS
- Ajoute des event listeners aux boutons

##### 3. `addTask()` - Ajoute une nouvelle tâche
```javascript
function addTask() {
    const input = document.getElementById('task-input');
    const title = input.value.trim();

    if (!title) {
        showToast('Veuillez écrire une tâche avant d\'ajouter', 'error');
        input.focus();
        return;
    }

    fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title })
    })
    .then(res => res.json())
    .then(() => {
        input.value = '';
        showToast('Tâche ajoutée avec succès', 'success');
        loadTasks();  // Recharge la liste
    })
    .catch(() => {
        showToast('Erreur lors de l\'ajout', 'error');
    });
}
```

**Validation** :
- ✅ Vérifie que le titre n'est pas vide
- ✅ Nettoie l'input après succès
- ✅ Recharge la liste

##### 4. `toggleTask(id)` - Change le statut
```javascript
function toggleTask(id) {
    fetch('/api/tasks/' + id, { method: 'PUT' })
        .then(() => {
            const task = tasks.find(t => t.id === id);
            const isDone = task && task.status !== 'done';
            showToast(isDone ? 'Tâche terminée !' : 'Tâche réactivée', 'success');
            loadTasks();
        })
        .catch(() => {
            showToast('Erreur lors de la mise à jour', 'error');
        });
}
```

**Fonctionnement** :
- Envoie PUT au serveur
- Le serveur bascule automatiquement le statut
- Recharge et affiche le bon message

##### 5. `deleteTask(id)` - Supprime avec animation
```javascript
function deleteTask(id) {
    const li = document.querySelector(`li[data-id="${id}"]`);
    if (li) li.classList.add('removing');  // Animation de départ

    setTimeout(() => {  // Attend la fin de l'animation
        fetch('/api/tasks/' + id, { method: 'DELETE' })
            .then(() => {
                showToast('Tâche supprimée', 'info');
                loadTasks();
            })
            .catch(() => {
                showToast('Erreur lors de la suppression', 'error');
                if (li) li.classList.remove('removing');  // Annule l'animation
            });
    }, 300);
}
```

**Animation** :
- Ajoute la classe `removing` (anime la disparition)
- Envoie DELETE après 300ms
- Supprime ou réaffiche selon le résultat

##### 6. `updateStats()` - Met à jour les statistiques
```javascript
function updateStats() {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    document.getElementById('total-count').textContent = total;
    document.getElementById('done-count').textContent = done;
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-text').textContent = percent + '% complété';
}
```

**Calculs** :
- Total = nombre de tâches
- Faites = nombre avec statut 'done'
- Pourcentage = (faites / total) × 100

##### 7. Fonction utilitaire : `escapeHtml()`
```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;  // Échappe automatiquement
    return div.innerHTML;     // Récupère le HTML échappé
}
```

**Sécurité** :
- ✅ Prévient les injections XSS
- ✅ Si l'utilisateur tape `<script>`, sera affiché comme texte

---

### 4️⃣ `templates/index.html` - Structure HTML

**Rôle** : Fournir l'interface utilisateur

#### Structure

```html
<head>
    <!-- Ressources externes -->
    <link> Google Fonts (Poppins)
    <link> Font Awesome (icônes)
    <link> CSS personnalisé (styles.css)
</head>
<body>
    <div class="container">
        <!-- En-tête avec titre -->
        <!-- Barre de statistiques (total, pourcentage, complétées) -->
        <!-- Formulaire d'ajout de tâche -->
        <!-- Boutons de filtre -->
        <!-- Liste des tâches -->
    </div>
    
    <!-- Conteneur des notifications -->
    <div class="toast-container"></div>
    
    <!-- Script JavaScript -->
    <script src="{{ url_for('static', filename='js/logique.js') }}"></script>
</body>
```

#### Elements principaux

| ID | Rôle | Utilisé par |
|----|------|-----------|
| `task-input` | Champ texte pour ajouter | `addTask()` |
| `task-list` | Liste des tâches | `renderTasks()` |
| `total-count` | Nombre total | `updateStats()` |
| `done-count` | Nombre fait | `updateStats()` |
| `progress-fill` | Barre de progression | `updateStats()` |
| `toast-container` | Notifications | `showToast()` |

#### Utilisation de `url_for()`

```html
<link rel="stylesheet" href="{{ url_for('static', filename='css/styles.css') }}">
<script src="{{ url_for('static', filename='js/logique.js') }}"></script>
```

**Avantage** : Génère les URL correctes même si on change la structure

---

### 5️⃣ `static/css/styles.css` - Stylisation

**Rôle** : Donner le look moderne et responsive à l'app

#### Variables CSS (thème)

```css
:root {
    --primary: #e879a6;           /* Rose principal */
    --primary-dark: #db2777;      /* Rose foncé */
    --primary-light: #f9a8d4;     /* Rose clair */
    --success: #34d399;           /* Vert */
    --danger: #f87171;            /* Rouge */
    --warning: #fbbf24;           /* Orange */
}
```

#### Animations principales

```css
@keyframes slideUp { ... }     /* Barre monte au démarrage */
@keyframes taskEnter { ... }   /* Tâche apparaît */
@keyframes taskLeave { ... }   /* Tâche disparaît */
@keyframes gradientBG { ... }  /* Dégradé anime */
@keyframes checkPop { ... }    /* Case à cocher popup */
```

#### Classes importantes

| Classe | Rôle |
|--------|------|
| `.container` | Boîte principale avec effet glassmorphism |
| `.task-item` | Une tâche dans la liste |
| `.task-item.done` | Tâche complétée (barré) |
| `.task-item.removing` | Animation de suppression |
| `.empty-state` | Message quand aucune tâche |
| `.toast` | Notification en haut à droite |

---

## 🔄 Flux de communication complet

### Exemple : Ajouter une tâche

```
1. Utilisateur écrit "Faire les courses"
2. Clique sur "Ajouter" OU appuie sur Entrée
   ↓
3. JavaScript : addTask() est appelée
   ├─ Valide que le titre n'est pas vide
   ├─ Envoie POST /api/tasks {title: "Faire les courses"}
   └─ Affiche le message "Tâche ajoutée avec succès"
   ↓
4. Flask : route create_task() reçoit la requête
   ├─ Valide le titre côté serveur
   ├─ Appelle add_task("Faire les courses")
   └─ Retourne 201 avec message de succès
   ↓
5. models/database.py : add_task() insère en BD
   ├─ Se connecte à todo.db
   ├─ INSERT INTO tasks (title) VALUES (...)
   ├─ Commit la transaction
   └─ Ferme la connexion automatiquement
   ↓
6. JavaScript reçoit la réponse 201
   ├─ Vide le champ input
   ├─ Affiche toast "Tâche ajoutée"
   ├─ Appelle loadTasks()
   └─ Recharge et affiche la nouvelle tâche
   ↓
7. Utilisateur voit sa tâche dans la liste
```

---

## 🛡️ Sécurité

### Protections en place

| Menace | Protection |
|--------|-----------|
| **XSS (Injection script)** | `escapeHtml()` + `textContent` |
| **Titre vide** | Validation côté client ET serveur |
| **SQL Injection** | Requêtes paramétrées avec `?` |
| **CORS** | `CORS(app)` active les domaines croisés |

### Exemple de protection SQL

```python
# ❌ Dangereux (SQL injection possible)
conn.execute(f"INSERT INTO tasks (title) VALUES ('{title}')")

# ✅ Sécurisé (paramètre séparé)
conn.execute("INSERT INTO tasks (title) VALUES (?)", (title,))
```

---

## 🚀 Démarrage / Arrêt

### Démarrer le serveur
```bash
cd C:\Users\oumaima\Environ
.env\Scripts\Activate.ps1      # Activer l'environnement
python app.py                   # Lancer Flask
```

### Accéder à l'app
```
http://localhost:5000
```

### Arrêter le serveur
```
Ctrl + C dans le terminal
```

---

## 📊 Résumé des dépendances

| Dépendance | Rôle |
|-----------|------|
| **Flask** | Serveur web Python |
| **flask-cors** | Permet requêtes cross-origin |
| **sqlite3** | Base de données (inclus dans Python) |

---

## 🔍 Débogage

### Logs à vérifier

```bash
# Vérifier les imports
python -c "from models.database import init_db; print('OK')"

# Lancer Flask avec debug activé
python app.py  # debug=True par défaut
```

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `ModuleNotFoundError: models` | Mauvais chemin d'import | Vérifier le dossier `models/` existe |
| `addTask is not defined` | Script pas chargé | Vérifier `url_for()` dans le HTML |
| `404 Not Found /api/tasks` | Route inexistante | Vérifier l'URL exacte |
| `Connexion DB refusée` | Fichier `todo.db` corrompu | Supprimer et relancer |

---

## 💡 Améliorations possibles

1. **Ajouter une BD pour les utilisateurs** (user id → tâches privées)
2. **Ajouter une date limite** pour chaque tâche
3. **Ajouter des catégories** (travail, personnel, etc.)
4. **Ajouter une recherche** pour filtrer les tâches
5. **Ajouter la persistance de session** (localStorage)
6. **Tests unitaires** pour chaque fonction
7. **Déploiement** sur Heroku/PythonAnywhere
8. **API documentation** avec Swagger

