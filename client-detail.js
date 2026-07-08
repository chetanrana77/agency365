// ──────────────────────────────────────────────────────────────────
//  Client Command Center — client-detail.js  v2
// ──────────────────────────────────────────────────────────────────

let clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
let client = null;
let clientIdx = -1;
let currentUser = '';
let activeWorkFilter = 'all'; // 'today' | 'week' | 'all'

const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });

// ─── Helpers ─────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function dateLabel(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function daysDiff(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function saveClients() {
    clients[clientIdx] = client;
    localStorage.setItem('agency365_clients', JSON.stringify(clients));
}

function getWorkUpdateCategoryStyle(cat) {
    const map = {
        'done':        { bg: 'rgba(18,183,106,0.15)',  color: '#059669', dot: '#059669', label: '✅ Done' },
        'in-progress': { bg: 'rgba(59,130,246,0.15)',  color: '#2563eb', dot: '#2563eb', label: '🔄 In Progress' },
        'milestone':   { bg: 'rgba(245,158,11,0.15)',  color: '#d97706', dot: '#d97706', label: '🏆 Milestone' },
        'blocked':     { bg: 'rgba(239,68,68,0.15)',   color: '#dc2626', dot: '#ef4444', label: '🚫 Blocked' },
    };
    return map[cat] || map['done'];
}

function getCommStyle(type) {
    const map = {
        'note':    { icon: '📝', bg: 'rgba(245,158,11,0.1)',  label: 'Note',     color: '#d97706' },
        'email':   { icon: '📧', bg: 'rgba(59,130,246,0.1)', label: 'Email',    color: '#2563eb' },
        'call':    { icon: '📞', bg: 'rgba(16,185,129,0.1)', label: 'Call',     color: '#059669' },
        'message': { icon: '💬', bg: 'rgba(139,92,246,0.1)', label: 'Message',  color: '#7c3aed' },
    };
    return map[type] || map['note'];
}

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    // Load current user
    const userSettings = JSON.parse(localStorage.getItem('agency365_user_settings') || '{}');
    currentUser = userSettings.userName || userSettings.name || 'Admin';

    clientIdx = clients.findIndex(c => c.id === id);
    if (clientIdx === -1) {
        document.getElementById('main-content').innerHTML = `
            <div style="padding:4rem; text-align:center;">
                <div style="font-size:3rem; margin-bottom:1rem;">🔍</div>
                <h2 style="margin-bottom:0.5rem;">Client not found</h2>
                <p style="color:var(--text-secondary); margin-bottom:1.5rem;">This client may have been deleted or the link is incorrect.</p>
                <a href="clients.html" class="primary-btn" style="text-decoration:none; display:inline-block;">← Back to Clients</a>
            </div>`;
        return;
    }

    client = clients[clientIdx];

    // Ensure new arrays exist
    if (!client.meetings)       client.meetings       = [];
    if (!client.workUpdates)    client.workUpdates    = [];
    if (!client.communications) client.communications = [];
    if (!client.tasks)          client.tasks          = [];
    if (!client.payments)       client.payments       = [];
    if (!client.expenses)       client.expenses       = [];
    if (!client.suggestions)    client.suggestions    = [];
    if (!client.clientType)     client.clientType     = 'one-time';

    // Update URL slug
    const slug = encodeURIComponent(client.name.toLowerCase().replace(/\s+/g, '-'));
    const tabParam = params.get('tab');
    const tabString = tabParam ? `&tab=${tabParam}` : '';
    window.history.replaceState(null, '', `client-detail.html?id=${id}&slug=${slug}${tabString}`);
    document.title = `${client.name} — Agency 365`;

    renderAll();
    bindTabNav();
    bindEvents();

    if (tabParam) {
        switchTab(tabParam);
    }
});

// ─── Render All ───────────────────────────────────────────────────
function renderAll() {
    renderHero();
    renderOverview();
    renderMeetings();
    renderWorkUpdates();
    renderCommunication();
    renderFinance();
    updateTabCounts();
}

