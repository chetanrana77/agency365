// Clients State
let clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
let activeFilter = 'Active';
let currentView = 'list';
let currentClientId = null;

function calcHealthScore(client) {
    let score = 100;
    // Payment health (40 pts max): deduct if large amount unpaid
    if (client.amount) {
        const paid = (client.payments||[]).filter(p=>!p.refund).reduce((s,p)=>s+p.amount,0);
        const ratio = paid / client.amount;
        if (ratio < 0.25) score -= 35;
        else if (ratio < 0.5) score -= 20;
        else if (ratio < 0.75) score -= 10;
    }
    // Meeting frequency (30 pts): deduct if no recent meetings
    const meetings = client.meetings || [];
    if (meetings.length === 0) score -= 25;
    else {
        const lastMeeting = new Date(Math.max(...meetings.map(m=>new Date(m.date))));
        const daysSince = Math.floor((Date.now()-lastMeeting)/86400000);
        if (daysSince > 60) score -= 20;
        else if (daysSince > 30) score -= 10;
    }
    // Communication recency (30 pts)
    const comms = client.communications || [];
    if (comms.length === 0) score -= 20;
    else {
        const lastComm = new Date(Math.max(...comms.map(c=>new Date(c.date))));
        const daysSince = Math.floor((Date.now()-lastComm)/86400000);
        if (daysSince > 14) score -= 15;
        else if (daysSince > 7) score -= 8;
    }
    return Math.max(0, Math.min(100, score));
}

