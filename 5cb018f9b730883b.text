'use strict';

const ADMIN_USERNAME = 'nazril';
const ADMIN_PASSWORD = 'admin1';
const STORAGE_KEY = 'xi_tkj_class_app_v1';
const SESSION_KEY = 'xi_tkj_admin_session_v1';

const WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SUBJECTS = {
  Senin: ['AIJ', 'Informatika', 'PJOK'],
  Selasa: ['ASJ', 'BI', 'PAIBP'],
  Rabu: ['PPS', 'TWAN', 'BING'],
  Kamis: ['SI', 'BK', 'BJPG', 'MTK'],
  Jumat: ['KIK', 'BTQ']
};
const PICKET = {
  Senin: ['Teguh', 'Rivan', 'Rangga', 'Anwar', 'Fradil', 'Nazam'],
  Selasa: ['Rafi', 'Satria', 'Iksan', 'Rahmat', 'Hori', 'Nazril'],
  Rabu: ['Fahrizal', 'Kiki', 'Husni', 'Azmi', 'Ajihad', 'Deril'],
  Kamis: ['Faarih', 'Fajar', 'Fadil', 'Toyibur', 'Lucky', 'Risma', 'Dika'],
  Jumat: ['Adis', 'Yopti', 'Angga', 'Arga', 'Rizki.F']
};
const ORGANIZATION = [
  { role: 'Ketua Kelas', name: 'Rafi muwahid' },
  { role: 'Wakil Ketua', name: 'Muhammad Azmi Arvan Apriliano' },
  { role: 'Seksi Keamanan', name: 'Arga Pratama Muhandar' },
  { role: 'Seksi Kebersihan', name: 'Kiki Ardiansyah' },
  { role: 'Sekretaris', name: 'Muhammad Toyibur Rizki' },
  { role: 'Sekretaris', name: 'Risma Wati dewi' },
  { role: 'Bendahara', name: 'Rivan Ibrahim' }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const formatDate = value => {
  if (!value) return 'Belum ditentukan';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};
const dateDayName = value => {
  if (!value) return '';
  return WEEKDAYS[new Date(`${value}T00:00:00`).getDay()];
};
const initials = name => String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
const todayName = () => WEEKDAYS[new Date().getDay()];

function defaultData() {
  return { tasks: [], attendance: [], taskFilter: 'semua' };
}
function loadData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return { ...defaultData(), ...(parsed && typeof parsed === 'object' ? parsed : {}) , tasks: Array.isArray(parsed?.tasks) ? parsed.tasks : [], attendance: Array.isArray(parsed?.attendance) ? parsed.attendance : [] };
  } catch (error) {
    console.warn('Tidak bisa membaca data tersimpan:', error);
    return defaultData();
  }
}
let state = loadData();
let isAdmin = sessionStorage.getItem(SESSION_KEY) === 'true';
let activePage = 'beranda';
let currentTaskFilter = 'semua';
let pendingConfirm = null;
let toastTimeout = null;
let installPrompt = null;

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    showToast('Penyimpanan penuh atau tidak tersedia. Ekspor data sebagai cadangan.');
    console.error(error);
    return false;
  }
}
function showToast(message) {
  $('#toastMessage').textContent = message;
  const toast = $('#toast');
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}
function switchPage(page) {
  const validPages = ['beranda', 'tugas', 'absensi', 'jadwal', 'organisasi', 'admin'];
  if (!validPages.includes(page)) page = 'beranda';
  activePage = page;
  $$('.page').forEach(el => el.classList.toggle('active', el.id === `page-${page}`));
  $$('[data-page]').forEach(btn => btn.classList.toggle('active', btn.dataset.page === page));
  const titles = { beranda: 'Beranda', tugas: 'Daftar Tugas', absensi: 'Absensi Kelas', jadwal: 'Jadwal Kelas', organisasi: 'Organisasi Kelas', admin: 'Panel Admin' };
  $('#pageTitle').textContent = titles[page];
  $('#todayLabel').textContent = page === 'beranda' ? 'KELAS DIGITAL' : 'XI TKJ • ' + titles[page].toUpperCase();
  if (page === 'admin') renderAdmin();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function updateTaskBadges() {
  const activeCount = state.tasks.filter(task => !task.done).length;
  $('#taskBadge').textContent = activeCount > 99 ? '99+' : activeCount;
  $('#taskBadge').hidden = activeCount === 0;
  $('#mobileTaskBadge').hidden = activeCount === 0;
  $('#activeTaskStat').textContent = activeCount;
}
function renderHome() {
  const day = todayName();
  const todayTasks = [...state.tasks].filter(task => !task.done).sort((a, b) => {
    if (!a.due && !b.due) return b.createdAt - a.createdAt;
    if (!a.due) return 1;
    if (!b.due) return -1;
    return a.due.localeCompare(b.due);
  }).slice(0, 3);
  $('#homeTaskList').innerHTML = todayTasks.length ? todayTasks.map(task => `
    <div class="home-task-item"><div class="task-symbol">▤</div><div class="home-task-copy"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.subject || 'Tugas kelas')} · ${task.due ? 'Deadline ' + escapeHTML(formatDate(task.due)) : 'Tanpa deadline'}</small></div><span class="mini-status">Aktif</span></div>`).join('') : '<div class="empty-inline"><div class="empty-illustration">✦</div>Belum ada tugas aktif. Semoga harimu produktif!</div>';
  const subjects = SUBJECTS[day] || [];
  $('#homeScheduleList').innerHTML = subjects.length ? subjects.map((subject, index) => `<div class="schedule-mini-item"><span class="schedule-num">${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHTML(subject)}</strong><small>Mata pelajaran</small></div><span class="subject-chip">${index === 0 ? 'Mulai' : 'Pelajaran'}</span></div>`).join('') : '<div class="empty-inline">Tidak ada jadwal pelajaran yang tercatat untuk hari ini.</div>';
  const piket = PICKET[day] || [];
  $('#homePiketNames').textContent = piket.length ? piket.join(', ') : 'Tidak ada jadwal piket hari ini';
  $('#todaySubjectStat').textContent = subjects.length;
  $('#todayPiketSummary').textContent = piket.length ? `${piket.length} siswa bertugas piket` : 'Tidak ada jadwal piket';
  $('#dayPill').textContent = day;
  $('#fullDate').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  updateTaskBadges();
}
function renderTasks() {
  const tasks = [...state.tasks].sort((a, b) => (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99') || (b.createdAt || 0) - (a.createdAt || 0));
  const filtered = tasks.filter(task => currentTaskFilter === 'semua' || (currentTaskFilter === 'aktif' && !task.done) || (currentTaskFilter === 'selesai' && task.done));
  $('#taskCountLabel').textContent = `${filtered.length} tugas`;
  $('#taskEmpty').hidden = filtered.length > 0;
  $('#taskPageList').innerHTML = filtered.map(task => {
    const today = localToday();
    const isOverdue = task.due && task.due < today && !task.done;
    const dueClass = isOverdue ? 'due-label overdue' : 'due-label';
    const dueText = task.due ? `${isOverdue ? 'Terlambat · ' : 'Deadline · '}${formatDate(task.due)}` : 'Deadline belum ditentukan';
    return `<article class="task-card"><div class="task-card-top"><span class="subject-label">${escapeHTML(task.subject || 'Tugas kelas')}</span>${task.priority === 'tinggi' && !task.done ? '<span class="priority-label">PENTING</span>' : ''}</div><h3>${escapeHTML(task.title)}</h3>${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}<div class="task-card-footer"><span class="${dueClass}">${escapeHTML(dueText)}</span><button class="task-action ${task.done ? 'done' : ''}" data-task-toggle="${escapeHTML(task.id)}">${task.done ? '✓ Selesai' : 'Tandai selesai'}</button></div></article>`;
  }).join('');
  updateTaskBadges();
}
function renderAttendance() {
  const attendance = [...state.attendance].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
  const today = localToday();
  const todays = attendance.filter(item => item.date === today);
  const count = status => todays.filter(item => item.status === status).length;
  $('#attendanceStat').textContent = attendance.length;
  $('#attendanceSummary').innerHTML = `
    <div class="attendance-metric present"><span>Hadir hari ini</span><strong>${count('Hadir')}</strong></div>
    <div class="attendance-metric excused"><span>Izin hari ini</span><strong>${count('Izin')}</strong></div>
    <div class="attendance-metric sick"><span>Sakit hari ini</span><strong>${count('Sakit')}</strong></div>
    <div class="attendance-metric absent"><span>Alpa hari ini</span><strong>${count('Alpa')}</strong></div>`;
  $('#attendanceTodayPill').textContent = formatDate(today);
  $('#attendanceEmpty').hidden = attendance.length > 0;
  $('#attendanceList').innerHTML = attendance.map(item => `
    <div class="attendance-row"><div class="attendance-person"><span class="attendance-avatar">${escapeHTML(initials(item.name))}</span><div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(formatDate(item.date))}${item.note ? ' · ' + escapeHTML(item.note) : ''}</small></div></div><span class="attendance-badge ${String(item.status).toLowerCase()}">${escapeHTML(item.status)}</span><span class="attendance-note">${isAdmin ? `<button class="task-action" data-attendance-delete="${escapeHTML(item.id)}" aria-label="Hapus catatan ${escapeHTML(item.name)}">Hapus</button>` : ''}</span></div>`).join('');
}
function renderSchedules() {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const today = todayName();
  $('#subjectWeekGrid').innerHTML = days.map(day => `<article class="day-card ${day === today ? 'is-today' : ''}"><div class="day-card-head"><strong>${day}</strong>${day === today ? '<span class="today-marker">HARI INI</span>' : ''}</div><div class="day-items">${SUBJECTS[day].map(subject => `<div class="day-subject"><i></i><span>${escapeHTML(subject)}</span></div>`).join('')}</div></article>`).join('');
  $('#piketWeekGrid').innerHTML = days.map((day, index) => `<article class="day-card ${day === today ? 'is-today' : ''}"><div class="day-card-head"><strong><span class="piket-number">${String(index + 1).padStart(2, '0')}</span>${day}</strong>${day === today ? '<span class="today-marker">HARI INI</span>' : ''}</div><div class="piket-list">${PICKET[day].map(name => `<div class="piket-person"><span>${escapeHTML(initials(name))}</span>${escapeHTML(name)}</div>`).join('')}</div></article>`).join('');
}
function renderOrganization() {
  $('#organizationGrid').innerHTML = ORGANIZATION.map(person => `<article class="org-card"><div class="org-card-top"><span class="org-avatar">${escapeHTML(initials(person.name))}</span><span class="org-role">${escapeHTML(person.role)}</span></div><h4>${escapeHTML(person.name)}</h4><p>Pengurus kelas XI TKJ</p></article>`).join('');
}
function renderAdmin() {
  $('#adminLoginCard').hidden = isAdmin;
  $('#adminDashboard').hidden = !isAdmin;
  $('#profileName').textContent = isAdmin ? 'Nazril' : 'Tamu kelas';
  $('#profileRole').textContent = isAdmin ? 'Administrator' : 'XI TKJ';
  if (!isAdmin) return;
  const tasks = [...state.tasks].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  $('#adminTaskCount').textContent = `${tasks.length} tugas`;
  $('#adminTaskList').innerHTML = tasks.length ? tasks.map(task => `<div class="managed-task"><div class="task-symbol ${task.done ? 'done-symbol' : ''}">${task.done ? '✓' : '▤'}</div><div class="managed-task-copy"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.subject || 'Tugas kelas')} · ${task.due ? escapeHTML(formatDate(task.due)) : 'Tanpa deadline'}</small></div><span class="managed-badge">${task.done ? 'SELESAI' : 'AKTIF'}</span><button class="delete-small" data-task-delete="${escapeHTML(task.id)}" aria-label="Hapus tugas ${escapeHTML(task.title)}">×</button></div>`).join('') : '<div class="empty-small">Belum ada tugas yang dibuat. Gunakan formulir di atas untuk menambahkan tugas baru.</div>';
}
function renderAll() {
  renderHome();
  renderTasks();
  renderAttendance();
  renderSchedules();
  renderOrganization();
  renderAdmin();
}

function askConfirm(title, message, callback) {
  pendingConfirm = callback;
  $('#confirmTitle').textContent = title;
  $('#confirmMessage').textContent = message;
  $('#confirmModal').hidden = false;
}
function closeConfirm() {
  $('#confirmModal').hidden = true;
  pendingConfirm = null;
}
function notifyNewTask(task) {
  $('#notificationDot').style.background = '#ed9f4a';
  const dateText = task.due ? ` Deadline ${formatDate(task.due)}.` : '';
  showToast('Tugas baru ditambahkan: ' + task.title);
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => registration.showNotification('Tugas baru • XI TKJ', { body: task.title + dateText, icon: 'icon.svg', badge: 'icon.svg', tag: 'task-' + task.id, data: { url: './#tugas' } })).catch(() => new Notification('Tugas baru • XI TKJ', { body: task.title + dateText }));
      } else {
        new Notification('Tugas baru • XI TKJ', { body: task.title + dateText });
      }
    } catch (error) { console.warn('Notifikasi tidak tersedia di konteks ini.', error); }
  }
}

