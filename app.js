const STORAGE_USERS = 'fixit_users';
const STORAGE_COMPLAINTS = 'fixit_complaints';
const STORAGE_SESSION = 'fixit_session';

let currentUser = null;
let allComplaints = [];
let photoBase64 = null;

function initStorage() {
    if (!localStorage.getItem(STORAGE_USERS)) {
        const admin = {
            id: 1,
            name: 'Admin User',
            email: 'admin@fixit.local',
            password: 'Admin@12345',
            role: 'admin',
            created_at: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_USERS, JSON.stringify([admin]));
        localStorage.setItem(STORAGE_COMPLAINTS, JSON.stringify([]));
    }
}

function loadUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_USERS) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function loadComplaints() {
    return JSON.parse(localStorage.getItem(STORAGE_COMPLAINTS) || '[]');
}

function saveComplaints(complaints) {
    localStorage.setItem(STORAGE_COMPLAINTS, JSON.stringify(complaints));
}

function setSession(user) {
    localStorage.setItem(STORAGE_SESSION, JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role }));
}

function getSession() {
    return JSON.parse(localStorage.getItem(STORAGE_SESSION) || 'null');
}

function clearSession() {
    localStorage.removeItem(STORAGE_SESSION);
}

function getUserByEmail(email) {
    return loadUsers().find(u => u.email === email.toLowerCase());
}

function getUserById(id) {
    return loadUsers().find(u => u.id === id);
}

function showLogin() {
    document.getElementById('login-card').style.display = '';
    document.getElementById('register-card').style.display = 'none';
    clearAuthErrors();
}

function showRegister() {
    document.getElementById('login-card').style.display = 'none';
    document.getElementById('register-card').style.display = '';
    clearAuthErrors();
}

function clearAuthErrors() {
    ['login-error', 'reg-error', 'reg-success'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showAuthError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
}

function togglePw(inputId, btn) {
    const inp = document.getElementById(inputId);
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

function doLogin() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pw = document.getElementById('login-pw').value;
    if (!email || !pw) {
        showAuthError('login-error', 'Please enter email and password.');
        return;
    }

    const user = getUserByEmail(email);
    if (!user || user.password !== pw) {
        showAuthError('login-error', 'Invalid email or password.');
        return;
    }

    currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    setSession(currentUser);
    launchApp();
}

function doRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const pw = document.getElementById('reg-pw').value;
    const pw2 = document.getElementById('reg-pw2').value;

    clearAuthErrors();

    if (!name || !email || !pw || !pw2) {
        showAuthError('reg-error', 'All fields are required.');
        return;
    }
    if (pw !== pw2) {
        showAuthError('reg-error', 'Passwords do not match.');
        return;
    }
    if (pw.length < 6) {
        showAuthError('reg-error', 'Password must be at least 6 characters.');
        return;
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
        showAuthError('reg-error', 'Please enter a valid email.');
        return;
    }
    if (getUserByEmail(email)) {
        showAuthError('reg-error', 'This email is already registered.');
        return;
    }

    const users = loadUsers();
    const newUser = {
        id: users.length ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name,
        email,
        password: pw,
        role: 'user',
        created_at: new Date().toISOString()
    };

    users.unshift(newUser);
    saveUsers(users);

    currentUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    setSession(currentUser);
    launchApp();
}

function doLogout() {
    clearSession();
    currentUser = null;
    allComplaints = [];
    document.getElementById('app-screen').style.display = 'none';
    document.getElementById('auth-screen').style.display = 'grid';
    showLogin();
    document.getElementById('login-email').value = '';
    document.getElementById('login-pw').value = '';
}

function launchApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';

    document.getElementById('nav-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('nav-name').textContent = currentUser.name;
    const badge = document.getElementById('nav-role-badge');
    badge.textContent = currentUser.role.toUpperCase();
    badge.className = 'nav-role-badge' + (currentUser.role === 'admin' ? ' admin' : '');

    if (currentUser.role === 'admin') {
        if (!document.querySelector('[data-page="admin"]')) {
            const a1 = document.createElement('a');
            a1.href = '#'; a1.className = 'nav-link'; a1.dataset.page = 'admin'; a1.textContent = 'Admin Panel';
            a1.addEventListener('click', e => { e.preventDefault(); navigate('admin'); });
            document.getElementById('nav-links').appendChild(a1);
        }
        if (!document.querySelector('[data-page="users"]')) {
            const a2 = document.createElement('a');
            a2.href = '#'; a2.className = 'nav-link'; a2.dataset.page = 'users'; a2.textContent = 'Users';
            a2.addEventListener('click', e => { e.preventDefault(); navigate('users'); });
            document.getElementById('nav-links').appendChild(a2);
        }
        document.getElementById('track-heading-tag').textContent = '// ALL COMPLAINTS';
        document.getElementById('track-heading').textContent = 'All Complaints';
    } else {
        const adminLink = document.querySelector('[data-page="admin"]');
        const usersLink = document.querySelector('[data-page="users"]');
        if (adminLink) adminLink.remove();
        if (usersLink) usersLink.remove();
        document.getElementById('track-heading-tag').textContent = '// MY COMPLAINTS';
        document.getElementById('track-heading').textContent = 'My Complaints';
    }

    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    document.getElementById('hero-greeting').textContent = `${greet}, ${currentUser.name.split(' ')[0]}!`;

    navigate('dashboard');
}

