// CRM State
let clients = JSON.parse(sessionStorage.getItem('agency365_clients')) || [];
let activeFilter = 'Lead';
let currentView = 'list';
let currentLeadId = null;

let draggedIndex = null;
let draggedStatus = null;

export function initCRM() {
    clients = JSON.parse(sessionStorage.getItem('agency365_clients')) || [];
    setupTabs();
    setupViewToggles();
    renderClients();

    const addBtn = document.getElementById('add-client-btn');
    const addModal = document.getElementById('add-lead-modal');
    const closeAddBtn = document.getElementById('close-add-modal');
    const form = document.getElementById('client-form');
    
    addBtn?.addEventListener('click', () => {
        form.reset();
        document.getElementById('edit-lead-id').value = '';
        document.getElementById('modal-form-title').textContent = 'Add New Lead';
        addModal.classList.add('show');
    });
    closeAddBtn?.addEventListener('click', () => addModal.classList.remove('show'));
    addModal?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) addModal.classList.remove('show');
    });

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveClient();
    });

    // Side panel (Details)
    document.getElementById('close-panel-btn')?.addEventListener('click', closePanel);

    // Add Sales Call
    document.getElementById('add-call-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCallRecord();
    });
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderClients();
        });
    });
}

function setupViewToggles() {
    const listBtn = document.getElementById('view-list-btn');
    const gridBtn = document.getElementById('view-grid-btn');
    const listCont = document.getElementById('list-view-container');
    const gridCont = document.getElementById('grid-view-container');

    if(!listBtn || !gridBtn) return;

    listBtn.addEventListener('click', () => {
        currentView = 'list';
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
        listCont.style.display = 'block';
        gridCont.style.display = 'none';
        renderClients();
    });

    gridBtn.addEventListener('click', () => {
        currentView = 'grid';
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
        listCont.style.display = 'none';
        gridCont.style.display = 'grid';
        renderClients();
    });
}

function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
}

function closePanel() {
    document.getElementById('client-side-panel').classList.remove('open');
    currentLeadId = null;
}

function saveClient() {
    const editId = document.getElementById('edit-lead-id').value;
    
    const client = {
        id: editId || Date.now().toString(),
        name: document.getElementById('client-name').value,
        work: document.getElementById('client-work').value,
        amount: parseFloat(document.getElementById('client-amount').value) || 0,
        status: document.getElementById('client-status').value,
        
        phone: document.getElementById('client-phone').value,
        address: document.getElementById('client-address').value,
        
        invoice: document.getElementById('client-invoice').checked,
        proposal: document.getElementById('client-proposal').checked,
        referral: document.getElementById('client-referral').value,
        followup: document.getElementById('client-followup').value,
        
        leadDate: document.getElementById('lead-date').value,
        leadSource: document.getElementById('lead-source').value,
        leadConfidence: document.getElementById('lead-confidence').value,
        tags: document.getElementById('lead-tags').value.split(',').map(t => t.trim()).filter(Boolean)
    };

    if (editId) {
        const index = clients.findIndex(c => c.id === editId);
        if (index > -1) {
            client.payments = clients[index].payments || [];
            client.meetings = clients[index].meetings || [];
            client.calls = clients[index].calls || [];
            client.invoiceNumber = clients[index].invoiceNumber || '';
            client.order = clients[index].order;
            clients[index] = client;
        }
    } else {
        client.calls = [];
        client.order = clients.length;
        clients.push(client);
    }

    sessionStorage.setItem('agency365_clients', JSON.stringify(clients));
    document.getElementById('add-lead-modal').classList.remove('show');
    renderClients();
    
    // If the panel is open for this client, refresh it
    if(currentLeadId === client.id) {
        openLeadDetails(client.id);
    }
}

export async function deleteClient(id) {
    const confirmed = await window.customConfirm("Are you sure you want to delete this record?");
    if(!confirmed) return;
    clients = clients.filter(c => c.id !== id);
    sessionStorage.setItem('agency365_clients', JSON.stringify(clients));
    renderClients();
    if(currentLeadId === id) closePanel();
}

