// CRM State
let clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
let editId = null;

export function initCRM() {
    renderClients();

    const addBtn = document.getElementById('add-client-btn');
    const panel = document.getElementById('client-side-panel');
    const closeBtn = document.getElementById('close-panel-btn');
    const form = document.getElementById('client-form');

    addBtn.addEventListener('click', () => openPanel());
    closeBtn.addEventListener('click', () => closePanel());
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveClient();
    });
}

function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
}

function openPanel(client = null) {
    const panel = document.getElementById('client-side-panel');
    const form = document.getElementById('client-form');
    const title = document.getElementById('panel-title');
    
    if (client) {
        title.textContent = 'Edit Entry';
        editId = client.id;
        document.getElementById('client-name').value = client.name;
        document.getElementById('client-work').value = client.work;
        document.getElementById('client-amount').value = client.amount;
        document.getElementById('client-status').value = client.status;
        
        document.getElementById('client-phone').value = client.phone || '';
        document.getElementById('client-gst').value = client.gst || '';
        document.getElementById('client-address').value = client.address || '';
        
        document.getElementById('client-invoice').checked = client.invoice || false;
        document.getElementById('client-proposal').checked = client.proposal || false;
        document.getElementById('client-referral').value = client.referral || '';
        document.getElementById('client-notes').value = client.notes || '';
        document.getElementById('client-followup').value = client.followup || '';
        
        document.getElementById('lead-date').value = client.leadDate || '';
        document.getElementById('lead-source').value = client.leadSource || '';
        document.getElementById('lead-confidence').value = client.leadConfidence || 'Medium';
    } else {
        title.textContent = 'Add New Entry';
        editId = null;
        form.reset();
        document.getElementById('lead-confidence').value = 'Medium';
    }
    
    panel.classList.add('open');
}

function closePanel() {
    document.getElementById('client-side-panel').classList.remove('open');
    editId = null;
}

function saveClient() {
    const client = {
        id: editId || Date.now().toString(),
        name: document.getElementById('client-name').value,
        work: document.getElementById('client-work').value,
        amount: parseFloat(document.getElementById('client-amount').value) || 0,
        status: document.getElementById('client-status').value,
        
        phone: document.getElementById('client-phone').value,
        gst: document.getElementById('client-gst').value,
        address: document.getElementById('client-address').value,
        
        invoice: document.getElementById('client-invoice').checked,
        proposal: document.getElementById('client-proposal').checked,
        referral: document.getElementById('client-referral').value,
        notes: document.getElementById('client-notes').value,
        followup: document.getElementById('client-followup').value,
        
        leadDate: document.getElementById('lead-date').value,
        leadSource: document.getElementById('lead-source').value,
        leadConfidence: document.getElementById('lead-confidence').value
    };

    if (editId) {
        const index = clients.findIndex(c => c.id === editId);
        if (index > -1) {
            // Preserve existing payments, meetings, invoiceNumber
            client.payments = clients[index].payments || [];
            client.meetings = clients[index].meetings || [];
            client.invoiceNumber = clients[index].invoiceNumber || '';
            clients[index] = client;
        }
    } else {
        clients.push(client);
    }

    saveToStorage();
    renderClients();
    closePanel();
}

export async function deleteClient(id) {
    const confirmed = await window.customConfirm("Are you sure you want to delete this record?");
    if(!confirmed) return;
    clients = clients.filter(c => c.id !== id);
    saveToStorage();
    renderClients();
}

export function editClient(id) {
    const client = clients.find(c => c.id === id);
    if (client) openPanel(client);
}

function saveToStorage() {
    localStorage.setItem('agency365_clients', JSON.stringify(clients));
}

function renderClients() {
    const tbody = document.getElementById('client-list');
    if(!tbody) return;
    tbody.innerHTML = '';

    const filteredClients = clients.filter(c => c.status === 'Lead');

    if(filteredClients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-secondary);">No active leads in pipeline.</td></tr>`;
        return;
    }

    filteredClients.forEach(c => {
        const tr = document.createElement('tr');
        const statusClass = `status-${c.status.toLowerCase()}`;
        
        let leadInfo = '';
        if(c.status === 'Lead' && c.leadDate) {
            leadInfo = `<br><small style="color:var(--text-secondary)">Lead: ${c.leadDate} ${c.leadTime}</small>`;
        }
        
        tr.innerHTML = `
            <td>
                <strong>${c.name}</strong>
                ${c.referral ? '<br><small>Ref: '+c.referral+'</small>' : ''}
                ${leadInfo}
            </td>
            <td>${c.work}</td>
            <td>
                ${formatAmount(c.amount)}
            </td>
            <td><span class="status-badge ${statusClass}">${c.status === 'Inactive' ? 'Old Client' : c.status}</span></td>
            <td>
                <button class="action-btn edit-btn" data-id="${c.id}">Edit</button>
                <button class="action-btn delete delete-btn" data-id="${c.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editClient(e.target.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteClient(e.target.dataset.id));
    });
}