// Navigation and actions
document.addEventListener('click', event => {
  const pageButton = event.target.closest('[data-page]');
  if (pageButton) { event.preventDefault(); switchPage(pageButton.dataset.page); return; }
  const filter = event.target.closest('[data-filter]');
  if (filter) {
    currentTaskFilter = filter.dataset.filter;
    $$('#taskFilters .filter-tab').forEach(btn => btn.classList.toggle('active', btn === filter));
    renderTasks();
    return;
  }
  const taskToggle = event.target.closest('[data-task-toggle]');
  if (taskToggle) {
    const task = state.tasks.find(item => item.id === taskToggle.dataset.taskToggle);
    if (!task) return;
    task.done = !task.done;
    task.updatedAt = Date.now();
    saveData(); renderAll();
    showToast(task.done ? 'Tugas ditandai selesai.' : 'Status tugas dikembalikan.');
    return;
  }
  const taskDelete = event.target.closest('[data-task-delete]');
  if (taskDelete) {
    if (!isAdmin) return;
    const task = state.tasks.find(item => item.id === taskDelete.dataset.taskDelete);
    if (!task) return;
    askConfirm('Hapus tugas ini?', `Tugas “${task.title}” akan dihapus dari perangkat ini.`, () => {
      state.tasks = state.tasks.filter(item => item.id !== task.id);
      saveData(); renderAll(); showToast('Tugas dihapus.');
    });
    return;
  }
  const attendanceDelete = event.target.closest('[data-attendance-delete]');
  if (attendanceDelete && isAdmin) {
    const item = state.attendance.find(record => record.id === attendanceDelete.dataset.attendanceDelete);
    if (!item) return;
    askConfirm('Hapus catatan absensi?', `Catatan ${item.name} tanggal ${formatDate(item.date)} akan dihapus.`, () => {
      state.attendance = state.attendance.filter(record => record.id !== item.id);
      saveData(); renderAll(); showToast('Catatan absensi dihapus.');
    });
  }
});
$('#cancelConfirm').addEventListener('click', closeConfirm);
$('#acceptConfirm').addEventListener('click', () => { const action = pendingConfirm; closeConfirm(); if (typeof action === 'function') action(); });
$('#confirmModal').addEventListener('click', event => { if (event.target === $('#confirmModal')) closeConfirm(); });

