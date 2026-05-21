let tasks = [];
let currentFilter = 'all';
let isRegisterMode = false;
let editingTaskId = null;
let searchQuery = '';

// Initialiser au chargement du DOM(Document Object Model)
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    checkAuth();
    
    // Support de la touche Entrée pour l'ajout de tâche
    const taskInput = document.getElementById('task-input');
    if (taskInput) {
        taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submitTask();
        });
    }

    // Support de la recherche en temps réel
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim().toLowerCase();
            const clearBtn = document.getElementById('search-clear');
            clearBtn.style.display = searchQuery ? 'flex' : 'none';
            renderTasks();
        });
    }

    // Support de la touche Entrée pour la connexion
    const authPass = document.getElementById('auth-password');
    if (authPass) {
        authPass.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') submitAuth();
        });
    }
});

// --- Theme & Dark Mode ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) {
        toggle.checked = savedTheme === 'dark';
    }
}

function toggleDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    const newTheme = toggle.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// --- Authentification ---
function checkAuth() {
    fetch('/api/me')
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                showApp(data.user.username);
            } else {
                showAuth();
            }
        })
        .catch(err => {
            console.error('Auth error:', err);
            showAuth();
        });
}

function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').textContent = isRegisterMode ? "Inscription" : "Connexion";
    const switchText = isRegisterMode 
        ? 'Déjà un compte ? <a href="#" onclick="toggleAuthMode()">Se connecter</a>' 
        : 'Pas de compte ? <a href="#" onclick="toggleAuthMode()">S\'inscrire</a>';
    document.querySelector('.auth-switch').innerHTML = switchText;
}

function submitAuth() {
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;

    if (!username || !password) {
        showToast('Veuillez remplir tous les champs', 'error');
        return;
    }

    const endpoint = isRegisterMode ? '/api/register' : '/api/login';

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        
        showToast(data.message, 'success');
        document.getElementById('auth-username').value = '';
        document.getElementById('auth-password').value = '';
        showApp(data.user.username);
    })
    .catch(err => {
        showToast(err.message, 'error');
    });
}

function logout() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => {
            showToast('Déconnexion réussie', 'info');
            showAuth();
        });
}

function showApp(username) {
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app-layout').style.display = 'flex';
    document.getElementById('current-username').textContent = username;
    document.getElementById('header-username').textContent = username;
    loadTasks();
}

function showAuth() {
    document.getElementById('auth-overlay').style.display = 'flex';
    document.getElementById('app-layout').style.display = 'none';
    tasks = []; // Clear tasks from memory
}

// --- Tâches ---
function loadTasks() {
    fetch('/api/tasks')
        .then(res => {
            if (!res.ok) {
                if (res.status === 401) {
                    showAuth();
                    throw new Error('Non autorisé');
                }
                throw new Error('Erreur serveur');
            }
            return res.json();
        })
        .then(data => {
            tasks = data;
            renderTasks();
            updateStats();
        })
        .catch(err => {
            if (err.message !== 'Non autorisé') {
                console.error(err);
                showToast('Erreur de connexion au serveur', 'error');
            }
        });
}

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    const filtered = tasks.filter(t => {
        // Filtre par statut
        if (currentFilter !== 'all' && t.status !== currentFilter) return false;
        // Filtre par recherche
        if (searchQuery && !t.title.toLowerCase().includes(searchQuery)) return false;
        return true;
    });

    if (filtered.length === 0) {
        const emptyIcon = searchQuery ? 'fa-search' : 'fa-clipboard-list';
        const emptyTitle = searchQuery ? 'Aucun résultat' : 'Aucune tâche';
        const emptyText = searchQuery
            ? `Aucune tâche ne correspond à "${escapeHtml(searchQuery)}"`
            : "C'est le moment d'être productif !";
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas ${emptyIcon}"></i>
                <h3>${emptyTitle}</h3>
                <p>${emptyText}</p>
            </div>
        `;
        return;
    }

    filtered.forEach(t => {
        const li = document.createElement('li');
        li.className = `task-item ${t.status === 'done' ? 'done' : ''} priority-${t.priority}`;
        li.dataset.id = t.id;
        
        let priorityIcon = '🟡';
        if (t.priority === 'high') priorityIcon = '🔴';
        if (t.priority === 'low') priorityIcon = '🟢';

        let deadlineHtml = '';
        if (t.deadline) {
            const isOverdue = t.status !== 'done' && new Date(t.deadline) < new Date(new Date().setHours(0,0,0,0));
            deadlineHtml = `<span class="task-deadline ${isOverdue ? 'overdue' : ''}"><i class="far fa-calendar-alt"></i> ${escapeHtml(t.deadline)}</span>`;
        }

        li.innerHTML = `
            <label class="custom-checkbox">
                <input type="checkbox" ${t.status === 'done' ? 'checked' : ''} onchange="toggleTask(${t.id})">
                <span class="checkmark"></span>
            </label>
            <div class="task-content">
                <div class="task-title-row">
                    <span class="task-priority-icon" title="Priorité: ${t.priority}">${priorityIcon}</span>
                    <span class="task-title">${escapeHtml(t.title)}</span>
                </div>
                ${deadlineHtml}
            </div>
            <div class="task-actions">
                <button class="btn-icon-action btn-edit" onclick="editTask(${t.id})" title="Modifier">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon-action btn-delete" onclick="deleteTask(${t.id})" title="Supprimer">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        list.appendChild(li);
    });
}