// ─── Hero Banner ──────────────────────────────────────────────────
function renderHero() {
    document.getElementById('client-name-el').childNodes[0].textContent = client.name + ' ';

    // Avatar initials or Image
    const avatarEl = document.getElementById('client-avatar-el');
    if (client.image) {
        avatarEl.innerHTML = `<img src="${client.image}" alt="${client.name}">`;
        avatarEl.style.background = 'transparent';
    } else {
        const initials = client.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        avatarEl.innerHTML = '';
        avatarEl.textContent = initials;
        avatarEl.style.background = ''; // reset to default CSS
    }

    // Domain link
    const domainLink = document.getElementById('client-domain-link');
    if (client.website) {
        let url = client.website;
        if (!url.startsWith('http')) url = 'https://' + url;
        const domain = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        domainLink.href = url;
        domainLink.textContent = '🌐 ' + domain;
        domainLink.style.display = '';
    } else {
        domainLink.style.display = 'none';
    }

    // Status pill
    const statusPill = document.getElementById('status-pill');
    const statusMap = {
        'Active': ['● Active', 'pill-green'],
        'Inactive': ['● Inactive', 'pill-gray'],
        'Lead':   ['● Lead',   'pill-yellow'],
    };
    const [stText, stClass] = statusMap[client.status] || ['● Active', 'pill-green'];
    statusPill.className = `pill ${stClass}`;
    statusPill.textContent = stText;



    // Contact Info in Hero
    const heroContactRow = document.getElementById('hero-contact-row');
    if (heroContactRow) {
        let contactHtml = '';
        if (client.contactPerson) contactHtml += `<span title="Founder / Contact Person">👤 <strong>${client.contactPerson}</strong></span>`;
        if (client.phone) contactHtml += `<span title="Contact Number">📞 ${client.phone}</span>`;
        if (client.address) contactHtml += `<span title="Office Address">📍 ${client.address}</span>`;
        if (client.gst) contactHtml += `<span title="GST Number">🧾 GST: ${client.gst}</span>`;
        heroContactRow.innerHTML = contactHtml;
    }

    // Stats
    const totalPaid = (client.payments || []).reduce((s, p) => s + p.amount, 0);
    const totalExp  = (client.expenses  || []).reduce((s, e) => s + e.amount, 0);
    const due       = (client.amount || 0) - totalPaid;
    const pct       = client.amount ? Math.min(100, Math.round(totalPaid / client.amount * 100)) : 0;

    document.getElementById('stat-value').textContent    = fmt.format(client.amount || 0);
    document.getElementById('stat-received').textContent = fmt.format(totalPaid);
    document.getElementById('stat-received-pct').textContent = `${pct}% collected`;
    document.getElementById('stat-progress').style.width = `${pct}%`;

    document.getElementById('stat-due').textContent      = due > 0 ? fmt.format(due) : '₹0';
    document.getElementById('stat-due').className        = due > 0 ? 'hero-stat-val red' : 'hero-stat-val green';

    // Days active
    const createdDate = client.createdAt ? client.createdAt.split('T')[0] : null;
    const days = createdDate ? daysDiff(createdDate) : null;
    document.getElementById('stat-days').textContent = days !== null ? days : '—';
    document.getElementById('stat-since').textContent = createdDate ? `Since ${dateLabel(createdDate)}` : 'Since —';
}

// ─── Overview Tab ─────────────────────────────────────────────────
function renderOverview() {
    // Contact Info
    const infoRows = [
        ['Contact Person', client.contactPerson || client.name],
        ['Email',          client.contactEmail  || '—'],
        ['Phone',          client.phone         || '—'],
        ['GST Number',     client.gst           || '—'],
        ['Industry',       client.industry      || '—'],
        ['Website',        client.website ? `<a href="${client.website.startsWith('http') ? client.website : 'https://'+client.website}" target="_blank" style="color:var(--accent-color);">${client.website}</a>` : '—'],
        ['Address',        client.address       || '—'],
        ['Referral',       client.referral      || '—'],
    ];
    document.getElementById('client-info-rows').innerHTML = infoRows.map(([l, v]) =>
        `<div class="info-row"><span class="info-label">${l}</span><span class="info-value">${v}</span></div>`
    ).join('');

    // Project Details
    const totalPaid = (client.payments || []).reduce((s, p) => s + p.amount, 0);
    const totalExp  = (client.expenses  || []).reduce((s, e) => s + e.amount, 0);
    const profit    = totalPaid - totalExp;
    const projRows = [
        ['Project Scope',  client.work || '—'],
        ['Contract Value', fmt.format(client.amount || 0)],
        ['Client Type',    client.clientType === 'recurring' ? '🔄 Recurring' : '📦 One-Time'],
        ['Total Received', `<span style="color:#059669;font-weight:700;">${fmt.format(totalPaid)}</span>`],
        ['Total Expenses', `<span style="color:#dc2626;font-weight:700;">-${fmt.format(totalExp)}</span>`],
        ['Net Profit',     `<span style="color:${profit >= 0 ? '#059669' : '#dc2626'};font-weight:700;">${fmt.format(profit)}</span>`],
        ['Invoice No.',    client.invoiceNumber || 'Not raised'],
    ];
    document.getElementById('project-info-rows').innerHTML = projRows.map(([l, v]) =>
        `<div class="info-row"><span class="info-label">${l}</span><span class="info-value">${v}</span></div>`
    ).join('');

    renderTasks();
}