function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    const lnk = document.querySelector(`[data-page="${page}"]`);
    if (lnk) lnk.classList.add('active');

    if (page === 'dashboard') loadDashboard();
    if (page === 'track') loadTracker();
    if (page === 'admin') loadAdmin();
    if (page === 'users') loadUsers();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); navigate(link.dataset.page); });
});

function loadDashboard() {
    const complaints = loadComplaints();
    allComplaints = currentUser.role === 'admin' ? complaints : complaints.filter(c => c.user_id === currentUser.id);
    const stats = allComplaints.reduce((acc, item) => {
        acc.total += 1;
        if (item.status in acc) acc[item.status] += 1;
        return acc;
    }, { total: 0, open: 0, 'in-progress': 0, resolved: 0, closed: 0 });

    animateCount('s-total', stats.total);
    animateCount('s-open', stats.open);
    animateCount('s-prog', stats['in-progress']);
    animateCount('s-res', stats.resolved + stats.closed);

    renderRecent(allComplaints.slice(0, 5));
}

function animateCount(id, target) {
    const el = document.getElementById(id);
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const t = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = cur;
        if (cur >= target) clearInterval(t);
    }, 30);
}

function renderRecent(list) {
    const el = document.getElementById('recent-list');
    if (!list.length) {
        el.innerHTML = '<p class="empty-state mono">// No complaints yet. File the first one!</p>';
        return;
    }
    el.innerHTML = list.map(c => `
    <div class="recent-item priority-${c.priority}" onclick="openModal('${c.ticket_id}')">
      <span class="recent-cat">${catIcon(c.category)}</span>
      <div class="recent-info">
        <div class="recent-title">${esc(c.title)}</div>
        <div class="recent-meta">${c.ticket_id} · ${esc(c.location)} · ${fmtDate(c.created_at)}</div>
      </div>
      <div class="recent-status">${statusBadge(c.status)}</div>
    </div>
  `).join('');
}

function prefill(cat) {
    navigate('report');
    setTimeout(() => { document.getElementById('f-category').value = cat; }, 100);
}

function loadTracker() {
    const complaints = loadComplaints();
    allComplaints = currentUser.role === 'admin' ? complaints : complaints.filter(c => c.user_id === currentUser.id);
    renderTracker();
}

function renderTracker() {
    const search = (document.getElementById('search-input').value || '').toLowerCase();
    const statusF = document.getElementById('filter-status').value;
    const catF = document.getElementById('filter-cat').value;

    const filtered = allComplaints.filter(c => {
        const matchesSearch = !search || c.title.toLowerCase().includes(search) || c.location.toLowerCase().includes(search) || c.ticket_id.toLowerCase().includes(search);
        const matchesStatus = !statusF || c.status === statusF;
        const matchesCategory = !catF || c.category === catF;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    const tbody = document.getElementById('complaints-tbody');
    const empty = document.getElementById('track-empty');

    if (!filtered.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = filtered.map(c => `
    <tr>
      <td class="ticket-id">${c.ticket_id}</td>
      <td>${esc(c.title)}</td>
      <td>${catIcon(c.category)} ${catLabel(c.category)}</td>
      <td>${esc(c.location)}</td>
      <td>${priorityBadge(c.priority)}</td>
      <td>${statusBadge(c.status)}</td>
      <td class="mono" style="font-size:0.7rem;color:var(--text-dim)">${fmtDate(c.created_at)}</td>
      <td><button class="btn-ghost small" onclick="openModal('${c.ticket_id}')">View</button></td>
    </tr>
  `).join('');
}

function handleFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        photoBase64 = e.target.result;
        document.getElementById('file-label').textContent = file.name;
        document.getElementById('photo-preview').src = photoBase64;
        document.getElementById('photo-preview-wrap').style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

function removePhoto() {
    photoBase64 = null;
    const input = document.getElementById('f-photo');
    input.value = '';
    document.getElementById('file-label').textContent = 'Click to attach image or drag & drop';
    document.getElementById('photo-preview-wrap').style.display = 'none';
}

const dropZone = document.getElementById('file-drop');
if (dropZone) {
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = ''; });
    dropZone.addEventListener('drop', e => {
        e.preventDefault(); dropZone.style.borderColor = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const dt = new DataTransfer(); dt.items.add(file);
            const inp = document.getElementById('f-photo'); inp.files = dt.files; handleFile(inp);
        }
    });
}

