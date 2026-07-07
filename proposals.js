// proposals.js - Proposals State & Logic for Agency 365

let proposals = JSON.parse(localStorage.getItem('agency365_proposals')) || [];
let clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });

let activeFilter = 'All';
let searchQuery = '';

export function initProposals() {
    setupDOM();
    populateClientsDropdown();
    renderProposals();
    checkQueryParameters();
}

function setupDOM() {
    // Open/Close Side Panel
    document.getElementById('create-proposal-btn')?.addEventListener('click', () => openSidePanel());
    document.getElementById('close-panel-btn')?.addEventListener('click', () => closeSidePanel());
    
    // Tab Filters
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.dataset.filter;
            renderProposals();
        });
    });

    // Search Input
    document.getElementById('search-proposals')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderProposals();
    });

    // Client Selection Toggle
    const clientSelect = document.getElementById('proposal-client-select');
    const customGroup = document.getElementById('custom-client-group');
    clientSelect?.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
            customGroup.style.display = 'block';
            document.getElementById('proposal-client-name').required = true;
            clearClientFields();
        } else {
            customGroup.style.display = 'none';
            document.getElementById('proposal-client-name').required = false;
            // Pre-fill from active clients list
            const matchedClient = clients.find(c => c.id === val);
            if (matchedClient) {
                document.getElementById('proposal-client-phone').value = matchedClient.phone || '';
                document.getElementById('proposal-client-gst').value = matchedClient.gst || '';
                document.getElementById('proposal-client-address').value = matchedClient.address || '';
            }
        }
    });

    // Add Deliverable Item Row
    document.getElementById('add-item-btn')?.addEventListener('click', () => addDeliverableRow());

    // Recalculations on dynamic item updates
    const itemsContainer = document.getElementById('items-container');
    itemsContainer?.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-rate') || e.target.classList.contains('item-qty')) {
            updateRowTotal(e.target.closest('.item-row'));
            calculateTotals();
        }
    });

    itemsContainer?.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row-btn')) {
            e.target.closest('.item-row').remove();
            calculateTotals();
        }
    });

    // Tax & Discount input updates
    document.getElementById('proposal-discount')?.addEventListener('input', calculateTotals);
    document.getElementById('proposal-tax-rate')?.addEventListener('input', calculateTotals);

    // AI Proposal Generation
    document.getElementById('ai-generate-btn')?.addEventListener('click', () => showAIModal());

    // Form Submit (Save / Update)
    document.getElementById('proposal-form')?.addEventListener('submit', handleFormSubmit);
}