// ─── Tasks ────────────────────────────────────────────────────────
function renderTasks() {
    const tasks = client.tasks || [];
    const listEl = document.getElementById('tasks-list');
    const badgeEl = document.getElementById('tasks-count-badge');
    const pending = tasks.filter(t => !t.done).length;
    badgeEl.textContent = pending;

    if (tasks.length === 0) {
        listEl.innerHTML = `<div style="color:var(--text-secondary);font-size:0.85rem;padding:0.5rem 0;">No tasks yet.</div>`;
        return;
    }

    listEl.innerHTML = tasks.map((t, i) => `
        <div class="task-item-row">
            <div class="task-left">
                <input type="checkbox" class="task-check" data-idx="${i}" ${t.done ? 'checked' : ''} style="cursor:pointer; accent-color:var(--accent-color);">
                <span class="${t.done ? 'task-text-done' : ''}">${t.text}</span>
                ${t.dueDate ? `<span class="task-due-chip">📅 ${t.dueDate}</span>` : ''}
            </div>
            <button class="del-btn task-del" data-idx="${i}" title="Delete task">✕</button>
        </div>
    `).join('');

    listEl.querySelectorAll('.task-check').forEach(chk =>
        chk.addEventListener('change', e => {
            client.tasks[+e.target.dataset.idx].done = e.target.checked;
            saveClients(); renderTasks(); renderOverview();
        })
    );
    listEl.querySelectorAll('.task-del').forEach(btn =>
        btn.addEventListener('click', async e => {
            if (await window.customConfirm?.('Delete this task?') ?? confirm('Delete this task?')) {
                client.tasks.splice(+e.currentTarget.dataset.idx, 1);
                saveClients(); renderTasks(); renderOverview();
            }
        })
    );
}

