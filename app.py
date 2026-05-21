import os
from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models.database import (
    init_db, get_all_tasks, add_task, toggle_task_status, delete_task,
    get_user_by_username, create_user, update_task_details
)
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'default_dev_key_12345')
CORS(app, supports_credentials=True)

# Initialiser la base de données
init_db()

# --- Décorateur d'authentification ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Non autorisé"}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- Routes Pages ---
@app.route('/')
def home():
    return render_template("index.html")

# --- Routes Auth ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({"error": "Nom d'utilisateur et mot de passe requis"}), 400

    if get_user_by_username(username):
        return jsonify({"error": "Ce nom d'utilisateur existe déjà"}), 400

    user_id = create_user(username, generate_password_hash(password))
    if user_id:
        session['user_id'] = user_id
        session['username'] = username
        return jsonify({"message": "Inscription réussie", "user": {"username": username}}), 201
    return jsonify({"error": "Erreur lors de l'inscription"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = get_user_by_username(username)
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        return jsonify({"message": "Connexion réussie", "user": {"username": user['username']}}), 200

    return jsonify({"error": "Identifiants invalides"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Déconnexion réussie"}), 200

@app.route('/api/me', methods=['GET'])
def me():
    if 'user_id' in session:
        return jsonify({"user": {"username": session['username']}}), 200
    return jsonify({"user": None}), 200

# --- Routes API Tâches ---

@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    """Récupère toutes les tâches de l'utilisateur connecté"""
    tasks = get_all_tasks(session['user_id'])
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    """Crée une nouvelle tâche"""
    data = request.json
    title = data.get('title', '').strip()
    priority = data.get('priority', 'medium')
    deadline = data.get('deadline')
    
    if not title:
        return jsonify({"error": "Le titre ne peut pas être vide"}), 400
    
    add_task(session['user_id'], title, priority, deadline)
    return jsonify({"message": "Tâche ajoutée avec succès"}), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    """Bascule le statut d'une tâche"""
    toggle_task_status(session['user_id'], task_id)
    return jsonify({"message": "Tâche mise à jour"}), 200

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def remove_task(task_id):
    """Supprime une tâche"""
    delete_task(session['user_id'], task_id)
    return jsonify({"message": "Tâche supprimée"}), 200

@app.route('/api/tasks/<int:task_id>/edit', methods=['PUT'])
@login_required
def edit_task(task_id):
    """Modifie les détails d'une tâche"""
    data = request.json
    title = data.get('title', '').strip()
    priority = data.get('priority', 'medium')
    deadline = data.get('deadline')
    
    if not title:
        return jsonify({"error": "Le titre ne peut pas être vide"}), 400
    
    update_task_details(session['user_id'], task_id, title, priority, deadline)
    return jsonify({"message": "Tâche modifiée avec succès"}), 200

# --- Lancer le serveur ---
if __name__ == '__main__':
    app.run(debug=True)