function populateClientsDropdown() {
    const select = document.getElementById('proposal-client-select');
    if (!select) return;
    
    // Clear dynamic options (leave select client and custom client option)
    while (select.options.length > 2) {
        select.remove(2);
    }

    // Load clients
    clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
    clients.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

function openSidePanel(proposal = null) {
    const panel = document.getElementById('proposal-side-panel');
    const form = document.getElementById('proposal-form');
    const titleHeader = document.getElementById('panel-title');
    
    form.reset();
    document.getElementById('items-container').innerHTML = '';
    
    if (proposal) {
        // Edit Mode
        titleHeader.textContent = 'Edit Proposal';
        document.getElementById('proposal-id').value = proposal.id;
        document.getElementById('proposal-title').value = proposal.title;
        
        const clientSelect = document.getElementById('proposal-client-select');
        if (clients.some(c => c.id === proposal.clientId)) {
            clientSelect.value = proposal.clientId;
            document.getElementById('custom-client-group').style.display = 'none';
        } else {
            clientSelect.value = 'custom';
            document.getElementById('custom-client-group').style.display = 'block';
            document.getElementById('proposal-client-name').value = proposal.clientName || '';
        }
        
        document.getElementById('proposal-client-phone').value = proposal.clientPhone || '';
        document.getElementById('proposal-client-gst').value = proposal.clientGst || '';
        document.getElementById('proposal-client-address').value = proposal.clientAddress || '';
        document.getElementById('proposal-date').value = proposal.date;
        document.getElementById('proposal-valid').value = proposal.validUntil;
        document.getElementById('proposal-discount').value = proposal.discount || 0;
        document.getElementById('proposal-tax-rate').value = proposal.taxRate !== undefined ? proposal.taxRate : 18;
        document.getElementById('proposal-status').value = proposal.status || 'Draft';
        document.getElementById('proposal-template').value = proposal.template || 'Modern';
        document.getElementById('proposal-terms').value = proposal.terms || '';
        document.getElementById('proposal-notes').value = proposal.notes || '';
        
        // Add items
        if (proposal.items && proposal.items.length) {
            proposal.items.forEach(item => addDeliverableRow(item));
        } else {
            addDeliverableRow(); // Default blank row
        }
    } else {
        // Create Mode
        titleHeader.textContent = 'Create New Proposal';
        document.getElementById('proposal-id').value = '';
        document.getElementById('proposal-date').value = new Date().toISOString().split('T')[0];
        
        // Default expiry in 15 days
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 15);
        document.getElementById('proposal-valid').value = expDate.toISOString().split('T')[0];
        
        document.getElementById('custom-client-group').style.display = 'none';
        
        addDeliverableRow(); // Default blank row
    }
    
    calculateTotals();
    panel?.classList.add('open');
}

function closeSidePanel() {
    document.getElementById('proposal-side-panel')?.classList.remove('open');
}

function clearClientFields() {
    document.getElementById('proposal-client-name').value = '';
    document.getElementById('proposal-client-phone').value = '';
    document.getElementById('proposal-client-gst').value = '';
    document.getElementById('proposal-client-address').value = '';
}

function addDeliverableRow(item = null) {
    const container = document.getElementById('items-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <input type="text" class="item-desc" placeholder="Deliverable name / Description" style="flex: 2;" required>
        <input type="number" class="item-rate" placeholder="Rate" style="width: 110px;" min="0" value="0" required>
        <input type="number" class="item-qty" placeholder="Qty" style="width: 55px;" min="1" value="1" required>
        <span class="item-total" style="width: 90px; text-align: right; font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">₹0</span>
        <button type="button" class="remove-row-btn" title="Remove">&times;</button>
    `;

    container.appendChild(row);

    if (item) {
        row.querySelector('.item-desc').value = item.description || '';
        row.querySelector('.item-rate').value = item.rate || 0;
        row.querySelector('.item-qty').value = item.quantity || 1;
        updateRowTotal(row);
    }
}

function updateRowTotal(row) {
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const qty = parseFloat(row.querySelector('.item-qty').value) || 1;
    row.querySelector('.item-total').textContent = fmt.format(rate * qty);
}

function calculateTotals() {
    const container = document.getElementById('items-container');
    let subtotal = 0;
    
    container?.querySelectorAll('.item-row').forEach(row => {
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 1;
        subtotal += (rate * qty);
    });

    const discount = parseFloat(document.getElementById('proposal-discount').value) || 0;
    const taxRate = parseFloat(document.getElementById('proposal-tax-rate').value) || 0;

    let subtotalAfterDiscount = subtotal - discount;
    if (subtotalAfterDiscount < 0) subtotalAfterDiscount = 0;

    const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
    const grandTotal = subtotalAfterDiscount + taxAmount;

    document.getElementById('calc-subtotal').textContent = fmt.format(subtotal);
    document.getElementById('calc-total').textContent = fmt.format(grandTotal);
}

function renderProposals() {
    const tbody = document.getElementById('proposals-list');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Sort proposals: newest first
    proposals.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let filtered = proposals;
    if (activeFilter !== 'All') {
        filtered = filtered.filter(p => p.status === activeFilter);
    }
    
    if (searchQuery) {
        filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(searchQuery) || 
            p.clientName.toLowerCase().includes(searchQuery) ||
            p.id.toLowerCase().includes(searchQuery)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No proposals found.</td></tr>`;
        return;
    }

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        
        const shortId = p.id.slice(-6).toUpperCase();
        
        tr.innerHTML = `
            <td>
                <a href="proposal-detail.html?id=${p.id}" target="_blank" style="text-decoration:none; color:inherit;">
                    <strong>${p.title}</strong>
                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">#PR-${shortId}</div>
                </a>
            </td>
            <td>${p.clientName}</td>
            <td>${new Date(p.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
            <td>${p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '--'}</td>
            <td><strong>${fmt.format(p.totalAmount)}</strong></td>
            <td><span class="status-badge status-${p.status.toLowerCase()}">${p.status}</span></td>
            <td>
                <button class="action-btn view-btn" data-id="${p.id}">View</button>
                <button class="action-btn edit-btn" data-id="${p.id}">Edit</button>
                <button class="action-btn delete" data-id="${p.id}">Delete</button>
            </td>
        `;

        // Action Handlers
        tr.querySelector('.view-btn').addEventListener('click', () => {
            window.open(`proposal-detail.html?id=${p.id}`, '_blank');
        });
        
        tr.querySelector('.edit-btn').addEventListener('click', () => {
            openSidePanel(p);
        });

        tr.querySelector('.delete').addEventListener('click', async () => {
            const confirm = await window.customConfirm(`Are you sure you want to delete proposal "${p.title}"?`);
            if (confirm) {
                proposals = proposals.filter(x => x.id !== p.id);
                localStorage.setItem('agency365_proposals', JSON.stringify(proposals));
                renderProposals();
            }
        });

        tbody.appendChild(tr);
    });
}