// ─── Meetings Tab ─────────────────────────────────────────────────
function renderMeetings() {
    const meetings = [...(client.meetings || [])].sort((a, b) => b.date.localeCompare(a.date));
    const el = document.getElementById('meetings-list');

    if (meetings.length === 0) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div><div>No meetings logged yet.</div><div style="font-size:0.82rem;margin-top:0.35rem;">Add your first meeting with agenda and recording link.</div></div>`;
        return;
    }

    const statusStyles = {
        completed:  { label: 'Completed',  dot: '#059669', pill: 'pill-green' },
        scheduled:  { label: 'Scheduled',  dot: '#2563eb', pill: 'pill-blue' },
        cancelled:  { label: 'Cancelled',  dot: '#9ca3af', pill: 'pill-gray' },
    };

    el.innerHTML = meetings.map((m, i) => {
        const st = statusStyles[m.status] || statusStyles.completed;
        const recordingBtn = m.recordingUrl
            ? `<a href="${m.recordingUrl}" target="_blank" class="meeting-recording-link">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                   Watch Recording
               </a>`
            : `<span style="font-size:0.78rem;color:var(--text-secondary);">No recording</span>`;

        return `
        <div class="meeting-card" data-mid="${m.id}">
            <div class="meeting-card-header">
                <div>
                    <div class="meeting-title">${m.title}</div>
                    <div class="meeting-meta">
                        📆 ${dateLabel(m.date)}${m.time ? ' · ⏰ ' + m.time : ''}
                        ${m.addedBy ? ` · <span style="color:var(--accent-color);font-weight:600;">by ${m.addedBy}</span>` : ''}
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <span class="pill ${st.pill}" style="font-size:0.72rem;">
                        <span class="meeting-status-dot" style="background:${st.dot};"></span>${st.label}
                    </span>
                    <button class="del-btn meeting-del-btn" data-mid="${m.id}" title="Delete">✕</button>
                </div>
            </div>
            ${m.agenda ? `<div class="meeting-agenda">${m.agenda.replace(/\n/g, '<br>')}</div>` : ''}
            <div class="meeting-footer">
                ${recordingBtn}
                ${m.attendees ? `<span class="meeting-attendees">👥 ${m.attendees}</span>` : ''}
            </div>
            ${m.notes ? `<div class="meeting-notes-text">📋 ${m.notes.replace(/\n/g, '<br>')}</div>` : ''}
        </div>`;
    }).join('');

    el.querySelectorAll('.meeting-del-btn').forEach(btn =>
        btn.addEventListener('click', async e => {
            if (await window.customConfirm?.('Delete this meeting?') ?? confirm('Delete this meeting?')) {
                const mid = e.currentTarget.dataset.mid;
                client.meetings = client.meetings.filter(m => m.id !== mid);
                saveClients(); renderMeetings(); updateTabCounts();
            }
        })
    );
}

// ─── Work Updates Tab ─────────────────────────────────────────────
function renderWorkUpdates(filter) {
    if (filter) activeWorkFilter = filter;
    const allUpdates = [...(client.workUpdates || [])].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const el = document.getElementById('work-updates-list');

    // Apply filter
    const todayStr  = today();
    const weekAgo   = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const filtered  = allUpdates.filter(u => {
        if (activeWorkFilter === 'today') return u.date === todayStr;
        if (activeWorkFilter === 'week')  return u.date >= weekAgo;
        return true;
    });

    if (filtered.length === 0) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">🛠</div><div>No updates${activeWorkFilter !== 'all' ? ' for this period' : ' yet'}.</div></div>`;
        return;
    }

    // Group by period
    const groups = {};
    filtered.forEach(u => {
        let group;
        if (u.date === todayStr) group = 'Today';
        else if (u.date === new Date(Date.now() - 86400000).toISOString().split('T')[0]) group = 'Yesterday';
        else if (u.date >= weekAgo) group = 'This Week';
        else group = 'Earlier';
        if (!groups[group]) groups[group] = [];
        groups[group].push(u);
    });

    const ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    let html = '';
    ORDER.forEach(groupName => {
        if (!groups[groupName]) return;
        html += `<div class="timeline-group-label">${groupName}</div>`;
        groups[groupName].forEach((u, idx) => {
            const st = getWorkUpdateCategoryStyle(u.category);
            const isLast = idx === groups[groupName].length - 1;
            html += `
            <div class="work-update-card" data-uid="${u.id}">
                <div class="wu-dot-col">
                    <div class="wu-dot" style="background:${st.dot};box-shadow:0 0 0 3px ${st.bg};"></div>
                    ${!isLast ? '<div class="wu-line"></div>' : ''}
                </div>
                <div class="wu-body">
                    <div class="wu-text">${u.text.replace(/\n/g, '<br>')}</div>
                    <div class="wu-footer">
                        <span class="wu-cat-chip" style="background:${st.bg};color:${st.color};">${st.label}</span>
                        ${u.date ? `<span class="wu-time">📅 ${dateLabel(u.date)}</span>` : ''}
                        ${u.author ? `<span class="wu-author">by <strong>${u.author}</strong></span>` : ''}
                        <button class="del-btn wu-del-btn" data-uid="${u.id}" title="Delete" style="margin-left:auto;">✕</button>
                    </div>
                </div>
            </div>`;
        });
    });
    el.innerHTML = html;

    el.querySelectorAll('.wu-del-btn').forEach(btn =>
        btn.addEventListener('click', async e => {
            if (await window.customConfirm?.('Delete this update?') ?? confirm('Delete this update?')) {
                const uid = e.currentTarget.dataset.uid;
                client.workUpdates = client.workUpdates.filter(u => u.id !== uid);
                saveClients(); renderWorkUpdates(); updateTabCounts();
            }
        })
    );

    // Update filter button styles
    ['all','today','week'].forEach(f => {
        const btn = document.getElementById(`filter-${f === 'week' ? 'week' : f}-btn`);
        if (btn) btn.style.borderColor = (activeWorkFilter === f || (f === 'week' && activeWorkFilter === 'week'))
            ? 'var(--accent-color)' : 'var(--border-color)';
    });
}

// ─── Communication Tab ────────────────────────────────────────────
function renderCommunication() {
    const comms = [...(client.communications || [])].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const el = document.getElementById('communication-list');

    if (comms.length === 0) {
        el.innerHTML = `<div class="empty-state"><div class="empty-icon">💬</div><div>No communication logs yet.</div><div style="font-size:0.82rem;margin-top:0.35rem;">Log notes, emails, calls, or messages from your team.</div></div>`;
        return;
    }

    el.innerHTML = comms.map(c => {
        const st = getCommStyle(c.type);
        return `
        <div class="comm-card" data-cid="${c.id}">
            <div class="comm-icon" style="background:${st.bg};">${st.icon}</div>
            <div class="comm-body">
                <div class="comm-header">
                    <span class="comm-type-label" style="color:${st.color};">${st.label}</span>
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                        <span class="comm-time">${c.date ? dateLabel(c.date) : timeAgo(c.timestamp)}</span>
                        <button class="del-btn comm-del-btn" data-cid="${c.id}" title="Delete">✕</button>
                    </div>
                </div>
                <div class="comm-text">${c.text.replace(/\n/g, '<br>')}</div>
                ${c.author ? `<div class="comm-author">— ${c.author}</div>` : ''}
            </div>
        </div>`;
    }).join('');

    el.querySelectorAll('.comm-del-btn').forEach(btn =>
        btn.addEventListener('click', async e => {
            if (await window.customConfirm?.('Delete this communication log?') ?? confirm('Delete?')) {
                const cid = e.currentTarget.dataset.cid;
                client.communications = client.communications.filter(c => c.id !== cid);
                saveClients(); renderCommunication(); updateTabCounts();
            }
        })
    );
}

