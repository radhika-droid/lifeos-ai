const Profile = {
  data: {
    name: 'User',
    bio: 'Your personal life advisor',
    avatar: '🧑',
    prefEnergy: 'medium',
    prefWakeTime: '07:00',
    prefSleepTime: '23:00',
    prefFocusDuration: 25
  },

  async init() {
    this.loadLocal();
    await this.loadLifetimeStats();
  },

  loadLocal() {
    const saved = localStorage.getItem('lifeos_profile');
    if (saved) {
      try {
        this.data = { ...this.data, ...JSON.parse(saved) };
      } catch (e) {}
    }
    this.render();
  },

  render() {
    const nameDisp = document.getElementById('profileNameDisplay');
    const bioDisp = document.getElementById('profileBioDisplay');
    const nameInput = document.getElementById('profileName');
    const bioInput = document.getElementById('profileBio');
    const avatarDisp = document.getElementById('avatarDisplay');
    const prefEnergy = document.getElementById('prefEnergy');
    const prefWakeTime = document.getElementById('prefWakeTime');
    const prefSleepTime = document.getElementById('prefSleepTime');
    const prefFocusDuration = document.getElementById('prefFocusDuration');

    if (nameDisp) nameDisp.textContent = this.data.name || 'User';
    if (bioDisp) bioDisp.textContent = this.data.bio || 'Your personal life advisor';
    if (nameInput) nameInput.value = this.data.name || '';
    if (bioInput) bioInput.value = this.data.bio || '';
    if (avatarDisp) {
      if (this.data.avatar.startsWith('http') || this.data.avatar.startsWith('/')) {
        avatarDisp.innerHTML = `<img src="${this.data.avatar.startsWith('/') ? API + this.data.avatar : this.data.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
      } else {
        avatarDisp.textContent = this.data.avatar || '🧑';
      }
    }

    if (prefEnergy) prefEnergy.value = this.data.prefEnergy || 'medium';
    if (prefWakeTime) prefWakeTime.value = this.data.prefWakeTime || '07:00';
    if (prefSleepTime) prefSleepTime.value = this.data.prefSleepTime || '23:00';
    if (prefFocusDuration) prefFocusDuration.value = this.data.prefFocusDuration || 25;
  },

  save() {
    const name = document.getElementById('profileName').value.trim() || 'User';
    const bio = document.getElementById('profileBio').value.trim();

    this.data.name = name;
    this.data.bio = bio;
    localStorage.setItem('lifeos_profile', JSON.stringify(this.data));
    this.render();
    App.toast('Profile saved! 👤', 'success');
  },

  savePrefs() {
    this.data.prefEnergy = document.getElementById('prefEnergy').value;
    this.data.prefWakeTime = document.getElementById('prefWakeTime').value;
    this.data.prefSleepTime = document.getElementById('prefSleepTime').value;
    this.data.prefFocusDuration = parseInt(document.getElementById('prefFocusDuration').value) || 25;

    localStorage.setItem('lifeos_profile', JSON.stringify(this.data));
    App.toast('Preferences saved! ⚙️', 'success');
  },

  async uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      App.toast('Uploading avatar...', 'info');
      const res = await fetch(`${API}/api/uploads`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        this.data.avatar = data.url;
        localStorage.setItem('lifeos_profile', JSON.stringify(this.data));
        this.render();
        App.toast('Avatar updated! 📸', 'success');
      } else {
        App.toast('Failed to upload avatar', 'error');
      }
    } catch (err) {
      App.toast('Error uploading avatar', 'error');
    }
  },

  async loadLifetimeStats() {
    try {
      const [tasksRes, habitsRes, moodRes, chatRes] = await Promise.all([
        fetch(`${API}/api/tasks`),
        fetch(`${API}/api/habits/logs`),
        fetch(`${API}/api/wellness/mood/history`),
        fetch(`${API}/api/wellness/chat/history`)
      ]);

      let doneCount = 0;
      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        doneCount = tasks.filter(t => t.status === 'completed').length;
      }

      let habitLogCount = 0;
      if (habitsRes.ok) {
        const logs = await habitsRes.json();
        habitLogCount = logs.length;
      }

      let moodLogCount = 0;
      if (moodRes.ok) {
        const moods = await moodRes.json();
        moodLogCount = moods.length;
      }

      let chatMsgCount = 0;
      if (chatRes.ok) {
        const chats = await chatRes.json();
        chatMsgCount = chats.length;
      }

      document.getElementById('ltTasksDone').textContent = doneCount;
      document.getElementById('ltHabitLogs').textContent = habitLogCount;
      document.getElementById('ltMoodLogs').textContent = moodLogCount;
      document.getElementById('ltChatMsgs').textContent = chatMsgCount;
    } catch (err) {
      console.error('Failed to load lifetime stats', err);
    }
  }
};