function updateStats() {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    document.getElementById('total-count').textContent = total;
    document.getElementById('done-count').textContent = done;
    document.getElementById('progress-fill').style.width = percent + '%';
    document.getElementById('progress-text').textContent = percent + '% complété';
}

function submitTask() {
    const input = document.getElementById('task-input');
    const prioritySelect = document.getElementById('task-priority');
    const deadlineInput = document.getElementById('task-deadline');
    
    const title = input.value.trim();
    const priority = prioritySelect.value;
    const deadline = deadlineInput.value;

    if (!title) {
        showToast('Veuillez écrire une tâche avant d\'ajouter', 'error');
        input.focus();
        return;
    }

    if (editingTaskId) {
        fetch('/api/tasks/' + editingTaskId + '/edit', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, priority, deadline })
        })
        .then(async res => {
            if (!res.ok) throw new Error('Erreur');
            showToast('Tâche modifiée avec succès', 'success');
            cancelEdit();
            loadTasks();
        })
        .catch(() => showToast('Erreur lors de la modification', 'error'));
    } else {
        fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, priority, deadline })
        })
        .then(async res => {
            if (!res.ok) throw new Error('Erreur');
            input.value = '';
            deadlineInput.value = '';
            showToast('Tâche ajoutée avec succès', 'success');
            loadTasks();
        })
        .catch(() => showToast('Erreur lors de l\'ajout', 'error'));
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    document.getElementById('task-input').value = task.title;
    document.getElementById('task-priority').value = task.priority || 'medium';
    document.getElementById('task-deadline').value = task.deadline || '';
    
    document.getElementById('btn-submit-task').innerHTML = '<i class="fas fa-check"></i>';
    document.getElementById('btn-cancel-edit').style.display = 'inline-block';
    document.getElementById('input-icon').className = 'fas fa-pen';
    document.getElementById('task-input').focus();
}

function cancelEdit() {
    editingTaskId = null;
    document.getElementById('task-input').value = '';
    document.getElementById('task-priority').value = 'medium';
    document.getElementById('task-deadline').value = '';
    
    document.getElementById('btn-submit-task').innerHTML = '<i class="fas fa-paper-plane"></i>';
    document.getElementById('btn-cancel-edit').style.display = 'none';
    document.getElementById('input-icon').className = 'fas fa-plus';
}

function toggleTask(id) {
    fetch('/api/tasks/' + id, { method: 'PUT' })
        .then(() => loadTasks())
        .catch(() => showToast('Erreur lors de la mise à jour', 'error'));
}

function deleteTask(id) {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?');
    if (!confirmed) return;

    const li = document.querySelector(`li[data-id="${id}"]`);
    if (li) li.classList.add('removing');

    setTimeout(() => {
        fetch('/api/tasks/' + id, { method: 'DELETE' })
            .then(() => loadTasks())
            .catch(() => {
                showToast('Erreur', 'error');
                if (li) li.classList.remove('removing');
            });
    }, 300);
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.filter-btn').classList.add('active');
    renderTasks();
}

function clearSearch() {
    searchQuery = '';
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    document.getElementById('search-clear').style.display = 'none';
    searchInput.focus();
    renderTasks();
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