export function editClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    
    document.getElementById('edit-lead-id').value = client.id;
    document.getElementById('modal-form-title').textContent = 'Edit Lead';
    
    document.getElementById('client-name').value = client.name || '';
    document.getElementById('client-work').value = client.work || '';
    document.getElementById('client-amount').value = client.amount || 0;
    document.getElementById('client-status').value = client.status || 'Lead';
    
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-address').value = client.address || '';
    
    document.getElementById('client-invoice').checked = client.invoice || false;
    document.getElementById('client-proposal').checked = client.proposal || false;
    document.getElementById('client-referral').value = client.referral || '';
    document.getElementById('client-followup').value = client.followup || '';
    
    document.getElementById('lead-date').value = client.leadDate || '';
    document.getElementById('lead-source').value = client.leadSource || 'Inbound';
    document.getElementById('lead-confidence').value = client.leadConfidence || 'Medium';
    document.getElementById('lead-tags').value = (client.tags || []).join(', ');
    
    document.getElementById('add-lead-modal').classList.add('show');
}

export function openLeadDetails(id) {
    const client = clients.find(c => c.id === id);
    if(!client) return;
    currentLeadId = id;
    
    const panel = document.getElementById('client-side-panel');
    const detailsCont = document.getElementById('lead-details-content');
    
    const tagsHtml = (client.tags || []).map(t => `<span style="font-size:0.7rem; background:var(--bg-secondary); padding:0.15rem 0.4rem; border-radius:4px; border:1px solid var(--border-color); color:var(--text-secondary);">${t}</span>`).join('');

    detailsCont.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1.5rem;">
            <div>
                <h3 style="margin-bottom:0.25rem;">${client.name}</h3>
                <span class="status-badge status-${client.status.toLowerCase()}">${client.status === 'Inactive' ? 'Lost' : client.status}</span>
                ${client.leadConfidence ? `<span style="font-size:0.75rem; margin-left:0.5rem; background:var(--bg-secondary); padding:0.2rem 0.5rem; border-radius:4px;">${client.leadConfidence} Confidence</span>` : ''}
                <div style="display:flex; gap:0.25rem; margin-top:0.5rem;">
                    ${tagsHtml}
                </div>
            </div>
            <button class="secondary-btn" onclick="editClient('${client.id}')" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Edit Lead</button>
        </div>
        
        <div style="background:var(--bg-secondary); padding:1rem; border-radius:8px; margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span style="color:var(--text-secondary); font-size:0.85rem;">Project Amount</span>
                <strong style="color:var(--text-primary);">${formatAmount(client.amount)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span style="color:var(--text-secondary); font-size:0.85rem;">Source</span>
                <span style="color:var(--text-primary); font-size:0.9rem;">${client.leadSource || '—'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span style="color:var(--text-secondary); font-size:0.85rem;">Follow-up</span>
                <span style="color:var(--text-primary); font-size:0.9rem;">${client.followup || '—'}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                <span style="color:var(--text-secondary); font-size:0.85rem;">Contact</span>
                <span style="color:var(--text-primary); font-size:0.9rem;">${client.phone || '—'}</span>
            </div>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong style="display:block; margin-bottom:0.5rem; font-size:0.9rem;">Scope / Details</strong>
            <p style="font-size:0.85rem; color:var(--text-secondary); white-space:pre-wrap;">${client.work || '—'}</p>
        </div>
    `;
    
    document.getElementById('call-lead-id').value = client.id;
    renderSalesCalls(client);
    
    panel.classList.add('open');
}

function saveCallRecord() {
    const leadId = document.getElementById('call-lead-id').value;
    const date = document.getElementById('call-date').value;
    const meetLink = document.getElementById('call-meet-link').value;
    const notes = document.getElementById('call-notes').value;
    
    const idx = clients.findIndex(c => c.id === leadId);
    if(idx > -1) {
        if(!clients[idx].calls) clients[idx].calls = [];
        clients[idx].calls.push({ date, meetLink, notes, id: Date.now().toString() });
        sessionStorage.setItem('agency365_clients', JSON.stringify(clients));
        
        document.getElementById('add-call-form').reset();
        renderSalesCalls(clients[idx]);
    }
}

function renderSalesCalls(client) {
    const list = document.getElementById('sales-calls-list');
    const calls = client.calls || [];
    
    if(calls.length === 0) {
        list.innerHTML = `<div style="font-size:0.85rem; color:var(--text-secondary); text-align:center; padding:1rem 0;">No sales calls logged yet.</div>`;
        return;
    }
    
    calls.sort((a,b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = calls.map(c => `
        <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:0.75rem; border-radius:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <strong style="font-size:0.85rem; color:var(--text-primary);">${new Date(c.date).toLocaleDateString()}</strong>
                ${c.meetLink ? `<a href="${c.meetLink}" target="_blank" style="font-size:0.75rem; color:var(--accent-color); text-decoration:none; display:flex; align-items:center; gap:0.2rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15.6 11.6L22 7v10l-6.4-4.6v-1.8z"></path><rect x="2" y="5" width="14" height="14" rx="2" ry="2"></rect></svg> Meet Link</a>` : ''}
            </div>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin:0; white-space:pre-wrap;">${c.notes}</p>
        </div>
    `).join('');
}

// Drag & Drop Logic
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
    const el = e.target.closest('.draggable-item');
    if (el && el.dataset.status === draggedStatus) {
        el.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const el = e.target.closest('.draggable-item');
    if (el) {
        el.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.stopPropagation();
    const el = e.target.closest('.draggable-item');
    if (!el) return false;
    el.classList.remove('drag-over');
    
    const targetIndex = parseInt(el.dataset.index);
    if (draggedIndex !== targetIndex && el.dataset.status === draggedStatus) {
        const filtered = clients.filter(c => c.status === draggedStatus).sort((a,b) => (a.order||0) - (b.order||0));
        const item = filtered.splice(draggedIndex, 1)[0];
        filtered.splice(targetIndex, 0, item);
        filtered.forEach((c, i) => c.order = i);
        sessionStorage.setItem('agency365_clients', JSON.stringify(clients));
        renderClients();
    }
    return false;
}

function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.draggable-item').forEach(el => el.classList.remove('drag-over'));
}

window.moveLead = function(id, direction) {
    const filtered = clients.filter(c => c.status === activeFilter).sort((a,b) => (a.order||0) - (b.order||0));
    const idx = filtered.findIndex(c => c.id === id);
    if(idx < 0) return;
    
    const targetIdx = idx + direction;
    if(targetIdx >= 0 && targetIdx < filtered.length) {
        const temp = filtered[idx];
        filtered[idx] = filtered[targetIdx];
        filtered[targetIdx] = temp;
        filtered.forEach((c, i) => c.order = i);
        sessionStorage.setItem('agency365_clients', JSON.stringify(clients));
        renderClients();
    }
};

function renderClients() {
    const tbody = document.getElementById('client-list');
    const gridCont = document.getElementById('grid-view-container');
    if(!tbody || !gridCont) return;
    
    tbody.innerHTML = '';
    gridCont.innerHTML = '';

    let filtered = clients.filter(c => c.status === activeFilter);
    filtered.forEach((c, i) => { if(c.order === undefined) c.order = i; });
    filtered.sort((a, b) => a.order - b.order);

    if(filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">No ${activeFilter.toLowerCase()}s found.</td></tr>`;
        gridCont.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-secondary); padding:2rem;">No ${activeFilter.toLowerCase()}s found.</div>`;
        return;
    }

    if (currentView === 'list') {
        filtered.forEach((c, idx) => {
            const tr = document.createElement('tr');
            tr.className = 'draggable-item';
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
            
            const statusClass = `status-${c.status.toLowerCase()}`;
            let leadInfo = '';
            if(c.leadDate) leadInfo = `<br><small style="color:var(--text-secondary)">Lead: ${new Date(c.leadDate).toLocaleDateString()}</small>`;
            const tagsHtml = (c.tags || []).map(t => `<span style="font-size:0.6rem; background:var(--bg-secondary); padding:0.1rem 0.3rem; border-radius:4px; border:1px solid var(--border-color); color:var(--text-secondary); display:inline-block; margin-top:0.25rem; margin-right:0.25rem;">${t}</span>`).join('');
            
            tr.innerHTML = `
                <td style="display: flex; align-items: center; gap: 0.75rem; cursor: grab;" onclick="if(!event.target.closest('.drag-handle')) openLeadDetails('${c.id}')">
                    <span class="drag-handle" style="color:var(--text-secondary); opacity:0.5; font-size:1.2rem; cursor:grab;">⋮⋮</span>
                    <div>
                        <strong>${c.name}</strong>
                        ${c.referral ? '<br><small>Ref: '+c.referral+'</small>' : ''}
                        ${leadInfo}
                        ${tagsHtml ? `<div>${tagsHtml}</div>` : ''}
                    </div>
                </td>
                <td style="cursor:pointer;" onclick="openLeadDetails('${c.id}')">${c.work}</td>
                <td>${formatAmount(c.amount)}</td>
                <td><span class="status-badge ${statusClass}">${c.status === 'Inactive' ? 'Lost' : c.status}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editClient('${c.id}')">Edit</button>
                    <button class="action-btn delete delete-btn" onclick="deleteClient('${c.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        filtered.forEach((c, idx) => {
            const statusClass = `status-${c.status.toLowerCase()}`;
            const card = document.createElement('div');
            card.className = 'draggable-item';
            card.style.cssText = 'background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:1.5rem; box-shadow:var(--card-shadow); cursor:grab; position:relative; display:flex; flex-direction:column;';
            card.draggable = true;
            card.dataset.id = c.id;
            card.dataset.index = idx;
            card.dataset.status = activeFilter;
            
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragenter', handleDragEnter);
            card.addEventListener('dragover', handleDragOver);
            card.addEventListener('dragleave', handleDragLeave);
            card.addEventListener('drop', handleDrop);
            card.addEventListener('dragend', handleDragEnd);

            card.onclick = (e) => {
                if(!e.target.closest('button')) openLeadDetails(c.id);
            };
            
            const tagsHtml = (c.tags || []).map(t => `<span style="font-size:0.65rem; background:var(--bg-secondary); padding:0.15rem 0.4rem; border-radius:4px; border:1px solid var(--border-color); color:var(--text-secondary); display:inline-block;">${t}</span>`).join('');
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        <span class="drag-handle" style="color:var(--text-secondary); opacity:0.5; font-size:1.2rem; cursor:grab;">⋮⋮</span>
                        <h3 style="margin-bottom:0; font-size:1.1rem; color:var(--text-primary);">${c.name}</h3>
                    </div>
                    <span class="status-badge ${statusClass}">${c.status === 'Inactive' ? 'Lost' : c.status}</span>
                </div>
                
                ${tagsHtml ? `<div style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-bottom:0.75rem;">${tagsHtml}</div>` : ''}

                <div style="display:flex; gap:0.5rem; justify-content:flex-end; position:absolute; right:1.5rem; top:3.5rem;">
                    <button onclick="editClient('${c.id}')" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button onclick="deleteClient('${c.id}')" style="background:none;border:none;cursor:pointer;color:#ef4444;" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
                
                <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                    ${c.work || 'No details added.'}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:1rem; border-top:1px solid var(--border-color);">
                    <div style="display:flex; gap:0.25rem;">
                        <button onclick="window.moveLead('${c.id}', -1); event.stopPropagation();" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:4px; padding:0.25rem 0.5rem; cursor:pointer;" title="Move Up" ${idx===0?'disabled':''}>◀</button>
                        <button onclick="window.moveLead('${c.id}', 1); event.stopPropagation();" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:4px; padding:0.25rem 0.5rem; cursor:pointer;" title="Move Down" ${idx===filtered.length-1?'disabled':''}>▶</button>
                    </div>
                    <strong style="color:var(--text-primary); font-size:1rem;">${formatAmount(c.amount)}</strong>
                </div>
            `;
            gridCont.appendChild(card);
        });
    }
}

window.editClient = editClient;
window.deleteClient = deleteClient;
window.openLeadDetails = openLeadDetails;
