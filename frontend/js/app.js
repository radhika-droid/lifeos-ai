const API = 'http://127.0.0.1:5000';
let currentEnergy = localStorage.getItem('energy') || 'medium';
let timerInterval = null;
let timerSeconds = 25 * 60;
let timerRunning = false;

// ===== THEME =====
const themeBtn = document.getElementById('themeBtn');
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
  if (themeBtn) themeBtn.textContent = t === 'dark' ? '🌙' : '☀️';
}
applyTheme(localStorage.getItem('theme') || 'dark');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}

// ===== ROUTER =====
const App = {
  currentPage: 'dashboard',
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) targetPage.classList.add('active');
    const navEl = document.getElementById('nav-' + page);
    if (navEl) navEl.classList.add('active');
    this.currentPage = page;
    if (page === 'dashboard' && window.Dashboard) Dashboard.init();
    if (page === 'habits' && window.Habits) Habits.init();
    if (page === 'wellness' && window.Wellness) Wellness.init();
    if (page === 'notifications' && window.Notifications) Notifications.init();
    if (page === 'profile' && window.Profile) Profile.init();
  },

  toast(msg, type = 'info') {
    const c = document.getElementById('toastContainer');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },

  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};

window.showToast = App.toast;

document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    App.navigate(a.getAttribute('data-page'));
  });
});
const notifBtn = document.getElementById('notifBtn');
if (notifBtn) {
  notifBtn.addEventListener('click', () => App.navigate('notifications'));
}

// ===== ENERGY =====
document.querySelectorAll('.energy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    currentEnergy = btn.getAttribute('data-energy');
    localStorage.setItem('energy', currentEnergy);
    App.refreshDecision();
  });
});
// Set saved energy
document.querySelectorAll('.energy-btn').forEach(b => {
  b.classList.toggle('selected', b.getAttribute('data-energy') === currentEnergy);
});

// ===== GREET =====
function setGreeting() {
  const h = new Date().getHours();
  const greetings = ['Good night', 'Good night', 'Good night', 'Good night', 'Good night', 'Good night',
    'Good morning', 'Good morning', 'Good morning', 'Good morning', 'Good morning', 'Good morning',
    'Good afternoon', 'Good afternoon', 'Good afternoon', 'Good afternoon', 'Good afternoon', 'Good afternoon',
    'Good evening', 'Good evening', 'Good evening', 'Good evening', 'Good night', 'Good night'];
  const profile = localStorage.getItem('lifeos_profile');
  let name = '';
  if (profile) {
    try { name = JSON.parse(profile).name; } catch(e) {}
  }
  const greetEl = document.getElementById('greeting');
  if (greetEl) greetEl.textContent = `${greetings[h]}, ${name || 'friend'}! 👋`;
  const dateEl = document.getElementById('dateDisplay');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', {weekday:'long',year:'numeric',month:'long',day:'numeric'});
}

// ===== AI DECISION =====
App.refreshDecision = async function() {
  try {
    const tasksResp = await fetch(`${API}/api/tasks`);
    const tasks = await tasksResp.json();
    const activeTasks = tasks.filter(t => !t.completed).map(t => ({
      name: t.name, priority: t.priority, urgency: t.urgency,
      difficulty: t.difficulty, time: t.time_estimate, type: t.category
    }));
    if (activeTasks.length === 0) {
      document.getElementById('heroTaskName').textContent = 'No active tasks!';
      document.getElementById('heroReason').textContent = 'Add some tasks to get AI-powered recommendations.';
      document.getElementById('scoreValue').textContent = '—';
      return;
    }
    const resp = await fetch(`${API}/decide`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({tasks: activeTasks, energy: currentEnergy})
    });
    const data = await resp.json();
    if (data.recommended_task) {
      document.getElementById('heroTaskName').textContent = data.recommended_task.name;
      document.getElementById('heroReason').textContent = data.reason;
      document.getElementById('scoreValue').textContent = data.recommended_task.score;
      document.getElementById('timerTaskLabel').textContent = '🎯 ' + data.recommended_task.name;
      const pct = Math.min(100, Math.max(0, (data.recommended_task.score / 20) * 100));
      document.getElementById('scoreRing').style.background =
        `conic-gradient(var(--accent) ${pct}%, var(--bg-input) 0%)`;
    }
  } catch(e) { console.error('Decision error', e); }
};

// ===== TASK MANAGEMENT =====
App.openAddTask = function() {
  document.getElementById('addTaskModal').classList.add('open');
  document.getElementById('newTaskName').focus();
};
App.closeAddTask = function() {
  document.getElementById('addTaskModal').classList.remove('open');
};
App.saveTask = async function() {
  const name = document.getElementById('newTaskName').value.trim();
  if (!name) { App.toast('Task name is required', 'error'); return; }
  const body = {
    name, category: document.getElementById('newTaskCategory').value,
    priority: +document.getElementById('newTaskPriority').value,
    urgency: +document.getElementById('newTaskUrgency').value,
    difficulty: +document.getElementById('newTaskDifficulty').value,
    time_estimate: +document.getElementById('newTaskTime').value,
    due_date: document.getElementById('newTaskDue').value || null
  };
  try {
    await fetch(`${API}/api/tasks`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    App.closeAddTask();
    document.getElementById('newTaskName').value = '';
    App.toast('Task added! ✅', 'success');
    if (window.Dashboard) {
      Dashboard.loadTasks();
      Dashboard.loadStats();
    }
    App.refreshDecision();
  } catch(e) { App.toast('Failed to add task', 'error'); }
};

// ===== POMODORO =====
App.setTimer = function(minutes) { timerSeconds = minutes * 60; App.updateTimerDisplay(); };
App.updateTimerDisplay = function() {
  const m = Math.floor(timerSeconds / 60).toString().padStart(2,'0');
  const s = (timerSeconds % 60).toString().padStart(2,'0');
  const el = document.getElementById('timerDisplay');
  if (el) el.textContent = `${m}:${s}`;
};
App.toggleTimer = function() {
  if (timerRunning) {
    clearInterval(timerInterval); timerRunning = false;
    document.getElementById('timerStartBtn').textContent = '▶ Resume';
  } else {
    timerRunning = true;
    document.getElementById('timerStartBtn').textContent = '⏸ Pause';
    timerInterval = setInterval(() => {
      timerSeconds--;
      App.updateTimerDisplay();
      if (timerSeconds <= 0) {
        clearInterval(timerInterval); timerRunning = false;
        document.getElementById('timerStartBtn').textContent = '▶ Start';
        App.toast('⏰ Focus session complete! Take a break.', 'success');
      }
    }, 1000);
  }
};
App.resetTimer = function() {
  clearInterval(timerInterval); timerRunning = false;
  timerSeconds = 25 * 60;
  App.updateTimerDisplay();
  const btn = document.getElementById('timerStartBtn');
  if (btn) btn.textContent = '▶ Start';
};

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open', 'active'); });
});

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  setGreeting();
  App.navigate('dashboard');
  if (window.Notifications) Notifications.refresh();
});