function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('proposal-id').value;
    const title = document.getElementById('proposal-title').value;
    const clientSelect = document.getElementById('proposal-client-select');
    const clientId = clientSelect.value;
    
    let clientName = '';
    if (clientId === 'custom') {
        clientName = document.getElementById('proposal-client-name').value;
    } else {
        const c = clients.find(x => x.id === clientId);
        clientName = c ? c.name : 'Unknown Client';
    }

    const clientPhone = document.getElementById('proposal-client-phone').value;
    const clientGst = document.getElementById('proposal-client-gst').value;
    const clientAddress = document.getElementById('proposal-client-address').value;
    const date = document.getElementById('proposal-date').value;
    const validUntil = document.getElementById('proposal-valid').value;
    const discount = parseFloat(document.getElementById('proposal-discount').value) || 0;
    const taxRate = parseFloat(document.getElementById('proposal-tax-rate').value) || 0;
    const status = document.getElementById('proposal-status').value;
    const template = document.getElementById('proposal-template').value;
    const terms = document.getElementById('proposal-terms').value;
    const notes = document.getElementById('proposal-notes').value;

    // Compile items list
    const items = [];
    let subtotal = 0;
    const rows = document.getElementById('items-container').querySelectorAll('.item-row');
    rows.forEach(row => {
        const description = row.querySelector('.item-desc').value;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const quantity = parseFloat(row.querySelector('.item-qty').value) || 1;
        
        items.push({ description, rate, quantity });
        subtotal += (rate * quantity);
    });

    let subtotalAfterDiscount = subtotal - discount;
    if (subtotalAfterDiscount < 0) subtotalAfterDiscount = 0;
    const taxAmount = (subtotalAfterDiscount * taxRate) / 100;
    const totalAmount = subtotalAfterDiscount + taxAmount;

    const proposalData = {
        id: id || 'pr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        title,
        clientId,
        clientName,
        clientPhone,
        clientGst,
        clientAddress,
        date,
        validUntil,
        items,
        discount,
        taxRate,
        subtotal,
        totalAmount,
        status,
        template,
        terms,
        notes
    };

    if (id) {
        // Update existing
        const index = proposals.findIndex(p => p.id === id);
        if (index !== -1) {
            proposals[index] = proposalData;
        }
    } else {
        // Create new
        proposals.push(proposalData);
    }

    localStorage.setItem('agency365_proposals', JSON.stringify(proposals));
    closeSidePanel();
    renderProposals();
}