function resetForm() {
    ['f-location', 'f-category', 'f-title', 'f-description'].forEach(id => document.getElementById(id).value = '');
    document.querySelectorAll('input[name="priority"]').forEach(r => r.checked = false);
    removePhoto();
    document.getElementById('report-error').style.display = 'none';
    document.getElementById('report-success').style.display = 'none';
}

function submitComplaint() {
    const location = document.getElementById('f-location').value.trim();
    const category = document.getElementById('f-category').value;
    const priority = document.querySelector('input[name="priority"]:checked');
    const title = document.getElementById('f-title').value.trim();
    const description = document.getElementById('f-description').value.trim();

    const errEl = document.getElementById('report-error');
    const okEl = document.getElementById('report-success');
    errEl.style.display = 'none'; okEl.style.display = 'none';

    if (!location || !category || !priority || !title || !description) {
        errEl.textContent = 'Please fill in all required fields.';
        errEl.style.display = 'block';
        return;
    }

    const complaints = loadComplaints();
    const ticket_id = genTicket();
    const complaint = {
        id: complaints.length ? Math.max(...complaints.map(c => c.id)) + 1 : 1,
        ticket_id,
        user_id: currentUser.id,
        title,
        category,
        priority: priority.value,
        location,
        description,
        photo: photoBase64,
        status: 'open',
        timeline: [{ event: 'Complaint filed', date: new Date().toISOString(), by: currentUser.name }],
        created_at: new Date().toISOString()
    };

    complaints.unshift(complaint);
    saveComplaints(complaints);
    okEl.textContent = `✅ Complaint submitted! Ticket ID: ${ticket_id}`;
    okEl.style.display = 'block';
    resetForm();
    showToast('Complaint filed: ' + ticket_id);
}

function openModal(ticketId) {
    const complaint = loadComplaints().find(x => x.ticket_id === ticketId);
    if (!complaint) return;
    const user = getUserById(complaint.user_id);

    document.getElementById('modal-ticket').textContent = complaint.ticket_id;
    document.getElementById('modal-title').textContent = complaint.title;
    document.getElementById('modal-meta').innerHTML = `
    <span class="badge" style="background:var(--surface2);border:1px solid var(--border)">${catIcon(complaint.category)} ${catLabel(complaint.category)}</span>
    ${priorityBadge(complaint.priority)} ${statusBadge(complaint.status)}`;
    document.getElementById('modal-name').textContent = user ? user.name : '—';
    document.getElementById('modal-contact').textContent = user ? user.email : '—';
    document.getElementById('modal-location').textContent = complaint.location;
    document.getElementById('modal-date').textContent = fmtDate(complaint.created_at);
    document.getElementById('modal-desc').textContent = complaint.description;

    const photo = document.getElementById('modal-photo');
    if (complaint.photo) { photo.src = complaint.photo; photo.style.display = 'block'; }
    else photo.style.display = 'none';

    document.getElementById('modal-timeline').innerHTML =
        '<p class="mono" style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.8rem">// ACTIVITY LOG</p>' +
        complaint.timeline.map(t => `
      <div class="timeline-entry">
        <div class="tl-dot"></div>
        <div class="tl-text"><b>${esc(t.event)}</b>${t.by ? ' <span style="color:var(--text-muted)">by ' + esc(t.by) + '</span>' : ''}<br>
        ${fmtDate(t.date)}${t.note ? ' — ' + esc(t.note) : ''}</div>
      </div>`).join('');

    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
}

function loadAdmin() {
    allComplaints = loadComplaints();
    renderAdmin();
}