// ─── Finance Tab ──────────────────────────────────────────────────
function renderFinance() {
    const pays = client.payments || [];
    const exps = client.expenses  || [];
    const totalPaid = pays.reduce((s, p) => s + p.amount, 0);
    const totalExp  = exps.reduce((s, e) => s + e.amount, 0);
    const profit    = totalPaid - totalExp;

    document.getElementById('fin-total-received').textContent = fmt.format(totalPaid);
    document.getElementById('fin-total-expenses').textContent = fmt.format(totalExp);
    const profEl = document.getElementById('fin-net-profit');
    profEl.textContent = fmt.format(profit);
    profEl.className   = `fin-sum-val ${profit >= 0 ? 'green' : 'red'}`;

    // Payments list
    const payEl = document.getElementById('payments-list');
    payEl.innerHTML = pays.length ? pays.map(p => `
        <div class="finance-row">
            <div>
                <div style="font-weight:600;font-size:0.88rem;">${p.date}</div>
                ${p.refund ? '<div class="finance-row-label" style="color:#d97706;">(Refund)</div>' : ''}
            </div>
            <span style="font-weight:700;color:${p.refund ? '#d97706' : '#059669'};">${p.refund ? '-' : ''}${fmt.format(p.amount)}</span>
        </div>`).join('')
    : `<div style="color:var(--text-secondary);font-size:0.85rem;padding:0.5rem 0;">No payments logged.</div>`;

    // Expenses list
    const expEl = document.getElementById('expenses-list');
    expEl.innerHTML = exps.length ? exps.map((ex, i) => `
        <div class="finance-row">
            <div>
                <div style="font-weight:600;font-size:0.88rem;">${ex.desc}</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
                <span style="font-weight:700;color:#dc2626;">-${fmt.format(ex.amount)}</span>
                <button class="del-btn exp-del-btn" data-idx="${i}" title="Delete">✕</button>
            </div>
        </div>`).join('')
    : `<div style="color:var(--text-secondary);font-size:0.85rem;padding:0.5rem 0;">No expenses logged.</div>`;

    expEl.querySelectorAll('.exp-del-btn').forEach(btn =>
        btn.addEventListener('click', async e => {
            if (await window.customConfirm?.('Delete this expense?') ?? confirm('Delete?')) {
                client.expenses.splice(+e.currentTarget.dataset.idx, 1);
                saveClients(); renderFinance(); renderHero(); renderOverview();
            }
        })
    );
}

// ─── Suggestions Engine ───────────────────────────────────────────
function buildAutoSuggestions() {
    const auto = [];
    const totalPaid = (client.payments || []).reduce((s, p) => s + p.amount, 0);
    const totalMeetings = (client.meetings || []).length;
    const lastMeeting = (client.meetings || []).sort((a, b) => b.date.localeCompare(a.date))[0];

    if (client.clientType === 'one-time') {
        auto.push('💡 Convert to a recurring retainer — offer a monthly maintenance plan to build long-term revenue.');
    }
    if (!lastMeeting || daysDiff(lastMeeting?.date) > 30) {
        auto.push('📞 No meeting in 30+ days — schedule a check-in call to maintain client relationship.');
    }
    if ((client.amount || 0) < 20000) {
        auto.push('📈 Low contract value — consider upselling an SEO or Social Media package.');
    }
    if (client.website && !(client.work || '').toLowerCase().includes('maintenance')) {
        auto.push('🔧 Client has a website — suggest an Annual Website Maintenance Plan (₹12,000–₹18,000/yr).');
    }
    if (!(client.work || '').toLowerCase().includes('social')) {
        auto.push('📲 No social media scope in project — suggest a Social Media Management add-on.');
    }
    if ((client.expenses || []).length === 0 && client.website) {
        auto.push('🖥 No hosting expenses tracked — verify if domain/hosting is being charged to the client.');
    }
    if (totalMeetings === 0) {
        auto.push('🎯 No meetings logged yet — document all client interactions for a complete project record.');
    }

    return auto;
}