function checkQueryParameters() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    const createWithClient = params.get('createFor');
    
    if (editId) {
        const proposal = proposals.find(p => p.id === editId);
        if (proposal) {
            openSidePanel(proposal);
        }
    } else if (createWithClient) {
        openSidePanel();
        const clientSelect = document.getElementById('proposal-client-select');
        if (clientSelect) {
            clientSelect.value = createWithClient;
            // Trigger change event to load phone/address
            clientSelect.dispatchEvent(new Event('change'));
        }
    }
}

// Auto-run if script loaded independently
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('proposals.html')) {
            initProposals();
        }
    });
} else if (window.location.pathname.includes('proposals.html')) {
    initProposals();
}

function showAIModal() {
    const existing = document.getElementById('ai-modal-overlay');
    if (existing) { existing.remove(); return; }
    const overlay = document.createElement('div');
    overlay.id = 'ai-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;align-items:center;justify-content:center;padding:1rem;';
    overlay.innerHTML = `
      <div style="background:var(--card-bg);border-radius:16px;padding:2rem;max-width:480px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.25);">
        <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:1.25rem;color:var(--text-primary);">✨ AI Proposal Generator</h2>
        <div style="margin-bottom:1rem;">
          <label style="display:block;font-size:0.82rem;font-weight:600;margin-bottom:0.4rem;color:var(--text-primary);">Project Type *</label>
          <input id="ai-proj-type" type="text" placeholder="e.g. Website Redesign + SEO" style="width:100%;padding:0.7rem;border:1.5px solid var(--border-color);border-radius:8px;font-family:inherit;font-size:0.9rem;background:var(--bg-secondary);color:var(--text-primary);">
        </div>
        <div style="margin-bottom:1rem;">
          <label style="display:block;font-size:0.82rem;font-weight:600;margin-bottom:0.4rem;color:var(--text-primary);">Client Industry</label>
          <input id="ai-industry" type="text" placeholder="e.g. Automotive, E-commerce, Healthcare" style="width:100%;padding:0.7rem;border:1.5px solid var(--border-color);border-radius:8px;font-family:inherit;font-size:0.9rem;background:var(--bg-secondary);color:var(--text-primary);">
        </div>
        <div style="margin-bottom:1rem;">
          <label style="display:block;font-size:0.82rem;font-weight:600;margin-bottom:0.4rem;color:var(--text-primary);">Budget Range (₹)</label>
          <input id="ai-budget" type="text" placeholder="e.g. 50,000 - 1,00,000" style="width:100%;padding:0.7rem;border:1.5px solid var(--border-color);border-radius:8px;font-family:inherit;font-size:0.9rem;background:var(--bg-secondary);color:var(--text-primary);">
        </div>
        <div style="margin-bottom:1.5rem;">
          <label style="display:block;font-size:0.82rem;font-weight:600;margin-bottom:0.4rem;color:var(--text-primary);">Timeline</label>
          <select id="ai-timeline" style="width:100%;padding:0.7rem;border:1.5px solid var(--border-color);border-radius:8px;font-family:inherit;font-size:0.9rem;background:var(--bg-secondary);color:var(--text-primary);">
            <option value="1 month">1 Month</option>
            <option value="2 months">2 Months</option>
            <option value="3 months">3 Months</option>
            <option value="6 months">6 Months</option>
            <option value="12 months">12 Months</option>
          </select>
        </div>
        <div id="ai-error" style="color:#f04438;font-size:0.82rem;margin-bottom:0.75rem;display:none;"></div>
        <div style="display:flex;gap:0.75rem;">
          <button onclick="document.getElementById('ai-modal-overlay').remove()" style="flex:1;padding:0.7rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;cursor:pointer;font-family:inherit;font-weight:600;color:var(--text-primary);">Cancel</button>
          <button id="ai-gen-submit" style="flex:2;padding:0.7rem;background:linear-gradient(135deg,#6941c6,#9e77ed);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-family:inherit;" onclick="generateAIProposal()">✨ Generate Proposal</button>
        </div>
      </div>`;
    document.body.append(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

window.generateAIProposal = async function() {
    const projType = document.getElementById('ai-proj-type')?.value.trim();
    const industry = document.getElementById('ai-industry')?.value.trim();
    const budget = document.getElementById('ai-budget')?.value.trim();
    const timeline = document.getElementById('ai-timeline')?.value;
    const errEl = document.getElementById('ai-error');
    const btn = document.getElementById('ai-gen-submit');
    if (!projType) { errEl.textContent = 'Please enter a project type.'; errEl.style.display='block'; return; }
    errEl.style.display = 'none';
    btn.textContent = '⏳ Generating…'; btn.disabled = true;

    // Use Gemini 2.0 Flash API (using generic endpoint or fallback mock if key missing)
    const GEMINI_KEY = localStorage.getItem('agency365_gemini_key') || 'AIzaSyFakeKeyDemoHere';
    const promptText = `You are an expert agency proposal writer. Generate a detailed project proposal for the following:
Project: ${projType}
Industry: ${industry || 'General'}
Budget: ${budget || 'To be discussed'}
Timeline: ${timeline}

Respond with ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "title": "string - proposal title",
  "items": [
    {"description": "string - deliverable name and description", "rate": number, "quantity": number}
  ],
  "terms": "string - payment and project terms (2-3 sentences)",
  "notes": "string - additional notes or value proposition"
}

Include 4-5 realistic deliverable line items with Indian market rates in INR. Keep descriptions professional.`;

    try {
        let data;
        if (GEMINI_KEY && !GEMINI_KEY.startsWith('AIzaSyFake')) {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            });
            const json = await res.json();
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const clean = text.replace(/```json?/g,'').replace(/```/g,'').trim();
            data = JSON.parse(clean);
        } else {
            // Mock response if key is placeholder
            data = {
                title: `${projType} Proposal`,
                items: [
                    { description: 'Initial Strategy & Architecture Design', rate: 15000, quantity: 1 },
                    { description: 'Development & Implementation (Sprint 1 & 2)', rate: 25000, quantity: 2 },
                    { description: 'Quality Assurance & Automated Testing', rate: 12000, quantity: 1 },
                    { description: 'Deployment, Hosting Setup & Handover', rate: 10000, quantity: 1 }
                ],
                terms: '50% upfront payment, 50% upon successful project completion and sign-off. Support included for 30 days post-launch.',
                notes: `Customized proposal for client in the ${industry || 'general'} sector matching the estimated timeline of ${timeline}.`
            };
            await new Promise(r => setTimeout(r, 1200));
        }

        // Fill the side panel
        const titleEl = document.getElementById('proposal-title');
        const termsEl = document.getElementById('proposal-terms');
        const notesEl = document.getElementById('proposal-notes');
        if (titleEl) titleEl.value = data.title;
        if (termsEl) termsEl.value = data.terms;
        if (notesEl) notesEl.value = data.notes;
        
        // Clear existing items and add AI-generated ones
        const itemsContainer = document.getElementById('items-container');
        if (itemsContainer) {
            itemsContainer.innerHTML = '';
            data.items.forEach(item => addDeliverableRow(item));
            calculateTotals();
        }
        document.getElementById('ai-modal-overlay').remove();
    } catch(err) {
        console.error(err);
        errEl.textContent = 'AI generation failed. Please fill standard details manually.';
        errEl.style.display = 'block';
        btn.textContent = '✨ Generate Proposal'; btn.disabled = false;
    }
};
