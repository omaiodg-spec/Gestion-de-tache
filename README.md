# ⚡ Gestionnaire de Tâches - Guide Complet

Bienvenue ! Voici un gestionnaire de tâches complet et dynamique avec un design moderne (glassmorphism) et interactif.
Ce projet utilise un backend **Flask** performant connecté à une base de données **SQLite** sécurisée, et une interface
frontend dynamique développée en **HTML5/CSS3** et **Vanilla JavaScript**.

## 📂 Structure du Projet

Environ/
├── models/
│   ├── __init__.py            # Initialisation du module models

│   └── database.py            # Gestion de la base de données (requêtes SQLite)

├── static/
│   ├── css/
│   │   └── styles.css         # Design moderne, responsive et animations fluides

│   └── js/
│       └── logique.js         # Logique dynamique, appels AJAX (fetch) et toasts

├── templates/
│   └── index.html             # Page principale de l'application (Interface client)

├── .env/                      # Environnement virtuel Python (à exclure sur Git)

├── app.py                     # Serveur principal Flask & Routes de l'API

├── todo.db                    # Base de données locale SQLite (générée automatiquement)

├── .gitignore                 # Fichiers à ignorer par Git (comme .env et todo.db)

├── CODE_DOCUMENTATION.md      # Documentation complète pour le développement

└── README.md                  # Ce fichier d'introduction et guide complet



## 🎯 Fonctionnalités Clés

### 🔒 1. Système de Sessions & Sécurité
*   **Authentification complète** : Formulaires d'inscription et de connexion pour chaque utilisateur.
*   **Sécurisation des mots de passe** : Hachage sécurisé à l'aide de `PBKDF2` (via la bibliothèque `Werkzeug`).
*   **Protection CSRF & SQL** : Utilisation de requêtes SQL paramétrées (`?`) pour empêcher toute injection SQL.

### 📋 2. Gestion Interactive des Tâches (CRUD)
*   **Ajout rapide** : Création instantanée avec un titre, un niveau de priorité (**Faible**, **Moyenne**, **Élevée**) et une date limite de réalisation (deadline).
*   **Édition en temps réel** : Possibilité de modifier le titre, la priorité ou la date limite d'une tâche existante via une modale ou un formulaire intégré.
*   **Bascule d'état** : Cochez/décochez les tâches pour les marquer comme terminées (barrées visuellement).
*   **Suppression animée** : Retrait définitif d'une tâche avec une micro-animation de glissement.

### 📊 3. Suivi et Filtrage des Données
*   **Statistiques en temps réel** : Indicateurs visuels du nombre total de tâches, du nombre de tâches terminées, et une barre de progression dynamique.
*   **Filtres rapides** : Onglets interactifs permettant d'afficher uniquement *Toutes*, *À faire*, ou *Terminées*.
*   **Toasts de Notification** : Alertes élégantes en haut de l'écran pour confirmer les actions de l'utilisateur (connexion réussie, tâche ajoutée, erreur, etc.).

---

## ⚙️ Installation & Démarrage rapide

### 1. Activer l'environnement virtuel Python
**Sur Windows (PowerShell) :**
```powershell
.env\Scripts\Activate.ps1
```
**Sur macOS / Linux :**
```bash
source .env/bin/activate
```

### 2. Installer les dépendances nécessaires
```bash
pip install Flask flask-cors
```

### 3. Lancer l'application Flask
```bash
python app.py
```
Ouvrez ensuite votre navigateur et accédez à l'adresse suivante : [http://localhost:5000](http://localhost:5000)

---

## 🔌 API Endpoints (Résumé)

### Authentification
*   `POST /api/register` : Créer un nouveau compte utilisateur.
*   `POST /api/login` : Se connecter à l'application.
*   `POST /api/logout` : Se déconnecter (efface la session).
*   `GET /api/me` : Récupérer les informations de la session active.

### Tâches (Requiert d'être connecté)
*   `GET /api/tasks` : Récupérer toutes les tâches de l'utilisateur.
*   `POST /api/tasks` : Ajouter une nouvelle tâche.
*   `PUT /api/tasks/<id>` : Basculer l'état (terminée / en cours).
*   `PUT /api/tasks/<id>/edit` : Modifier les détails (titre, priorité, date).
*   `DELETE /api/tasks/<id>` : Supprimer définitivement la tâche.

---

## 💡 Évolutions Futures
*   [ ] Notifications de rappel par e-mail ou sur le navigateur avant la date limite.
*   [ ] Ajout de catégories ou tags personnalisés (Travail, Personnel, Études, etc.).
*   [ ] Mode sombre (Dark/Light mode) commutable.
*   [ ] Exportation des tâches dans un format externe (Excel/PDF).
