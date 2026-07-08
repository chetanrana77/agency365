let clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
let expenses = JSON.parse(localStorage.getItem('agency365_expenses')) || [];
let activeTab = 'Invoices';
let currentClientId = null;
let activeCatFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    calculateOverview();
    setupTabs();
    renderTable();

    // Expense Form Handlers
    document.getElementById('add-expense-btn').addEventListener('click', () => {
        populateClientDropdown();
        document.getElementById('panel-title').textContent = 'Log Expense';
        document.getElementById('expense-side-panel').classList.add('open');
    });

    // Add Payment header button → opens payment panel with client selection
    document.getElementById('add-payment-header-btn')?.addEventListener('click', () => {
        const activeClients = clients.filter(c => c.status === 'Active' || c.status === 'Inactive');
        if (activeClients.length === 0) { alert('No active clients. Convert a lead first.'); return; }
        openPaymentPanel(activeClients[0].id);
    });

    // Client selector change inside payment panel
    document.getElementById('pay-client-select')?.addEventListener('change', (e) => {
        currentClientId = e.target.value;
        const client = clients.find(c => c.id === currentClientId);
        if (client) renderPaymentList(client);
    });

    document.getElementById('close-panel-btn').addEventListener('click', () => {
        document.getElementById('expense-side-panel').classList.remove('open');
        document.getElementById('expense-form').reset();
    });

    document.getElementById('exp-type').addEventListener('change', (e) => {
        document.getElementById('project-select-group').style.display = e.target.value === 'Project' ? 'block' : 'none';
    });

    document.getElementById('expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const exp = {
            id: Date.now().toString(),
            name: document.getElementById('exp-name').value,
            amount: parseFloat(document.getElementById('exp-amount').value) || 0,
            date: document.getElementById('exp-date').value,
            type: document.getElementById('exp-type').value,
            category: document.getElementById('exp-category')?.value || 'General',
            clientId: document.getElementById('exp-type').value === 'Project' ? document.getElementById('exp-client').value : null
        };
        expenses.push(exp);
        localStorage.setItem('agency365_expenses', JSON.stringify(expenses));
        
        document.getElementById('expense-side-panel').classList.remove('open');
        document.getElementById('expense-form').reset();
        calculateOverview();
        if(activeTab === 'Expenses') renderTable();
    });

    // Payment/Invoice Handlers
    document.getElementById('close-payment-panel').addEventListener('click', () => {
        document.getElementById('payment-side-panel').classList.remove('open');
        currentClientId = null;
    });

    document.getElementById('add-payment-btn').addEventListener('click', () => {
        if(!currentClientId) return;
        const d = document.getElementById('new-payment-date').value;
        const a = document.getElementById('new-payment-amount').value;
        if(d && a) {
            const idx = clients.findIndex(c => c.id === currentClientId);
            if(idx > -1) {
                if(!clients[idx].payments) clients[idx].payments = [];
                clients[idx].payments.push({ date: d, amount: parseFloat(a) });
                localStorage.setItem('agency365_clients', JSON.stringify(clients));
                
                document.getElementById('new-payment-date').value = '';
                document.getElementById('new-payment-amount').value = '';
                
                renderPaymentList(clients[idx]);
                calculateOverview();
                if(activeTab === 'Invoices') renderTable();
            }
        }
    });

    document.getElementById('generate-invoice-btn').addEventListener('click', () => {
        if(!currentClientId) return;
        const idx = clients.findIndex(c => c.id === currentClientId);
        if(idx > -1) {
            // Assign Sequential Invoice Number if it doesn't exist
            if(!clients[idx].invoiceNumber) {
                let counter = parseInt(localStorage.getItem('agency365_invoice_counter') || '1000');
                counter++;
                clients[idx].invoiceNumber = `TM-${counter}`;
                localStorage.setItem('agency365_invoice_counter', counter.toString());
                localStorage.setItem('agency365_clients', JSON.stringify(clients));
                if(activeTab === 'Invoices') renderTable();
            }
            window.open(`invoice.html?id=${currentClientId}`, '_blank');
        }
    });
});

function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
}

function calculateOverview() {
    let grossRev = 0;
    let clientExp = 0;
    clients.forEach(c => {
        if (c.payments) c.payments.forEach(p => grossRev += p.amount);
        if (c.expenses) c.expenses.forEach(e => clientExp += e.amount);
    });

    let totalRev = grossRev - clientExp;

    let totalExp = 0;
    expenses.forEach(e => totalExp += e.amount);

    const profit = totalRev - totalExp;

    let totalDue = 0;
    clients.forEach(c => {
        if (c.status === 'Active' || c.status === 'Inactive') {
            const amount = parseFloat(c.amount) || 0;
            const paid = (c.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            const due = amount - paid;
            if (due > 0) totalDue += due;
        }
    });

    document.getElementById('fin-revenue').textContent = formatAmount(totalRev);
    document.getElementById('fin-expenses').textContent = formatAmount(totalExp);
    document.getElementById('fin-profit').textContent = formatAmount(profit);
    document.getElementById('fin-due').textContent = formatAmount(totalDue);
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const filterBar = document.getElementById('category-filter-bar');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            activeTab = e.target.dataset.filter;
            activeCatFilter = 'all';
            
            renderTable();
        });
    });
}