function renderSuggestions() {
    const auto = buildAutoSuggestions();
    const custom = client.suggestions || [];
    const all = [...auto, ...custom.map(s => s.text)];

    const el = document.getElementById('suggestions-list');
    if (all.length === 0) {
        el.innerHTML = `<div style="font-size:0.83rem;opacity:0.7;">All looks good! No suggestions right now.</div>`;
        return;
    }

    el.innerHTML = all.map(s => `
        <div class="suggestion-item">
            <span class="suggestion-dot">◆</span>
            <span>${s}</span>
        </div>`).join('');
}

// ─── Tab Counts ───────────────────────────────────────────────────
function updateTabCounts() {
    document.getElementById('tab-count-meetings').textContent = (client.meetings || []).length;
    document.getElementById('tab-count-work').textContent     = (client.workUpdates || []).length;
    document.getElementById('tab-count-comm').textContent     = (client.communications || []).length;
}

// ─── Tab Navigation ───────────────────────────────────────────────
function bindTabNav() {
    document.querySelectorAll('.client-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.client-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active');
            
            // Deep linking update
            const params = new URLSearchParams(window.location.search);
            params.set('tab', btn.dataset.tab);
            const slug = encodeURIComponent(client.name.toLowerCase().replace(/\s+/g, '-'));
            window.history.replaceState(null, '', `client-detail.html?id=${client.id}&slug=${slug}&${params.toString()}`);
        });
    });
}

// ─── Modal Helpers ────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function bindModalClose(overlayId, closeId) {
    document.getElementById(closeId)?.addEventListener('click', () => closeModal(overlayId));
    document.getElementById(overlayId)?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeModal(overlayId);
    });
}

