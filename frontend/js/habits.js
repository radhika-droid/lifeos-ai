const Habits = {
  habits: [],
  logs: [],

  async init() {
    await this.loadHabits();
    await this.loadLogs();
    this.render();
  },

  async loadHabits() {
    try {
      const res = await fetch(`${API}/api/habits`);
      if (res.ok) {
        this.habits = await res.json();
      }
    } catch (err) {
      console.error('Failed to load habits:', err);
    }
  },

  async loadLogs() {
    try {
      const res = await fetch(`${API}/api/habits/logs`);
      if (res.ok) {
        this.logs = await res.json();
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  },

  async seedDefaults() {
    try {
      const res = await fetch(`${API}/api/habits/seed`, { method: 'POST' });
      const data = await res.json();
      App.toast(data.message || 'Default habits loaded!', 'success');
      await this.init();
    } catch (err) {
      App.toast('Failed to seed habits', 'error');
    }
  },

  openAdd() {
    document.getElementById('addHabitModal').classList.add('active');
  },

  closeAdd() {
    document.getElementById('addHabitModal').classList.remove('active');
  },

  async saveCustom() {
    const name = document.getElementById('newHabitName').value.trim();
    if (!name) {
      App.toast('Please enter a habit name', 'error');
      return;
    }
    const emoji = document.getElementById('newHabitEmoji').value.trim() || '✨';
    const target_value = parseFloat(document.getElementById('newHabitTarget').value) || 1;
    const unit = document.getElementById('newHabitUnit').value.trim() || 'times';
    const description = document.getElementById('newHabitDesc').value.trim();

    try {
      const res = await fetch(`${API}/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji, target_value, unit, description })
      });
      if (res.ok) {
        App.toast('Habit created!', 'success');
        this.closeAdd();
        document.getElementById('newHabitName').value = '';
        await this.init();
      } else {
        App.toast('Failed to create habit', 'error');
      }
    } catch (err) {
      App.toast('Error creating habit', 'error');
    }
  },

  async log(habitId, val = 1) {
    try {
      const res = await fetch(`${API}/api/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: val })
      });
      if (res.ok) {
        const data = await res.json();
        App.toast(`Progress logged! +${val}`, 'success');
        await this.init();
      }
    } catch (err) {
      App.toast('Failed to log habit', 'error');
    }
  },

  render() {
    this.renderStats();
    this.renderHeatmap();
    this.renderList();
  },

  renderStats() {
    const total = this.habits.length;
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = this.logs.filter(l => l.date === today);
    const completedTodayCount = todayLogs.filter(l => l.completed).length;

    const pct = total > 0 ? Math.round((completedTodayCount / total) * 100) : 0;
    document.getElementById('habitTodayPct').textContent = `${pct}%`;
    document.getElementById('habitTotalCount').textContent = total;

    const bestStreak = this.habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    document.getElementById('habitBestStreak').textContent = `${bestStreak}🔥`;

    const autoCount = this.habits.filter(h => h.is_auto_tracked).length;
    document.getElementById('habitAutoCount').textContent = `${autoCount}🔁`;
  },

  renderHeatmap() {
    const el = document.getElementById('heatmap');
    if (!el) return;
    el.innerHTML = '';

    // Generate last 30 days
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(dateStr);
    }

    // Count logs per day
    const logCounts = {};
    this.logs.forEach(l => {
      logCounts[l.date] = (logCounts[l.date] || 0) + 1;
    });

    days.forEach(dateStr => {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      const count = logCounts[dateStr] || 0;
      if (count >= 5) cell.classList.add('level-4');
      else if (count >= 3) cell.classList.add('level-3');
      else if (count >= 2) cell.classList.add('level-2');
      else if (count >= 1) cell.classList.add('level-1');

      cell.title = `${dateStr}: ${count} activity log(s)`;
      el.appendChild(cell);
    });
  },

  renderList() {
    const container = document.getElementById('habitsList');
    if (!container) return;

    if (this.habits.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌱</div>
          <p>No habits tracked yet. Click "Load Defaults" to start with 12 preset habits or create custom ones!</p>
        </div>
      `;
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = this.habits.map(h => {
      const todayLog = this.logs.find(l => l.habit_id === h.id && l.date === today);
      const currentVal = todayLog ? todayLog.value : 0;
      const isCompleted = todayLog ? todayLog.completed : false;
      const pct = Math.min(100, Math.round((currentVal / (h.target_value || 1)) * 100));

      return `
        <div class="habit-item card mb-3">
          <div class="habit-header flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="habit-icon">${h.emoji || '✨'}</span>
              <div>
                <div class="font-bold flex items-center gap-2">
                  ${h.name}
                  ${h.is_auto_tracked ? '<span class="badge badge-purple" style="font-size:0.65rem">Auto ⚡</span>' : ''}
                </div>
                <div class="text-xs text-muted">${h.description || ''} • Target: ${h.target_value} ${h.unit}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="habit-streak">🔥 ${h.streak || 0} day streak</span>
              <button class="btn ${isCompleted ? 'btn-success' : 'btn-primary'} btn-sm"
                      onclick="Habits.log(${h.id}, ${h.target_value >= 100 ? 1000 : 1})">
                ${isCompleted ? '✓ Done' : '+ Progress'}
              </button>
            </div>
          </div>
          <div class="progress-bar mt-2">
            <div class="progress-fill" style="width:${pct}%;"></div>
          </div>
          <div class="flex justify-between text-xs text-muted mt-1">
            <span>${currentVal} / ${h.target_value} ${h.unit}</span>
            <span>${pct}% Completed today</span>
          </div>
        </div>
      `;
    }).join('');
  }
};
