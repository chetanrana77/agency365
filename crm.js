// CRM State
let clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
let activeFilter = 'Lead';
let currentView = 'list';
let currentLeadId = null;

export function initCRM() {
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
        leadConfidence: document.getElementById('lead-confidence').value
    };

    if (editId) {
        const index = clients.findIndex(c => c.id === editId);
        if (index > -1) {
            client.payments = clients[index].payments || [];
            client.meetings = clients[index].meetings || [];
            client.calls = clients[index].calls || [];
            client.invoiceNumber = clients[index].invoiceNumber || '';
            clients[index] = client;
        }
    } else {
        client.calls = [];
        clients.push(client);
    }

    localStorage.setItem('agency365_clients', JSON.stringify(clients));
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
    localStorage.setItem('agency365_clients', JSON.stringify(clients));
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
    
    document.getElementById('add-lead-modal').classList.add('show');
}

export function openLeadDetails(id) {
    const client = clients.find(c => c.id === id);
    if(!client) return;
    currentLeadId = id;
    
    const panel = document.getElementById('client-side-panel');
    const detailsCont = document.getElementById('lead-details-content');
    
    detailsCont.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1.5rem;">
            <div>
                <h3 style="margin-bottom:0.25rem;">${client.name}</h3>
                <span class="status-badge status-${client.status.toLowerCase()}">${client.status === 'Inactive' ? 'Lost' : client.status}</span>
                ${client.leadConfidence ? `<span style="font-size:0.75rem; margin-left:0.5rem; background:var(--bg-secondary); padding:0.2rem 0.5rem; border-radius:4px;">${client.leadConfidence} Confidence</span>` : ''}
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
        localStorage.setItem('agency365_clients', JSON.stringify(clients));
        
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
    
    // Sort descending
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

function renderClients() {
    const tbody = document.getElementById('client-list');
    const gridCont = document.getElementById('grid-view-container');
    if(!tbody || !gridCont) return;
    
    tbody.innerHTML = '';
    gridCont.innerHTML = '';

    const filtered = clients.filter(c => c.status === activeFilter);

    if(filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">No ${activeFilter.toLowerCase()}s found.</td></tr>`;
        gridCont.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-secondary); padding:2rem;">No ${activeFilter.toLowerCase()}s found.</div>`;
        return;
    }

    if (currentView === 'list') {
        filtered.forEach(c => {
            const tr = document.createElement('tr');
            const statusClass = `status-${c.status.toLowerCase()}`;
            let leadInfo = '';
            if(c.leadDate) leadInfo = `<br><small style="color:var(--text-secondary)">Lead: ${new Date(c.leadDate).toLocaleDateString()}</small>`;
            
            tr.innerHTML = `
                <td style="cursor:pointer;" onclick="openLeadDetails('${c.id}')">
                    <strong>${c.name}</strong>
                    ${c.referral ? '<br><small>Ref: '+c.referral+'</small>' : ''}
                    ${leadInfo}
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
        filtered.forEach(c => {
            const statusClass = `status-${c.status.toLowerCase()}`;
            const card = document.createElement('div');
            card.style.cssText = 'background:var(--card-bg); border:1px solid var(--border-color); border-radius:12px; padding:1.5rem; box-shadow:var(--card-shadow); cursor:pointer; position:relative;';
            card.onclick = (e) => {
                if(!e.target.closest('button')) openLeadDetails(c.id);
            };
            
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                    <div>
                        <h3 style="margin-bottom:0.25rem; font-size:1.1rem; color:var(--text-primary);">${c.name}</h3>
                        <span class="status-badge ${statusClass}">${c.status === 'Inactive' ? 'Lost' : c.status}</span>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button onclick="editClient('${c.id}')" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                        <button onclick="deleteClient('${c.id}')" style="background:none;border:none;cursor:pointer;color:#ef4444;" title="Delete"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </div>
                </div>
                
                <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                    ${c.work || 'No details added.'}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-color);">
                    <div style="font-size:0.8rem; color:var(--text-secondary);">
                        ${c.leadDate ? `📅 ${new Date(c.leadDate).toLocaleDateString()}` : 'No date'}
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
