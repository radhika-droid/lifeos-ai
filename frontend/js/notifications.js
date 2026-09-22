const Notifications = {
  items: [],

  async init() {
    await this.refresh();
  },

  async refresh() {
    try {
      const res = await fetch(`${API}/api/notifications`);
      if (res.ok) {
        this.items = await res.json();
        this.render();
        this.updateBadge();
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  },

  updateBadge() {
    const unread = this.items.filter(i => !i.is_read).length;
    const badge = document.getElementById('notifBadge');
    if (!badge) return;

    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  async markAllRead() {
    try {
      const res = await fetch(`${API}/api/notifications/read-all`, { method: 'POST' });
      if (res.ok) {
        this.items.forEach(i => i.is_read = true);
        this.render();
        this.updateBadge();
        App.toast('All notifications marked as read', 'success');
      }
    } catch (err) {
      App.toast('Failed to mark read', 'error');
    }
  },

  async dismiss(id) {
    try {
      const res = await fetch(`${API}/api/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        const item = this.items.find(i => i.id === id);
        if (item) item.is_read = true;
        this.render();
        this.updateBadge();
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  },

  render() {
    const container = document.getElementById('notifList');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎉</div>
          <p>You're all caught up! No notifications or alerts right now.</p>
        </div>
      `;
      return;
    }

    const typeIcons = {
      missed_due: '🚨',
      due_today: '⏰',
      habit_reminder: '🌱',
      wellness_check: '🧘',
      system: '⚙️'
    };

    const typeClasses = {
      missed_due: 'missed_due',
      due_today: 'due_today',
      habit_reminder: 'habit_reminder',
      wellness_check: 'wellness_check',
      system: ''
    };

    container.innerHTML = this.items.map(n => `
      <div class="notif-card card mb-3 ${typeClasses[n.type] || ''} ${n.is_read ? 'read' : 'unread'}">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span style="font-size:1.4rem">${typeIcons[n.type] || '🔔'}</span>
            <div>
              <div class="font-bold text-sm">${App.escapeHtml(n.title)}</div>
              <div class="text-xs text-muted mt-1">${App.escapeHtml(n.message)}</div>
              <div class="text-xs text-muted mt-1" style="font-size:0.7rem">${n.created_at || ''}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${!n.is_read ? `
              <button class="btn btn-secondary btn-sm" onclick="Notifications.dismiss(${n.id})">✓ Dismiss</button>
            ` : '<span class="text-xs text-muted">Read</span>'}
          </div>
        </div>
      </div>
    `).join('');
  }
};
