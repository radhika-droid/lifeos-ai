const Dashboard = {
  async init() {
    setGreeting();
    await this.loadTasks();
    await this.loadStats();
    App.refreshDecision();
  },

  async loadTasks() {
    try {
      const resp = await fetch(`${API}/api/tasks`);
      const tasks = await resp.json();
      this.renderTasks(tasks);
      this.renderMatrix(tasks);
    } catch(e) { console.error(e); }
  },

  renderTasks(tasks) {
    const list = document.getElementById('taskList');
    if (!tasks.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>No tasks yet. Add your first task!</p></div>';
      return;
    }
    const catIcons = {study:'📚',work:'💼',health:'🏋️',fun:'🎮',chores:'🧹',general:'📌'};
    list.innerHTML = tasks.map(t => `
      <div class="task-item ${t.completed?'completed':''} ${t.is_overdue?'overdue':''}" id="task-${t.id}">
        <button class="task-check-btn ${t.completed?'done':''}" onclick="Dashboard.completeTask(${t.id})" title="Mark complete">
          ${t.completed?'✓':''}
        </button>
        <div class="task-name ${t.completed?'text-muted':''}" style="${t.completed?'text-decoration:line-through':''}">${t.name}</div>
        <div class="task-meta">
          <span class="badge badge-accent">${catIcons[t.category]||'📌'} ${t.category}</span>
          <span class="badge ${t.priority>=4?'badge-danger':t.priority>=3?'badge-warning':'badge-purple'}">P${t.priority}</span>
          ${t.is_overdue?'<span class="badge badge-danger">⚠️ Overdue</span>':''}
          ${t.due_date&&!t.is_overdue?`<span class="badge badge-success">📅 ${new Date(t.due_date).toLocaleDateString()}</span>`:''}
        </div>
        <button class="btn btn-danger btn-sm btn-icon" onclick="Dashboard.deleteTask(${t.id})" title="Delete">🗑️</button>
      </div>
    `).join('');
  },

  renderMatrix(tasks) {
    const active = tasks.filter(t => !t.completed);
    const q1=[], q2=[], q3=[], q4=[];
    active.forEach(t => {
      const imp = t.priority >= 3;
      const urg = t.urgency >= 3;
      if (imp && urg) q1.push(t.name);
      else if (imp && !urg) q2.push(t.name);
      else if (!imp && urg) q3.push(t.name);
      else q4.push(t.name);
    });
    const render = (arr) => arr.length
      ? arr.map(n=>`<div style="padding:3px 0;border-bottom:1px solid var(--border);">${n}</div>`).join('')
      : '<span style="opacity:0.4">None</span>';
    document.getElementById('q1tasks').innerHTML = render(q1);
    document.getElementById('q2tasks').innerHTML = render(q2);
    document.getElementById('q3tasks').innerHTML = render(q3);
    document.getElementById('q4tasks').innerHTML = render(q4);
  },

  async loadStats() {
    try {
      const [taskResp, habitResp] = await Promise.all([
        fetch(`${API}/api/tasks`), fetch(`${API}/api/habits`)
      ]);
      const tasks = await taskResp.json();
      const habits = await habitResp.json();
      const today = new Date().toDateString();
      const doneTasks = tasks.filter(t => t.completed).length;
      const pendTasks = tasks.filter(t => !t.completed).length;
      const doneHabits = habits.filter(h => h.today_completed).length;
      const habitPct = habits.length ? Math.round((doneHabits/habits.length)*100) : 0;
      const bestStreak = habits.reduce((m,h)=>Math.max(m,h.streak),0);
      document.getElementById('statTasksDone').textContent = doneTasks;
      document.getElementById('statHabitPct').textContent = habitPct + '%';
      document.getElementById('statStreak').textContent = bestStreak + '🔥';
      document.getElementById('statPending').textContent = pendTasks;
    } catch(e) { console.error(e); }
  },

  async completeTask(id) {
    await fetch(`${API}/api/tasks/${id}/complete`, {method:'POST'});
    showToast('Task completed! 🎉', 'success');
    this.loadTasks(); this.loadStats(); App.refreshDecision();
  },

  async deleteTask(id) {
    await fetch(`${API}/api/tasks/${id}`, {method:'DELETE'});
    showToast('Task deleted', 'info');
    this.loadTasks(); this.loadStats(); App.refreshDecision();
  }
};