function renderAdmin() {
    const container = document.getElementById('admin-cards');
    const order = { open: 0, 'in-progress': 1, resolved: 2, closed: 3 };
    const sorted = [...allComplaints].sort((a, b) => (order[a.status] || 0) - (order[b.status] || 0));

    if (!sorted.length) {
        container.innerHTML = '<p class="empty-state mono">// No complaints to manage yet.</p>';
        return;
    }

    container.innerHTML = sorted.map(c => `
    <div class="admin-card" id="ac-${c.ticket_id}">
      <div class="admin-card-header">
        <div>
          <div class="admin-card-meta">${c.ticket_id} · ${catIcon(c.category)} ${catLabel(c.category)} · ${priorityBadge(c.priority)}</div>
          <div class="admin-card-title">${esc(c.title)}</div>
        </div>
        ${statusBadge(c.status)}
      </div>
      <div class="admin-card-loc">📍 ${esc(c.location)} &nbsp;·&nbsp; 👤 ${esc(getUserById(c.user_id)?.name || '—')}</div>
      <select class="status-select" id="sel-${c.ticket_id}">
        <option value="open" ${c.status === 'open' ? 'selected' : ''}>🔴 Open</option>
        <option value="in-progress" ${c.status === 'in-progress' ? 'selected' : ''}>🔧 In Progress</option>
        <option value="resolved" ${c.status === 'resolved' ? 'selected' : ''}>✅ Resolved</option>
        <option value="closed" ${c.status === 'closed' ? 'selected' : ''}>🔒 Closed</option>
      </select>
      <input type="text" class="admin-note-input" id="note-${c.ticket_id}" placeholder="Resolution note (optional)..." />
      <button class="admin-save-btn btn-primary" onclick="saveUpdate('${c.ticket_id}')">Save Update</button>
    </div>
  `).join('');
}

function saveUpdate(ticketId) {
    const complaints = loadComplaints();
    const idx = complaints.findIndex(c => c.ticket_id === ticketId);
    if (idx < 0) return;

    const status = document.getElementById('sel-' + ticketId).value;
    const note = document.getElementById('note-' + ticketId).value.trim();

    complaints[idx].status = status;
    complaints[idx].timeline = complaints[idx].timeline || [];
    complaints[idx].timeline.push({ event: `Status updated to: ${status}`, date: new Date().toISOString(), by: currentUser.name, note });
    saveComplaints(complaints);
    allComplaints = complaints;

    showToast('Status updated to: ' + status);
    renderAdmin();
}

function loadUsers() {
    const users = loadUsers();
    const tbody = document.getElementById('users-tbody');
    const empty = document.getElementById('users-empty');

    if (!users.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = users.map((u, i) => `
    <tr>
      <td class="mono" style="color:var(--text-muted)">${i + 1}</td>
      <td>${esc(u.name)}</td>
      <td style="font-family:var(--font-mono);font-size:0.8rem">${esc(u.email)}</td>
      <td><span class="badge badge-${u.role}">${u.role.toUpperCase()}</span></td>
      <td class="mono" style="font-size:0.72rem;color:var(--text-dim)">${fmtDate(u.created_at)}</td>
    </tr>
  `).join('');
}

function exportCSV() {
    if (!allComplaints.length) { showToast('No data to export', 'error'); return; }
    const headers = ['Ticket ID', 'Title', 'Category', 'Location', 'Priority', 'Status', 'Reporter', 'Date'];
    const rows = allComplaints.map(c => [
        c.ticket_id, c.title, catLabel(c.category), c.location, c.priority,
        c.status, getUserById(c.user_id)?.name || '', fmtDate(c.created_at)
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fixit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!');
}

const CAT_ICONS = { electrical: '⚡', water: '💧', sanitation: '🧹', structural: '🏗️', hvac: '❄️', other: '🔩' };
const CAT_LABELS = { electrical: 'Electrical', water: 'Water / Plumbing', sanitation: 'Sanitation', structural: 'Structural', hvac: 'HVAC', other: 'Other' };

function catIcon(c) { return CAT_ICONS[c] || '🔩'; }
function catLabel(c) { return CAT_LABELS[c] || c; }

function statusBadge(s) {
    const cls = { open: 'badge-open', 'in-progress': 'badge-in-progress', resolved: 'badge-resolved', closed: 'badge-closed' };
    const lbl = { open: 'Open', 'in-progress': 'In Progress', resolved: 'Resolved', closed: 'Closed' };
    return `<span class="badge ${cls[s] || 'badge-open'}">${lbl[s] || s}</span>`;
}

function priorityBadge(p) {
    return `<span class="badge badge-priority-${p}">${p}</span>`;
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function genTicket() {
    const suffix = [...Array(6)].map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 36))).join('');
    return `TKT-${suffix}`;
}

document.getElementById('login-pw').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('reg-pw2').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });

initStorage();
const savedSession = getSession();
if (savedSession) {
    const user = getUserByEmail(savedSession.email);
    if (user) {
        currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
        launchApp();
    } else {
        clearSession();
    }
}