function populateClientDropdown() {
    const sel = document.getElementById('exp-client');
    sel.innerHTML = '<option value="">Select a client...</option>';
    clients.filter(c => c.status === 'Active' || c.status === 'Inactive').forEach(c => {
        sel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

function renderTable() {
    const table = document.getElementById('finance-table');
    table.innerHTML = '';

    if (activeTab === 'Invoices') {
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Invoice No</th>
                    <th>Client Name</th>
                    <th>Project Amount</th>
                    <th>Amount Paid</th>
                    <th>Status / Due</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        const activeClients = clients.filter(c => c.status === 'Active' || c.status === 'Inactive');
        
        if(activeClients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No clients available for invoicing.</td></tr>`;
            return;
        }

        activeClients.forEach(c => {
            const tr = document.createElement('tr');
            const totalPaid = (c.payments || []).reduce((sum, p) => sum + p.amount, 0);
            const due = (c.amount || 0) - totalPaid;
            const status = due <= 0 ? '<span class="status-badge status-active">Paid Full</span>' : `<span class="status-badge status-lead">Due: ${formatAmount(due)}</span>`;
            
            tr.innerHTML = `
                <td><strong>${c.invoiceNumber || 'Not Generated'}</strong></td>
                <td>${c.name}</td>
                <td>${formatAmount(c.amount)}</td>
                <td style="color:#10b981;">${formatAmount(totalPaid)}</td>
                <td>${status}</td>
                <td><button class="action-btn manage-btn" data-id="${c.id}">Manage</button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.manage-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openPaymentPanel(e.target.dataset.id));
        });

    } else if (activeTab === 'Expenses') {
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Expense Name</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        
        if(expenses.length === 0 && !clients.some(c => c.expenses && c.expenses.length > 0)) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No expenses logged.</td></tr>`;
            return;
        }

        let allExpenses = expenses.map(e => ({ ...e, isClient: false }));
        clients.forEach(c => {
            if (c.expenses) {
                c.expenses.forEach((ex, idx) => {
                    allExpenses.push({
                        id: `client_${c.id}_${idx}`,
                        name: `${ex.desc} (${c.name})`,
                        amount: ex.amount,
                        date: ex.date || '-',
                        category: ex.category || 'General',
                        isClient: true,
                        clientId: c.id,
                        idx: idx
                    });
                });
            }
        });

        // Apply category filter
        if (activeCatFilter && activeCatFilter !== 'all') {
            allExpenses = allExpenses.filter(e => (e.category || 'General') === activeCatFilter);
        }

        const catColors = { Design:'#6941c6', Tools:'#2563eb', Ads:'#f79009', Salaries:'#12b76a', Office:'#0ea5e9', Travel:'#f04438', Misc:'#64748b', General:'#94a3b8' };

        allExpenses.sort((a,b) => new Date(b.date === '-' ? '2000-01-01' : b.date) - new Date(a.date === '-' ? '2000-01-01' : a.date)).forEach(e => {
            const tr = document.createElement('tr');
            const typeLabel = e.isClient ? 'Client Expense' : (e.clientId ? 'Project Expense' : 'General Expense');
            const cat = e.category || 'General';
            const catColor = catColors[cat] || '#94a3b8';
            const catBadge = `<span style="font-size:0.7rem;background:${catColor}18;color:${catColor};padding:0.1rem 0.4rem;border-radius:12px;font-weight:600;margin-left:0.35rem;border:1px solid ${catColor}30;">${cat}</span>`;
            
            tr.innerHTML = `
                <td>${e.date}</td>
                <td><strong>${e.name}</strong>${catBadge}</td>
                <td><span class="status-badge" style="background:#f1f5f9; color:#475569;">${typeLabel}</span></td>
                <td style="color:#ef4444;">${formatAmount(e.amount)}</td>
                <td>
                    ${e.isClient ? '' : `<button class="action-btn edit-exp-btn" data-id="${e.id}" style="color:var(--accent-color); border-color:var(--accent-color); margin-right:0.25rem;">Edit</button>`}
                    <button class="action-btn del-btn" data-id="${e.id}" data-isclient="${e.isClient}" data-clientid="${e.clientId}" data-idx="${e.idx}" style="color:#ef4444; border-color:#ef4444;">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = String(e.currentTarget.dataset.id);
                const isClient = e.currentTarget.dataset.isclient === 'true';
                const clientId = e.currentTarget.dataset.clientid;
                const idx = parseInt(e.currentTarget.dataset.idx);

                const confirmed = await window.customConfirm('Delete expense?');
                if(confirmed) {
                    if (isClient) {
                        const cIdx = clients.findIndex(c => c.id === clientId);
                        if (cIdx > -1 && clients[cIdx].expenses) {
                            clients[cIdx].expenses.splice(idx, 1);
                            localStorage.setItem('agency365_clients', JSON.stringify(clients));
                        }
                    } else {
                        expenses = expenses.filter(exp => String(exp.id) !== targetId);
                        localStorage.setItem('agency365_expenses', JSON.stringify(expenses));
                    }
                    calculateOverview();
                    renderTable();
                }
            });
        });

        document.querySelectorAll('.edit-exp-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = String(e.currentTarget.dataset.id);
                const exp = expenses.find(ex => String(ex.id) === targetId);
                if (!exp) return;
                const newName = await window.customPrompt('Expense name:', exp.name);
                if (newName === null) return;
                const newAmount = await window.customPrompt('Amount (₹):', exp.amount);
                if (newAmount === null) return;
                const newDate = await window.customPrompt('Date (YYYY-MM-DD):', exp.date);
                if (newDate === null) return;
                
                if (newName) exp.name = newName;
                if (newAmount && !isNaN(parseFloat(newAmount))) exp.amount = parseFloat(newAmount);
                if (newDate) exp.date = newDate;
                localStorage.setItem('agency365_expenses', JSON.stringify(expenses));
                calculateOverview();
                renderTable();
            });
        });
    }
}