function healthBadge(client) {
    if (client.status === 'Lead') return '';
    const score = calcHealthScore(client);
    const color = score >= 80 ? '#12b76a' : score >= 50 ? '#f79009' : '#f04438';
    const label = score >= 80 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    return `<span title="Health Score: ${score}/100" style="font-size:0.72rem;background:${color}18;color:${color};padding:0.15rem 0.45rem;border-radius:20px;font-weight:600;border:1px solid ${color}40;">${label} ${score}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupViewToggles();
    renderClients();
    
    document.getElementById('close-panel-btn')?.addEventListener('click', closePanel);

    // Add Client Modal Logic
    document.getElementById('add-client-header-btn')?.addEventListener('click', () => {
        document.getElementById('add-client-form').reset();
        document.getElementById('add-client-modal').classList.add('show');
    });

    document.getElementById('close-add-modal')?.addEventListener('click', () => {
        document.getElementById('add-client-modal').classList.remove('show');
    });

    document.getElementById('add-client-modal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
    });

    document.getElementById('add-client-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newClient = {
            id: Date.now().toString(),
            name: document.getElementById('add-client-name').value,
            phone: document.getElementById('add-client-phone').value,
            gst: document.getElementById('add-client-gst').value,
            amount: parseFloat(document.getElementById('add-client-amount').value) || 0,
            status: document.getElementById('add-client-status').value,
            priority: document.getElementById('add-client-priority')?.value || 'Medium',
            deadline: document.getElementById('add-client-deadline')?.value || null,
            work: '--',
            stage: 'Initial Contact',
            date: new Date().toISOString().split('T')[0],
            payments: [],
            meetings: [],
            tasks: [],
            order: clients.length
        };
        
        const fileInput = document.getElementById('add-client-image');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    // Resize to max 150px to save localStorage space
                    const MAX_WIDTH = 150;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    newClient.image = canvas.toDataURL(file.type || 'image/jpeg', 0.8);
                    saveAndRenderNewClient(newClient);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            saveAndRenderNewClient(newClient);
        }
    });

    function saveAndRenderNewClient(clientData) {
        clients.push(clientData);
        localStorage.setItem('agency365_clients', JSON.stringify(clients));
        document.getElementById('add-client-modal').classList.remove('show');
        // Switch tab to the new client's status if needed
        activeFilter = clientData.status;
        document.querySelectorAll('.tab-btn').forEach(t => {
            t.classList.toggle('active', t.dataset.filter === activeFilter);
        });
        renderClients();
    }
    
    document.getElementById('add-meeting-btn').addEventListener('click', () => {
        if(!currentClientId) return;
        const d = document.getElementById('new-meeting-date').value;
        const n = document.getElementById('new-meeting-note').value;
        
        if(d && n) {
            const idx = clients.findIndex(c => c.id === currentClientId);
            if(idx > -1) {
                if(!clients[idx].meetings) clients[idx].meetings = [];
                clients[idx].meetings.push({ date: d, note: n });
                localStorage.setItem('agency365_clients', JSON.stringify(clients));
                
                document.getElementById('new-meeting-date').value = '';
                document.getElementById('new-meeting-note').value = '';
                renderMeetings(clients[idx]);
            }
        }
    });
});

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.dataset.filter;
            renderClients();
        });
    });
}

function setupViewToggles() {
    document.getElementById('view-list-btn')?.addEventListener('click', (e) => {
        currentView = 'list';
        document.getElementById('view-grid-btn').classList.remove('active');
        e.target.classList.add('active');
        renderClients();
    });
    document.getElementById('view-grid-btn')?.addEventListener('click', (e) => {
        currentView = 'grid';
        document.getElementById('view-list-btn').classList.remove('active');
        e.target.classList.add('active');
        renderClients();
    });
}

let draggedIndex = null;
let draggedStatus = null;

function handleDragStart(e) {
    draggedIndex = parseInt(e.currentTarget.dataset.index);
    draggedStatus = e.currentTarget.dataset.status;
    e.currentTarget.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    const tr = e.target.closest('tr');
    if (tr && tr.dataset.status === draggedStatus) {
        tr.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const tr = e.target.closest('tr');
    if (tr) {
        tr.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.stopPropagation();
    const tr = e.target.closest('tr');
    if (!tr) return false;
    tr.classList.remove('drag-over');
    const targetIndex = parseInt(tr.dataset.index);
    if (draggedIndex !== targetIndex && tr.dataset.status === draggedStatus) {
        const filtered = clients.filter(c => c.status === draggedStatus).sort((a,b) => (a.order||0) - (b.order||0));
        const item = filtered.splice(draggedIndex, 1)[0];
        filtered.splice(targetIndex, 0, item);
        filtered.forEach((c, i) => c.order = i);
        localStorage.setItem('agency365_clients', JSON.stringify(clients));
        renderClients();
    }
    return false;
}

function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('#client-list tr').forEach(row => row.classList.remove('drag-over'));
}

function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
}

function renderClients() {
    const listContainer = document.getElementById('list-view-container');
    const gridContainer = document.getElementById('grid-view-container');
    const tbody = document.getElementById('client-list');
    if(!tbody || !gridContainer) return;
    
    tbody.innerHTML = '';
    gridContainer.innerHTML = '';

    if (currentView === 'list') {
        listContainer.style.display = 'block';
        gridContainer.style.display = 'none';
    } else {
        listContainer.style.display = 'none';
        gridContainer.style.display = 'grid';
    }

    let filtered = clients.filter(c => c.status === activeFilter);
    // Assign order if missing
    filtered.forEach((c, i) => { if(c.order === undefined) c.order = i; });
    filtered.sort((a, b) => a.order - b.order);

    if(filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">No ${activeFilter} clients found.</td></tr>`;
        gridContainer.innerHTML = `<div style="text-align:center; grid-column: 1/-1; color:var(--text-secondary);">No ${activeFilter} clients found.</div>`;
        return;
    }

    const priorityColors = { 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#10b981' };

    filtered.forEach((c, idx) => {
        const statusClass = `status-${c.status.toLowerCase()}`;
        const totalPaid = (c.payments || []).reduce((sum, p) => sum + p.amount, 0);
        const slug = encodeURIComponent(c.name.toLowerCase().replace(/\s+/g, '-'));
        const pColor = priorityColors[c.priority || 'Medium'];
        const pendingTasks = (c.tasks || []).filter(t => !t.done);
        
        // List View Row
        const tr = document.createElement('tr');
        tr.draggable = true;
        tr.dataset.id = c.id;
        tr.dataset.index = idx;
        tr.dataset.status = activeFilter;
        tr.addEventListener('dragstart', handleDragStart);
        tr.addEventListener('dragenter', handleDragEnter);
        tr.addEventListener('dragover', handleDragOver);
        tr.addEventListener('dragleave', handleDragLeave);
        tr.addEventListener('drop', handleDrop);
        tr.addEventListener('dragend', handleDragEnd);
        tr.innerHTML = `
            <td style="display: flex; align-items: center; gap: 0.75rem; cursor: grab;">
                <span style="color:var(--text-secondary); opacity:0.5; font-size:1.2rem;">⋮⋮</span>
                <img src="${c.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=f1f5f9&color=64748b`}" alt="avatar" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
                <div>
                    <a href="client-detail.html?id=${c.id}&slug=${slug}" style="color:var(--text-primary); text-decoration:none;"><strong>${c.name}</strong></a><br>
                    <small style="color:var(--text-secondary)">${c.phone || ''}</small>
                </div>
            </td>
            <td>
                ${formatAmount(c.amount)}<br>
                <small style="color:#10b981;">Paid: ${formatAmount(totalPaid)}</small>
            </td>
            <td>
                <span style="font-size:0.75rem; padding:0.15rem 0.4rem; background:${pColor}15; color:${pColor}; border-radius:4px; font-weight:600;">${c.priority || 'Medium'}</span>
                <div style="font-size:0.8rem; margin-top:0.25rem; color:var(--text-secondary);">${pendingTasks.length} Pending Tasks</div>
            </td>
            <td><span class="status-badge ${statusClass}">${c.status}</span></td>
            <td style="display:flex; gap:0.25rem; align-items:center;">
                <a href="client-detail.html?id=${c.id}&slug=${slug}" class="action-btn view-btn">View Details</a>
            </td>
        `;
        tbody.appendChild(tr);

        // Grid View Card
        const card = document.createElement('div');
        card.style.cssText = 'background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:1.25rem; display:flex; flex-direction:column; position:relative;';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <img src="${c.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=f1f5f9&color=64748b`}" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <a href="client-detail.html?id=${c.id}&slug=${slug}" style="color:var(--text-primary); text-decoration:none; font-size:1.1rem;"><strong>${c.name}</strong></a>
                </div>
                <span class="status-badge ${statusClass}" style="font-size:0.7rem;">${c.status}</span>
            </div>
            <div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
                <span style="font-size:0.7rem; padding:0.15rem 0.4rem; background:${pColor}15; color:${pColor}; border-radius:4px; font-weight:600;">${c.priority || 'Medium'} Priority</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem; flex:1;">${c.work}</p>
            <div style="background:var(--bg-secondary); padding:0.75rem; border-radius:6px; margin-bottom:1rem;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                    <span>Project:</span> <strong>${formatAmount(c.amount)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#10b981;">
                    <span>Paid:</span> <strong>${formatAmount(totalPaid)}</strong>
                </div>
            </div>
            ${pendingTasks.length > 0 ? `
            <div style="margin-bottom:1rem;">
                <strong style="font-size:0.8rem; display:block; margin-bottom:0.25rem;">Pending Tasks:</strong>
                <ul style="margin:0; padding-left:1.25rem; font-size:0.8rem; color:var(--text-secondary);">
                    ${pendingTasks.slice(0,2).map(t => `<li>${t.text}</li>`).join('')}
                    ${pendingTasks.length > 2 ? `<li>+${pendingTasks.length-2} more</li>` : ''}
                </ul>
            </div>` : '<div style="margin-bottom:1rem; font-size:0.8rem; color:var(--text-secondary);">No pending tasks</div>'}
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                <div style="display:flex; gap:0.25rem;">
                    <button onclick="window.moveClient('${c.id}', -1)" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:4px; padding:0.25rem 0.5rem; cursor:pointer;" title="Move Up" ${idx===0?'disabled':''}>◀</button>
                    <button onclick="window.moveClient('${c.id}', 1)" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:4px; padding:0.25rem 0.5rem; cursor:pointer;" title="Move Down" ${idx===filtered.length-1?'disabled':''}>▶</button>
                </div>
                <a href="client-detail.html?id=${c.id}&slug=${slug}" class="action-btn view-btn">View Details</a>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

function openPanel(id) {
    currentClientId = id;
    const client = clients.find(c => c.id === id);
    if(!client) return;

    document.getElementById('detail-name').textContent = client.name;
    document.getElementById('detail-contact').innerHTML = `
        ${client.phone ? `📞 ${client.phone}` : ''} <br>
        ${client.gst ? `📄 GST: ${client.gst}` : ''}
    `;
    document.getElementById('detail-address').textContent = client.address || '';
    document.getElementById('detail-work').textContent = client.work || 'No project scope specified.';

    renderMeetings(client);
    renderPayments(client);

    document.getElementById('client-side-panel').classList.add('open');
}

function closePanel() {
    document.getElementById('client-side-panel').classList.remove('open');
    currentClientId = null;
}

function renderMeetings(client) {
    const list = document.getElementById('meetings-list');
    list.innerHTML = '';
    
    const meets = client.meetings || [];
    if(meets.length === 0) {
        list.innerHTML = '<em style="font-size:0.85rem; color:var(--text-secondary);">No meetings logged.</em>';
        return;
    }

    meets.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(m => {
        const div = document.createElement('div');
        div.style.background = 'var(--bg-secondary)';
        div.style.padding = '0.5rem';
        div.style.borderRadius = '6px';
        div.style.fontSize = '0.9rem';
        
        const dateStr = new Date(m.date).toLocaleString('en-GB');
        
        div.innerHTML = `
            <strong style="color:var(--text-primary);">${dateStr}</strong>
            <p style="margin-top:0.25rem; color:var(--text-secondary);">${m.note}</p>
        `;
        list.appendChild(div);
    });
}

function renderPayments(client) {
    const list = document.getElementById('payments-list');
    list.innerHTML = '';
    
    const pays = client.payments || [];
    if(pays.length === 0) {
        list.innerHTML = '<em style="font-size:0.85rem; color:var(--text-secondary);">No payments logged.</em>';
        return;
    }

    pays.forEach(p => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.background = 'var(--bg-secondary)';
        div.style.padding = '0.5rem';
        div.style.borderRadius = '6px';
        div.style.fontSize = '0.9rem';
        
        div.innerHTML = `
            <span>${p.date}</span>
            <span style="font-weight:600; color:#10b981;">${formatAmount(p.amount)}</span>
        `;
        list.appendChild(div);
    });
}
