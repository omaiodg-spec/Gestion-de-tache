import sqlite3
from contextlib import contextmanager

DATABASE_PATH = "todo.db"


@contextmanager
def get_db():
    """Context manager pour gérer la connexion à la base de données"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Initialise la base de données"""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                priority TEXT DEFAULT 'medium',
                deadline TEXT,
                status TEXT DEFAULT 'pending',
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        conn.commit()


def get_user_by_username(username):
    with get_db() as conn:
        return conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()


def create_user(username, password_hash):
    with get_db() as conn:
        try:
            cursor = conn.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, password_hash))
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None


def get_all_tasks(user_id):
    """Récupère toutes les tâches d'un utilisateur"""
    with get_db() as conn:
        tasks = conn.execute("SELECT * FROM tasks WHERE user_id = ?", (user_id,)).fetchall()
        return [dict(t) for t in tasks]


def add_task(user_id, title, priority='medium', deadline=None):
    """Ajoute une nouvelle tâche"""
    with get_db() as conn:
        conn.execute(
            "INSERT INTO tasks (user_id, title, priority, deadline) VALUES (?, ?, ?, ?)", 
            (user_id, title, priority, deadline)
        )
        conn.commit()


def toggle_task_status(user_id, task_id):
    """Bascule le statut d'une tâche (pending <-> done)"""
    with get_db() as conn:
        task = conn.execute("SELECT status FROM tasks WHERE id=? AND user_id=?", (task_id, user_id)).fetchone()
        if task:
            new_status = 'pending' if task['status'] == 'done' else 'done'
            conn.execute("UPDATE tasks SET status=? WHERE id=? AND user_id=?", (new_status, task_id, user_id))
            conn.commit()


def delete_task(user_id, task_id):
    """Supprime une tâche"""
    with get_db() as conn:
        conn.execute("DELETE FROM tasks WHERE id=? AND user_id=?", (task_id, user_id))
        conn.commit()


def update_task_details(user_id, task_id, title, priority, deadline):
    """Modifie les détails d'une tâche"""
    with get_db() as conn:
        conn.execute(
            "UPDATE tasks SET title=?, priority=?, deadline=? WHERE id=? AND user_id=?", 
            (title, priority, deadline, task_id, user_id)
        )
        conn.commit()
