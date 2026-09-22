const Wellness = {
  breathingInterval: null,
  breathingPhase: 0,
  chatHistory: [],
  selectedMood: 4,

  async init() {
    this.setupMoodSelectors();
    await this.loadMoodHistory();
    await this.loadChatHistory();
  },

  setupMoodSelectors() {
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedMood = parseInt(btn.dataset.mood);
      });
    });
  },

  async logMood() {
    const note = document.getElementById('moodNote').value.trim();
    const gratitude = document.getElementById('gratitudeNote').value.trim();

    try {
      const res = await fetch(`${API}/api/mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: this.selectedMood, note, gratitude })
      });
      if (res.ok) {
        const data = await res.json();
        App.toast(data.response || 'Mood check-in saved! 🌸', 'success');
        document.getElementById('moodNote').value = '';
        document.getElementById('gratitudeNote').value = '';
        await this.loadMoodHistory();
      } else {
        App.toast('Failed to save mood check-in', 'error');
      }
    } catch (err) {
      App.toast('Error connecting to backend', 'error');
    }
  },

  async loadMoodHistory() {
    try {
      const res = await fetch(`${API}/api/mood/history`);
      if (res.ok) {
        const history = await res.json();
        this.renderMoodHistory(history);
      }
    } catch (err) {
      console.error('Failed to load mood history', err);
    }
  },

  renderMoodHistory(history) {
    const container = document.getElementById('moodHistory');
    if (!container) return;

    if (!history || history.length === 0) {
      container.innerHTML = '<p class="text-xs text-muted">No check-ins yet. Log your first mood above!</p>';
      return;
    }

    const emojis = { 5: '😄', 4: '🙂', 3: '😐', 2: '😕', 1: '😢' };
    container.innerHTML = history.slice(0, 5).map(m => `
      <div class="flex items-center justify-between text-xs py-1 border-b" style="border-color:var(--border);">
        <span>${emojis[m.mood] || m.emoji || '😐'} ${m.date_str || ''}</span>
        <span class="text-muted">${m.note ? m.note.substring(0, 30) + '...' : 'No note'}</span>
      </div>
    `).join('');
  },

  // Breathing Box Exercise (4-4-4-4)
  startBreathing() {
    if (this.breathingInterval) clearInterval(this.breathingInterval);
    const circle = document.getElementById('breathCircle');
    const label = document.getElementById('breathLabel');
    if (!circle || !label) return;

    const phases = [
      { text: 'Inhale...', class: 'inhale', desc: 'Deep breath in through your nose (4s)' },
      { text: 'Hold...', class: 'hold', desc: 'Hold your breath gently (4s)' },
      { text: 'Exhale...', class: 'exhale', desc: 'Slow breath out through your mouth (4s)' },
      { text: 'Rest...', class: 'hold', desc: 'Pause before next breath (4s)' }
    ];

    let idx = 0;
    const runPhase = () => {
      const p = phases[idx % phases.length];
      circle.textContent = p.text;
      circle.className = `breath-circle ${p.class}`;
      label.textContent = p.desc;
      idx++;
    };

    runPhase();
    this.breathingInterval = setInterval(runPhase, 4000);
  },

  stopBreathing() {
    if (this.breathingInterval) {
      clearInterval(this.breathingInterval);
      this.breathingInterval = null;
    }
    const circle = document.getElementById('breathCircle');
    const label = document.getElementById('breathLabel');
    if (circle) {
      circle.textContent = 'Inhale';
      circle.className = 'breath-circle';
    }
    if (label) label.textContent = 'Press start to begin';
  },

  // Chat Buddy
  async loadChatHistory() {
    try {
      const res = await fetch(`${API}/api/chat/history`);
      if (res.ok) {
        const history = await res.json();
        this.chatHistory = history;
        this.renderChat();
      }
    } catch (err) {
      console.error('Failed to load chat history', err);
    }
  },

  quickSend(text) {
    const input = document.getElementById('wellnessChatInput');
    if (input) {
      input.value = text;
      this.sendMessage();
    }
  },

  async sendMessage() {
    const input = document.getElementById('wellnessChatInput');
    const message = input.value.trim();
    if (!message) return;

    this.appendChatMessage('user', message);
    input.value = '';

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, mood: this.selectedMood })
      });
      if (res.ok) {
        const data = await res.json();
        this.appendChatMessage('assistant', data.response, data.media_url);
      } else {
        this.appendChatMessage('assistant', "I'm having trouble connecting right now, but I'm here for you. Take a deep breath! 💙");
      }
    } catch (err) {
      this.appendChatMessage('assistant', "Error connecting. Please make sure the backend is running!");
    }
  },

  appendChatMessage(role, content, mediaUrl = null) {
    const container = document.getElementById('wellnessChatMessages');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    
    let html = App.escapeHtml(content);
    if (mediaUrl) {
      if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        html += `<br/><img src="${API}${mediaUrl}" class="chat-media-preview" alt="Uploaded media" />`;
      } else if (mediaUrl.match(/\.(mp3|wav|ogg)$/i)) {
        html += `<br/><audio controls src="${API}${mediaUrl}" style="margin-top:8px;max-width:100%"></audio>`;
      }
    }
    bubble.innerHTML = html;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  renderChat() {
    const container = document.getElementById('wellnessChatMessages');
    if (!container) return;

    if (this.chatHistory.length === 0) {
      container.innerHTML = `
        <div class="chat-bubble assistant">
          Hi there! 🌸 I'm your wellness buddy. How are you feeling today? You can share anything — I'm here to listen without judgment. 💙
        </div>
      `;
      return;
    }

    container.innerHTML = this.chatHistory.map(msg => `
      <div class="chat-bubble ${msg.role}">
        ${App.escapeHtml(msg.content)}
        ${msg.media_url ? `
          <br/>${msg.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) 
            ? `<img src="${API}${msg.media_url}" style="max-width:200px;border-radius:10px;margin-top:8px;" />` 
            : `<audio controls src="${API}${msg.media_url}" style="margin-top:8px;max-width:100%"></audio>`}
        ` : ''}
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  },

  async handleMediaUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      App.toast('Uploading media...', 'info');
      const res = await fetch(`${API}/api/uploads`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        App.toast('Media uploaded!', 'success');
        const promptText = `[Shared media: ${file.name}]`;
        const chatRes = await fetch(`${API}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: promptText, media_url: data.url, mood: this.selectedMood })
        });
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          this.appendChatMessage('user', promptText, data.url);
          this.appendChatMessage('assistant', chatData.response);
        }
      } else {
        App.toast('Upload failed', 'error');
      }
    } catch (err) {
      App.toast('Error uploading media', 'error');
    }
  },

  async clearChat() {
    if (!confirm('Clear chat history?')) return;
    try {
      await fetch(`${API}/api/chat/clear`, { method: 'DELETE' });
      this.chatHistory = [];
      this.renderChat();
      App.toast('Chat history cleared', 'info');
    } catch (err) {
      App.toast('Failed to clear chat', 'error');
    }
  },

  exportChat() {
    const text = this.chatHistory.map(m => `[${m.role.toUpperCase()}] ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wellness_chat_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('Chat exported!', 'success');
  }
};