$$('[data-schedule-tab]').forEach(button => button.addEventListener('click', () => {
  const target = button.dataset.scheduleTab;
  $$('[data-schedule-tab]').forEach(btn => btn.classList.toggle('active', btn === button));
  $('#subjectPane').classList.toggle('active', target === 'pelajaran');
  $('#piketPane').classList.toggle('active', target === 'piket');
}));

$('#loginForm').addEventListener('submit', event => {
  event.preventDefault();
  const username = $('#adminUsername').value.trim();
  const password = $('#adminPassword').value;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    isAdmin = true;
    sessionStorage.setItem(SESSION_KEY, 'true');
    $('#loginError').textContent = '';
    $('#loginForm').reset();
    renderAll();
    showToast('Login admin berhasil. Selamat datang, Nazril!');
  } else {
    $('#loginError').textContent = 'Username atau password salah. Coba lagi.';
    $('#adminPassword').value = '';
    $('#adminPassword').focus();
  }
});
$('#togglePassword').addEventListener('click', () => {
  const field = $('#adminPassword');
  field.type = field.type === 'password' ? 'text' : 'password';
  $('#togglePassword').setAttribute('aria-label', field.type === 'password' ? 'Tampilkan password' : 'Sembunyikan password');
});
$('#logoutBtn').addEventListener('click', () => {
  isAdmin = false;
  sessionStorage.removeItem(SESSION_KEY);
  renderAll();
  showToast('Kamu sudah keluar dari panel admin.');
});