// ─── Bind All Events ──────────────────────────────────────────────
function bindEvents() {



    // ── Add Task ────────────────────────────────────────────────
    document.getElementById('add-task-btn')?.addEventListener('click', () => {
        const text  = document.getElementById('new-task-text').value.trim();
        const dDate = document.getElementById('new-task-date').value;
        if (!text) return;
        client.tasks.push({ id: uid(), text, done: false, dueDate: dDate || null, addedBy: currentUser, timestamp: Date.now() });
        saveClients();
        document.getElementById('new-task-text').value = '';
        document.getElementById('new-task-date').value = '';
        renderTasks(); updateTabCounts();
    });
    document.getElementById('new-task-text')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('add-task-btn').click();
    });

    // ── Add Payment ─────────────────────────────────────────────
    document.getElementById('add-pay-btn')?.addEventListener('click', () => {
        const d = document.getElementById('new-pay-date').value;
        const a = parseFloat(document.getElementById('new-pay-amount').value);
        if (!d || isNaN(a)) return;
        client.payments.push({ id: uid(), date: d, amount: a, addedBy: currentUser });
        saveClients();
        document.getElementById('new-pay-date').value = '';
        document.getElementById('new-pay-amount').value = '';
        renderFinance(); renderHero(); renderOverview();
    });

    // ── Add Expense ─────────────────────────────────────────────
    document.getElementById('add-exp-btn')?.addEventListener('click', () => {
        const desc   = document.getElementById('new-exp-desc').value.trim();
        const amount = parseFloat(document.getElementById('new-exp-amount').value);
        if (!desc || isNaN(amount)) return;
        client.expenses.push({ id: uid(), desc, amount, addedBy: currentUser });
        saveClients();
        document.getElementById('new-exp-desc').value = '';
        document.getElementById('new-exp-amount').value = '';
        renderFinance(); renderHero(); renderOverview();
    });

    // ── Work update filters ─────────────────────────────────────
    document.getElementById('filter-today-btn')?.addEventListener('click', () => renderWorkUpdates('today'));
    document.getElementById('filter-week-btn')?.addEventListener('click',  () => renderWorkUpdates('week'));
    document.getElementById('filter-all-btn')?.addEventListener('click',   () => renderWorkUpdates('all'));

    // ── Quick action buttons ────────────────────────────────────
    document.getElementById('add-work-update-quick-btn')?.addEventListener('click', () => {
        switchTab('work-updates');
        openWorkUpdateModal();
    });
    document.getElementById('add-comm-quick-btn')?.addEventListener('click', () => {
        switchTab('communication');
        openCommModal('note');
    });
    document.getElementById('add-note-btn')?.addEventListener('click',    () => openCommModal('note'));
    document.getElementById('add-email-btn')?.addEventListener('click',   () => openCommModal('email'));
    document.getElementById('add-call-btn')?.addEventListener('click',    () => openCommModal('call'));
    document.getElementById('add-message-btn')?.addEventListener('click', () => openCommModal('message'));

    document.getElementById('add-meeting-btn')?.addEventListener('click', openMeetingModal);
    document.getElementById('add-work-btn')?.addEventListener('click',    openWorkUpdateModal);
    document.getElementById('edit-contact-btn')?.addEventListener('click', () => openEditModal());

    // ── Schedule Meeting → Calendar ─────────────────────────────
    document.getElementById('schedule-meet-btn')?.addEventListener('click', () => {
        sessionStorage.setItem('agency365_schedule_client', JSON.stringify({ id: client.id, name: client.name }));
        window.location.href = 'calendar.html';
    });

    // ── Raise Invoice ───────────────────────────────────────────
    document.getElementById('raise-invoice-btn')?.addEventListener('click', () => {
        if (!client.invoiceNumber) {
            let counter = parseInt(localStorage.getItem('agency365_invoice_counter') || '1000');
            counter++;
            client.invoiceNumber = `TM-${counter}`;
            localStorage.setItem('agency365_invoice_counter', counter.toString());
            saveClients(); renderHero(); renderOverview();
        }
        window.open(`invoice.html?id=${client.id}`, '_blank');
    });

    // ── Send Invoice by Email ───────────────────────────────────
    document.getElementById('send-invoice-btn')?.addEventListener('click', () => {
        const subject = encodeURIComponent(`Invoice ${client.invoiceNumber || ''} - ${client.name}`);
        const body    = encodeURIComponent(`Hi ${client.contactPerson || client.name},\n\nPlease find your invoice attached.\n\nInvoice No.: ${client.invoiceNumber || 'Pending'}\nAmount: ${fmt.format(client.amount)}\n\nThank you for your business!\n\nBest,\nAgency 365`);
        window.open(`https://mail.hostinger.com/?action=compose&to=${encodeURIComponent(client.contactEmail || '')}&subject=${subject}&body=${body}`, '_blank');
    });

    // ── Open Proposal ───────────────────────────────────────────
    document.getElementById('open-proposal-btn')?.addEventListener('click', () => {
        window.location.href = `proposals.html?client=${encodeURIComponent(client.name)}`;
    });

    // ── Edit Client Modal ───────────────────────────────────────
    document.getElementById('edit-client-btn')?.addEventListener('click', openEditModal);
    bindModalClose('edit-modal', 'close-edit-modal');

    // ── WhatsApp Client Update ────────────────────────────────
    document.getElementById('whatsapp-client-btn')?.addEventListener('click', () => {
        const phone = (client.phone || '').replace(/\D/g, '');
        const paid = (client.payments || []).filter(p => !p.refund).reduce((s, p) => s + p.amount, 0);
        const due = (client.amount || 0) - paid;
        const msg = encodeURIComponent(`Hi ${client.name},\n\nHope you're doing well! Just a quick update from Agency 365.\n\nProject: ${client.work || 'Your Project'}\nContract Value: ₹${client.amount?.toLocaleString('en-IN') || 0}\nAmount Due: ₹${due.toLocaleString('en-IN')}\n\nLet us know if you have any questions. 🙏`);
        window.open(phone ? `https://wa.me/91${phone}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
    });



    document.getElementById('edit-client-form')?.addEventListener('submit', e => {
        e.preventDefault();
        client.name          = document.getElementById('edit-name').value;
        client.contactPerson = document.getElementById('edit-contact-person').value;
        client.contactEmail  = document.getElementById('edit-contact-email').value;
        client.phone         = document.getElementById('edit-phone').value;
        client.gst           = document.getElementById('edit-gst').value;
        client.website       = document.getElementById('edit-website').value;
        client.industry      = document.getElementById('edit-industry').value;
        client.address       = document.getElementById('edit-address').value;
        client.amount        = parseFloat(document.getElementById('edit-amount').value) || 0;
        client.status        = document.getElementById('edit-status').value;
        client.priority      = document.getElementById('edit-priority').value;
        client.work          = document.getElementById('edit-work').value;
        client.referral      = document.getElementById('edit-referral').value;
        
        const imgPreview = document.getElementById('edit-image-preview');
        if (imgPreview.dataset.newImage) {
            client.image = imgPreview.dataset.newImage;
            delete imgPreview.dataset.newImage;
        }

        saveClients();
        closeModal('edit-modal');
        const slug = encodeURIComponent(client.name.toLowerCase().replace(/\s+/g, '-'));
        window.history.replaceState(null, '', `client-detail.html?id=${client.id}&slug=${slug}`);
        document.title = `${client.name} — Agency 365`;
        renderAll();
    });

    // ── Add Meeting Modal ───────────────────────────────────────
    bindModalClose('add-meeting-modal', 'close-meeting-modal');

    document.getElementById('add-meeting-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const meeting = {
            id:           uid(),
            title:        document.getElementById('meet-title').value,
            date:         document.getElementById('meet-date').value,
            time:         document.getElementById('meet-time').value,
            status:       document.getElementById('meet-status').value,
            agenda:       document.getElementById('meet-agenda').value,
            recordingUrl: document.getElementById('meet-recording').value,
            attendees:    document.getElementById('meet-attendees').value,
            notes:        document.getElementById('meet-notes').value,
            addedBy:      currentUser,
            timestamp:    Date.now(),
        };
        client.meetings.push(meeting);
        saveClients();
        document.getElementById('add-meeting-form').reset();
        closeModal('add-meeting-modal');
        renderMeetings(); updateTabCounts();
    });

    // ── Add Work Update Modal ───────────────────────────────────
    bindModalClose('add-work-modal', 'close-work-modal');

    document.getElementById('add-work-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const update = {
            id:        uid(),
            text:      document.getElementById('work-text').value,
            category:  document.getElementById('work-category').value,
            date:      document.getElementById('work-date').value || today(),
            author:    currentUser,
            timestamp: Date.now(),
        };
        client.workUpdates.push(update);
        saveClients();
        document.getElementById('add-work-form').reset();
        closeModal('add-work-modal');
        renderWorkUpdates(); updateTabCounts();
    });

    // ── Add Communication Modal ─────────────────────────────────
    bindModalClose('add-comm-modal', 'close-comm-modal');

    document.getElementById('add-comm-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const comm = {
            id:        uid(),
            type:      document.getElementById('comm-type').value,
            text:      document.getElementById('comm-text').value,
            date:      document.getElementById('comm-date').value || today(),
            author:    currentUser,
            timestamp: Date.now(),
        };
        client.communications.push(comm);
        saveClients();
        document.getElementById('add-comm-form').reset();
        closeModal('add-comm-modal');
        renderCommunication(); updateTabCounts();
    });

    // ── Custom Suggestion Modal ─────────────────────────────────
    document.getElementById('add-suggestion-btn')?.addEventListener('click', () => openModal('add-suggestion-modal'));
    bindModalClose('add-suggestion-modal', 'close-suggestion-modal');

    document.getElementById('add-suggestion-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const text = document.getElementById('suggestion-text').value.trim();
        if (!text) return;
        if (!client.suggestions) client.suggestions = [];
        client.suggestions.push({ id: uid(), text, addedBy: currentUser });
        saveClients();
        document.getElementById('add-suggestion-form').reset();
        closeModal('add-suggestion-modal');
        renderSuggestions();
    });

    document.getElementById('edit-client-image')?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const imgPreview = document.getElementById('edit-image-preview');
                imgPreview.src = evt.target.result;
                imgPreview.style.display = 'block';
                imgPreview.dataset.newImage = evt.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// ─── Helper: Open Edit Modal pre-filled ──────────────────────────
function openEditModal() {
    const imgPreview = document.getElementById('edit-image-preview');
    const fileInput = document.getElementById('edit-client-image');
    if (fileInput) fileInput.value = '';
    if (imgPreview) {
        delete imgPreview.dataset.newImage;
        if (client.image) {
            imgPreview.src = client.image;
            imgPreview.style.display = 'block';
        } else {
            imgPreview.style.display = 'none';
            imgPreview.src = '';
        }
    }

    document.getElementById('edit-name').value           = client.name         || '';
    document.getElementById('edit-contact-person').value = client.contactPerson || '';
    document.getElementById('edit-contact-email').value  = client.contactEmail  || '';
    document.getElementById('edit-phone').value          = client.phone         || '';
    document.getElementById('edit-gst').value            = client.gst           || '';
    document.getElementById('edit-website').value        = client.website        || '';
    document.getElementById('edit-industry').value       = client.industry       || '';
    document.getElementById('edit-address').value        = client.address        || '';
    document.getElementById('edit-amount').value         = client.amount         || '';
    document.getElementById('edit-status').value         = client.status         || 'Active';
    document.getElementById('edit-priority').value       = client.priority       || 'Medium';
    document.getElementById('edit-work').value           = client.work           || '';
    document.getElementById('edit-referral').value       = client.referral       || '';
    openModal('edit-modal');
}

function openMeetingModal() {
    document.getElementById('meet-date').value = today();
    openModal('add-meeting-modal');
}

function openWorkUpdateModal() {
    document.getElementById('work-date').value = today();
    openModal('add-work-modal');
}

function openCommModal(type) {
    document.getElementById('comm-type').value = type || 'note';
    document.getElementById('comm-date').value = today();
    openModal('add-comm-modal');
}

function switchTab(tabName) {
    document.querySelectorAll('.client-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector(`.client-tab[data-tab="${tabName}"]`);
    if (btn) btn.classList.add('active');
    const panel = document.getElementById(`panel-${tabName}`);
    if (panel) panel.classList.add('active');
}