function openPaymentPanel(id) {
    currentClientId = id;
    // Populate client selector
    const sel = document.getElementById('pay-client-select');
    if (sel) {
        sel.innerHTML = '';
        clients.filter(c => c.status === 'Active' || c.status === 'Inactive').forEach(c => {
            sel.innerHTML += `<option value="${c.id}" ${c.id === id ? 'selected' : ''}>${c.name}</option>`;
        });
    }
    const client = clients.find(c => c.id === id);
    if(!client) return;
    renderPaymentList(client);
    document.getElementById('payment-side-panel').classList.add('open');
}

function renderPaymentList(client) {
    const list = document.getElementById('payments-list');
    list.innerHTML = '';
    
    const pays = client.payments || [];
    if(pays.length === 0) {
        list.innerHTML = '<em style="font-size:0.85rem; color:var(--text-secondary);">No payments logged.</em>';
        return;
    }

    pays.forEach((p, i) => {
        const div = document.createElement('div');
        div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:var(--bg-secondary); padding:0.75rem; border-radius:8px; border:1px solid var(--border-color);';
        div.innerHTML = `
            <div>
                <span style="font-weight:500; font-size:0.9rem;">${p.date}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.4rem;">
                <span style="font-weight:600; color:#10b981;">${formatAmount(p.amount)}</span>
                <button class="pay-edit" data-idx="${i}" style="background:none; border:none; cursor:pointer; font-size:0.75rem; color:var(--accent-color);" title="Edit">✏️</button>
                <button class="pay-del" data-idx="${i}" style="background:none; border:none; cursor:pointer; font-size:0.75rem; color:#ef4444;" title="Delete">🗑️</button>
            </div>
        `;
        list.appendChild(div);
    });

    // Bind edit/delete
    list.querySelectorAll('.pay-edit').forEach(btn => btn.addEventListener('click', async (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        const p = client.payments[idx];
        const newAmount = await window.customPrompt('Enter new amount:', p.amount);
        if (newAmount === null) return;
        const newDate = await window.customPrompt('Enter new date (YYYY-MM-DD):', p.date);
        if (newDate === null) return;
        
        if (newAmount && !isNaN(parseFloat(newAmount))) client.payments[idx].amount = parseFloat(newAmount);
        if (newDate) client.payments[idx].date = newDate;
        localStorage.setItem('agency365_clients', JSON.stringify(clients));
        renderPaymentList(client); calculateOverview(); if(activeTab === 'Invoices') renderTable();
    }));
    
    list.querySelectorAll('.pay-del').forEach(btn => btn.addEventListener('click', async (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx);
        const confirmed = await window.customConfirm('Delete this payment?');
        if (confirmed) {
            client.payments.splice(idx, 1);
            localStorage.setItem('agency365_clients', JSON.stringify(clients));
            renderPaymentList(client); calculateOverview(); if(activeTab === 'Invoices') renderTable();
        }
    }));
}