$('#taskForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!isAdmin) return;
  const title = $('#taskTitle').value.trim();
  if (!title) return;
  const task = {
    id: crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    subject: $('#taskSubject').value.trim(),
    due: $('#taskDue').value,
    priority: $('#taskPriority').value,
    description: $('#taskDescription').value.trim(),
    done: false,
    createdAt: Date.now()
  };
  state.tasks.push(task);
  saveData();
  $('#taskForm').reset();
  renderAll();
  notifyNewTask(task);
});

$('#attendanceDate').value = localToday();
$('#taskDue').min = localToday();
$('#attendanceForm').addEventListener('submit', event => {
  event.preventDefault();
  if (!isAdmin) return;
  const name = $('#attendanceName').value.trim();
  const date = $('#attendanceDate').value;
  const status = $('#attendanceStatus').value;
  if (!name || !date) return;
  const note = $('#attendanceNote').value.trim();
  const existing = state.attendance.find(item => item.name.trim().toLocaleLowerCase('id-ID') === name.toLocaleLowerCase('id-ID') && item.date === date);
  if (existing) {
    existing.status = status;
    existing.note = note;
    existing.updatedAt = Date.now();
    showToast(`Absensi ${name} diperbarui.`);
  } else {
    state.attendance.push({ id: crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}-${Math.random().toString(16).slice(2)}`, name, date, status, note, createdAt: Date.now() });
    showToast(`Absensi ${name} tersimpan.`);
  }
  saveData();
  const dateValue = $('#attendanceDate').value;
  $('#attendanceForm').reset();
  $('#attendanceDate').value = dateValue || localToday();
  renderAll();
});

$('#notificationBtn').addEventListener('click', async () => {
  if (!('Notification' in window)) {
    showToast('Browser ini tidak mendukung notifikasi. Info tugas tetap terlihat di aplikasi.');
    return;
  }
  if (Notification.permission === 'granted') {
    $('#notificationDot').style.background = '#45bd8c';
    showToast('Notifikasi sudah aktif di browser ini.');
    return;
  }
  if (Notification.permission === 'denied') {
    showToast('Notifikasi diblokir browser. Ubah izin melalui pengaturan situs.');
    return;
  }
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      $('#notificationDot').style.background = '#45bd8c';
      showToast('Notifikasi berhasil diaktifkan.');
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready.then(registration => registration.showNotification('Notifikasi XI TKJ aktif', { body: 'Kamu akan menerima notifikasi saat admin menambahkan tugas di perangkat ini.', icon: 'icon.svg' })).catch(() => {});
      }
    } else showToast('Izin notifikasi belum diberikan.');
  } catch (error) { showToast('Tidak bisa meminta izin notifikasi dari halaman ini.'); }
});

$('#exportBtn').addEventListener('click', () => {
  if (!isAdmin) return;
  const backup = { app: 'XI TKJ', version: 1, exportedAt: new Date().toISOString(), data: state };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `cadangan-xi-tkj-${localToday()}.json`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  showToast('File cadangan berhasil dibuat.');
});
$('#importFile').addEventListener('change', async event => {
  if (!isAdmin) { event.target.value = ''; return; }
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = parsed.data || parsed;
    if (!Array.isArray(imported.tasks) || !Array.isArray(imported.attendance)) throw new Error('Format data tidak cocok');
    askConfirm('Impor cadangan?', 'Data tugas dan absensi saat ini akan diganti dengan data dari file cadangan.', () => {
      state = { ...defaultData(), tasks: imported.tasks, attendance: imported.attendance };
      saveData(); renderAll(); showToast('Cadangan berhasil diimpor.');
    });
  } catch (error) {
    showToast('File tidak valid atau bukan cadangan XI TKJ.');
  } finally { event.target.value = ''; }
});

// Provide an install prompt when the browser supports installing PWAs.
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  if (!$('#installAppBtn')) {
    const button = document.createElement('button');
    button.id = 'installAppBtn';
    button.className = 'outline-button';
    button.type = 'button';
    button.textContent = '＋ Pasang aplikasi';
    button.style.marginTop = '8px';
    const footer = $('.app-footer');
    footer?.before(button);
    button.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      button.remove();
    });
  }
});
window.addEventListener('appinstalled', () => showToast('XI TKJ berhasil dipasang di perangkat.'));

// Register the offline cache when served from HTTPS or localhost.
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker belum terpasang:', error)));
}

if ('Notification' in window) {
  $('#notificationDot').style.background = Notification.permission === 'granted' ? '#45bd8c' : '#ed9f4a';
}
renderAll();
switchPage('beranda');
