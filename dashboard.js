let clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
let expenses = JSON.parse(localStorage.getItem('agency365_expenses')) || [];
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });

let activePeriod = 'yearly';

function getFYBounds(year) { return { start: new Date(year, 3, 1), end: new Date(year + 1, 2, 31, 23, 59, 59) }; }
function getCurrentFYYear() { const now = new Date(); return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; }

function getPeriodBounds(period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (period) {
        case 'daily': return { start: today, end: now, label: 'Today' };
        case 'weekly': { const s = new Date(today); s.setDate(s.getDate() - s.getDay()); return { start: s, end: now, label: 'This Week' }; }
        case 'monthly': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now, label: 'This Month' };
        case 'quarterly': { const q = Math.floor(now.getMonth() / 3); return { start: new Date(now.getFullYear(), q * 3, 1), end: now, label: 'This Quarter' }; }
        case 'yearly': { const fy = getCurrentFYYear(); return { start: getFYBounds(fy).start, end: getFYBounds(fy).end, label: `FY ${fy}-${(fy+1)%100}` }; }
        case 'all': return { start: new Date(2000, 0, 1), end: now, label: 'All Time' };
        default: return { start: new Date(2000, 0, 1), end: now, label: 'All Time' };
    }
}

function getPreviousPeriodBounds(period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (period) {
        case 'daily': { const s = new Date(today); s.setDate(s.getDate() - 1); return { start: s, end: today }; }
        case 'weekly': { const s = new Date(today); s.setDate(s.getDate() - 14); const e = new Date(today); e.setDate(e.getDate() - 7); return { start: s, end: e }; }
        case 'monthly': { const s = new Date(now.getFullYear(), now.getMonth() - 1, 1); const e = new Date(now.getFullYear(), now.getMonth(), 0); return { start: s, end: e }; }
        case 'quarterly': { const q = Math.floor(now.getMonth() / 3) - 1; return { start: new Date(now.getFullYear(), q * 3, 1), end: new Date(now.getFullYear(), (q + 1) * 3, 0) }; }
        case 'yearly': { const fy = getCurrentFYYear() - 1; return { start: getFYBounds(fy).start, end: getFYBounds(fy).end }; }
        default: return null;
    }
}

export function initDashboard() {
    // Reload local data fresh
    clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
    expenses = JSON.parse(localStorage.getItem('agency365_expenses')) || [];

    calculateCards();
    renderConnectList();
    initCharts();
    initPeriodFilter();
    renderTodaysFocus();
    renderDeadlines();
}

function initPeriodFilter() {
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activePeriod = e.target.dataset.period;
            
            calculateCards();
            
            // Re-render charts based on period
            let tf = 'year';
            if (activePeriod === 'daily' || activePeriod === 'weekly') tf = 'week';
            else if (activePeriod === 'monthly' || activePeriod === 'quarterly') tf = 'month';
            else if (activePeriod === 'all') tf = 'year';
            
            renderCharts(tf);
            renderConnectList();
        });
    });
}

function calculateCards() {
    const bounds = getPeriodBounds(activePeriod);
    let grossRev = 0;
    let clientExp = 0;
    clients.forEach(c => { 
        if (c.payments) c.payments.forEach(p => { const pd = new Date(p.date); if (pd >= bounds.start && pd <= bounds.end && !p.refund) grossRev += p.amount; }); 
        if (c.expenses) c.expenses.forEach(ex => { const ed = ex.date ? new Date(ex.date) : new Date(); if (ed >= bounds.start && ed <= bounds.end) clientExp += ex.amount; });
    });
    const rev = grossRev - clientExp;
    let exp = 0;
    expenses.forEach(e => { const ed = new Date(e.date); if (ed >= bounds.start && ed <= bounds.end) exp += e.amount; });
    const profit = rev - exp;

    // Set standard stat cards
    document.getElementById('dash-revenue').textContent = fmt.format(rev);
    document.getElementById('dash-expenses').textContent = fmt.format(exp);
    document.getElementById('dash-profit').textContent = fmt.format(profit);
    document.getElementById('dash-rev-sub').textContent = bounds.label;
    document.getElementById('dash-exp-sub').textContent = bounds.label;
    document.getElementById('dash-profit-sub').textContent = `${fmt.format(rev)} rev − ${fmt.format(exp)} exp`;

    // Set large balance
    const balEl = document.getElementById('dash-balance-large');
    if (balEl) balEl.textContent = fmt.format(profit);
    
    // Calculate percentage change compared to previous period
    const prevBounds = getPreviousPeriodBounds(activePeriod);
    let prevProfit = 0;
    if (prevBounds) {
        let prevGrossRev = 0;
        let prevClientExp = 0;
        clients.forEach(c => { 
            if (c.payments) c.payments.forEach(p => { const pd = new Date(p.date); if (pd >= prevBounds.start && pd <= prevBounds.end && !p.refund) prevGrossRev += p.amount; }); 
            if (c.expenses) c.expenses.forEach(ex => { const ed = ex.date ? new Date(ex.date) : new Date(); if (ed >= prevBounds.start && ed <= prevBounds.end) prevClientExp += ex.amount; });
        });
        const prevRev = prevGrossRev - prevClientExp;
        let prevExp = 0;
        expenses.forEach(e => { const ed = new Date(e.date); if (ed >= prevBounds.start && ed <= prevBounds.end) prevExp += e.amount; });
        prevProfit = prevRev - prevExp;
    }
    
    let changePct = 3.4; // fallback mockup default
    if (prevBounds && prevProfit > 0) {
        changePct = ((profit - prevProfit) / prevProfit) * 100;
    } else if (profit > 0) {
        changePct = 100.0;
    }
    
    const changeValEl = document.getElementById('dash-change-val');
    const changeBadgeEl = document.getElementById('dash-balance-change');
    if (changeValEl && changeBadgeEl) {
        const sign = changePct >= 0 ? '+' : '';
        changeValEl.textContent = `${sign}${changePct.toFixed(1)}%`;
        if (changePct >= 0) {
            changeBadgeEl.className = 'change-badge badge-green';
            changeBadgeEl.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right: 2px;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> <span id="dash-change-val">${sign}${changePct.toFixed(1)}%</span>`;
        } else {
            changeBadgeEl.className = 'change-badge';
            changeBadgeEl.style.background = 'rgba(240, 68, 56, 0.1)';
            changeBadgeEl.style.color = '#f04438';
            changeBadgeEl.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right: 2px;"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg> <span id="dash-change-val">${changePct.toFixed(1)}%</span>`;
        }
    }
}

function renderTodaysFocus() {
    const dateEl = document.getElementById('focus-date');
    const container = document.getElementById('focus-items');
    const emptyEl = document.getElementById('focus-empty');
    if (!container) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayFmt = today.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' });
    if (dateEl) dateEl.textContent = todayFmt;

    const clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
    const items = [];

    clients.forEach(client => {
        // Meetings today
        (client.meetings || []).filter(m => m.date === todayStr && m.status === 'scheduled').forEach(m => {
            items.push({ icon:'📅', label:`Meeting: <strong>${m.title}</strong>`, sub:`${client.name} at ${m.time || 'TBD'}`, href:`client-detail.html?id=${client.id}&tab=meetings`, color:'#12b76a' });
        });
        // Tasks due today
        (client.tasks || []).filter(t => !t.done && t.dueDate === todayStr).forEach(t => {
            items.push({ icon:'✅', label:`Task due: <strong>${t.text}</strong>`, sub:client.name, href:`client-detail.html?id=${client.id}&tab=overview`, color:'#f79009' });
        });
        // Overdue invoices (payment due but amount outstanding)
        if ((client.status === 'Active' || client.status === 'Closed') && client.amount) {
            const paid = (client.payments || []).filter(p=>!p.refund).reduce((s,p)=>s+p.amount,0);
            const due = client.amount - paid;
            if (due > 0) {
                const daysSince = client.date ? Math.floor((today - new Date(client.date)) / 86400000) : 0;
                if (daysSince > 30) {
                    items.push({ icon:'💳', label:`Payment overdue: <strong>₹${due.toLocaleString('en-IN')}</strong>`, sub:client.name, href:`client-detail.html?id=${client.id}&tab=finance`, color:'#f04438' });
                }
            }
        }
        // Follow-ups (clients with no communication in 7 days)
        const comms = client.communications || [];
        if (comms.length > 0 && client.status === 'Active') {
            const lastComm = new Date(Math.max(...comms.map(c => new Date(c.date))));
            const daysSince = Math.floor((today - lastComm) / 86400000);
            if (daysSince >= 7) {
                items.push({ icon:'💬', label:`Follow up with <strong>${client.name}</strong>`, sub:`Last contact ${daysSince} days ago`, href:`client-detail.html?id=${client.id}&tab=communication`, color:'#6941c6' });
            }
        }
    });

    if (items.length === 0) {
        emptyEl.style.display = 'block';
        return;
    }
    container.innerHTML = items.slice(0, 8).map(item => `
        <a href="${item.href}" style="display:flex;align-items:flex-start;gap:0.85rem;padding:0.65rem 0.75rem;border-radius:8px;text-decoration:none;background:var(--bg-secondary);transition:background 0.15s;border-left:3px solid ${item.color};">
          <span style="font-size:1.1rem;flex-shrink:0;">${item.icon}</span>
          <div>
            <div style="font-size:0.85rem;color:var(--text-primary);">${item.label}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.1rem;">${item.sub}</div>
          </div>
        </a>`).join('');
}

function renderDeadlines() {
    const container = document.getElementById('deadline-items');
    if (!container) return;
    const clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
    const today = new Date(); today.setHours(0,0,0,0);
    const withDeadlines = clients
        .filter(c => c.deadline && c.status === 'Active')
        .map(c => { const d = new Date(c.deadline); const days = Math.ceil((d-today)/86400000); return {...c, daysLeft:days}; })
        .sort((a,b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);
    if (withDeadlines.length === 0) { container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.82rem;">No deadlines set. Add deadlines when creating clients.</p>'; return; }
    container.innerHTML = withDeadlines.map(c => {
        const color = c.daysLeft < 0 ? '#f04438' : c.daysLeft <= 7 ? '#f79009' : '#12b76a';
        const label = c.daysLeft < 0 ? `${Math.abs(c.daysLeft)}d overdue` : c.daysLeft === 0 ? 'Due TODAY' : `${c.daysLeft}d left`;
        return `<a href="client-detail.html?id=${c.id}" style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.75rem;border-radius:8px;text-decoration:none;margin-bottom:0.4rem;background:var(--bg-secondary);">
          <span style="font-size:0.85rem;color:var(--text-primary);font-weight:500;">${c.name}</span>
          <span style="font-size:0.78rem;background:${color}18;color:${color};padding:0.2rem 0.6rem;border-radius:12px;font-weight:700;">${label}</span>
        </a>`;
    }).join('');
}

function renderConnectList() {
    const el = document.getElementById('connect-client-list'); 
    if (!el) return;
    
    // Filter clients based on activity in the active period
    const bounds = getPeriodBounds(activePeriod);
    const activeClients = [];
    
    clients.forEach(c => {
        let hasActivity = false;
        if (c.payments) c.payments.forEach(p => { const pd = new Date(p.date); if (pd >= bounds.start && pd <= bounds.end) hasActivity = true; });
        if (c.expenses) c.expenses.forEach(ex => { const ed = ex.date ? new Date(ex.date) : new Date(); if (ed >= bounds.start && ed <= bounds.end) hasActivity = true; });
        if (c.meetings) c.meetings.forEach(m => { const md = new Date(m.date); if (md >= bounds.start && md <= bounds.end) hasActivity = true; });
        if (hasActivity || activePeriod === 'all' || activePeriod === 'yearly') {
            activeClients.push(c);
        }
    });
    
    // Get top 3
    const top = activeClients.slice(0, 3);
    const slug = n => encodeURIComponent(n.toLowerCase().replace(/\s+/g, '-'));
    
    if (!top.length) {
        el.innerHTML = '<span style="color:var(--text-secondary); font-size:0.85rem;">No active clients in this period</span>';
        return;
    }
    
    el.innerHTML = top.map((c, i) => {
        const badgeClass = c.status === 'Active' ? 'badge-senior' : (c.status === 'Lead' ? 'badge-middle' : 'badge-junior');
        const badgeLabel = c.status === 'Active' ? 'Client' : (c.status === 'Lead' ? 'Lead' : 'Past');
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=${i%2===0?'7c3aed':'3b82f6'}&color=fff`;
        
        return `<div class="connect-item">
            <img src="${avatarUrl}" class="connect-avatar">
            <div class="connect-info">
                <div style="display:flex; align-items:center;">
                    <a href="client-detail.html?id=${c.id}&slug=${slug(c.name)}" class="connect-name" style="text-decoration:none;">${c.name}</a>
                    <span class="connect-badge ${badgeClass}">${badgeLabel}</span>
                </div>
                <span class="connect-role">${c.email || 'No email provided'}</span>
            </div>
            <a href="client-detail.html?id=${c.id}&slug=${slug(c.name)}" class="connect-add-btn" style="text-decoration:none;">+</a>
        </div>`;
    }).join('');
}

let balanceChart = null;
let cashflowChart = null;

function initCharts() {
    renderCharts('year');
    
    document.getElementById('chart-custom-apply')?.addEventListener('click', () => {
        renderCharts('custom');
    });
}

function getCashflowData(tf) {
    let labels = [];
    let cashIn = [];
    let cashOut = [];
    const today = new Date();
    const fDate = d => d.toISOString().split('T')[0];
    
    if (tf === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
            const dStr = fDate(d);
            
            // Cash In
            let cin = 0;
            clients.forEach(c => {
                if (c.payments) c.payments.forEach(p => { if (p.date === dStr && !p.refund) cin += p.amount; });
            });
            cashIn.push(cin);
            
            // Cash Out
            let cout = 0;
            clients.forEach(c => {
                if (c.expenses) c.expenses.forEach(ex => {
                    const ed = ex.date ? new Date(ex.date) : new Date();
                    if (fDate(ed) === dStr) cout += ex.amount;
                });
            });
            expenses.forEach(e => {
                if (e.date === dStr) cout += e.amount;
            });
            cashOut.push(cout);
        }
    }
    else if (tf === 'month') {
        const y = today.getFullYear(), m = today.getMonth();
        const days = new Date(y, m + 1, 0).getDate();
        for (let i = 1; i <= days; i++) {
            labels.push(i.toString());
            const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            // Cash In
            let cin = 0;
            clients.forEach(c => {
                if (c.payments) c.payments.forEach(p => { if (p.date === dStr && !p.refund) cin += p.amount; });
            });
            cashIn.push(cin);
            
            // Cash Out
            let cout = 0;
            clients.forEach(c => {
                if (c.expenses) c.expenses.forEach(ex => {
                    const ed = ex.date ? new Date(ex.date) : new Date();
                    if (fDate(ed) === dStr) cout += ex.amount;
                });
            });
            expenses.forEach(e => {
                if (e.date === dStr) cout += e.amount;
            });
            cashOut.push(cout);
        }
    }
    else if (tf === 'custom') {
        const s = new Date(document.getElementById('chart-start').value);
        const e = new Date(document.getElementById('chart-end').value);
        if (!isNaN(s) && !isNaN(e) && s <= e) {
            let curr = new Date(s);
            while (curr <= e) {
                const dStr = fDate(curr);
                labels.push(curr.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                
                // Cash In
                let cin = 0;
                clients.forEach(c => {
                    if (c.payments) c.payments.forEach(p => { if (p.date === dStr && !p.refund) cin += p.amount; });
                });
                cashIn.push(cin);
                
                // Cash Out
                let cout = 0;
                clients.forEach(c => {
                    if (c.expenses) c.expenses.forEach(ex => {
                        const ed = ex.date ? new Date(ex.date) : new Date();
                        if (fDate(ed) === dStr) cout += ex.amount;
                    });
                });
                expenses.forEach(e => {
                    if (e.date === dStr) cout += e.amount;
                });
                cashOut.push(cout);
                
                curr.setDate(curr.getDate() + 1);
            }
        }
    }
    else {
        // Fiscal Year (Apr to Mar)
        labels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
        cashIn = new Array(12).fill(0);
        cashOut = new Array(12).fill(0);
        const fy = getCurrentFYYear();
        
        clients.forEach(c => {
            if (c.payments) c.payments.forEach(p => {
                const pd = new Date(p.date);
                const bounds = getFYBounds(fy);
                if (pd >= bounds.start && pd <= bounds.end && !p.refund) {
                    const m = pd.getMonth();
                    const idx = m >= 3 ? m - 3 : m + 9;
                    cashIn[idx] += p.amount;
                }
            });
            if (c.expenses) c.expenses.forEach(ex => {
                const ed = ex.date ? new Date(ex.date) : new Date();
                const bounds = getFYBounds(fy);
                if (ed >= bounds.start && ed <= bounds.end) {
                    const m = ed.getMonth();
                    const idx = m >= 3 ? m - 3 : m + 9;
                    cashOut[idx] += ex.amount;
                }
            });
        });
        expenses.forEach(e => {
            const ed = new Date(e.date);
            const bounds = getFYBounds(fy);
            if (ed >= bounds.start && ed <= bounds.end) {
                const m = ed.getMonth();
                const idx = m >= 3 ? m - 3 : m + 9;
                cashOut[idx] += e.amount;
            }
        });
    }
    
    return { labels, cashIn, cashOut };
}

function renderCharts(tf) {
    const { labels, cashIn, cashOut } = getCashflowData(tf);
    if (!labels.length) return;

    // Calculate running balance starting from the net balance before the period bounds
    const bounds = getPeriodBounds(activePeriod);
    if (tf === 'custom') {
        const s = new Date(document.getElementById('chart-start').value);
        if (!isNaN(s)) bounds.start = s;
    }

    let startBalance = 0;
    clients.forEach(c => {
        if (c.payments) c.payments.forEach(p => {
            const pd = new Date(p.date);
            if (pd < bounds.start && !p.refund) startBalance += p.amount;
        });
        if (c.expenses) c.expenses.forEach(ex => {
            const ed = ex.date ? new Date(ex.date) : new Date();
            if (ed < bounds.start) startBalance -= ex.amount;
        });
    });
    expenses.forEach(e => {
        const ed = new Date(e.date);
        if (ed < bounds.start) startBalance -= e.amount;
    });

    let currentBalance = startBalance;
    const balanceData = [];
    for (let i = 0; i < labels.length; i++) {
        currentBalance += (cashIn[i] - cashOut[i]);
        balanceData.push(currentBalance);
    }

    // Set chart header total to final running balance
    const chartBalanceTotalEl = document.getElementById('chart-balance-total');
    if (chartBalanceTotalEl) {
        chartBalanceTotalEl.textContent = fmt.format(currentBalance);
    }

    // 1. Render Balance Line Chart
    const ctx1 = document.getElementById('balance-line-chart');
    if (ctx1) {
        if (balanceChart) balanceChart.destroy();
        
        const ctx2d = ctx1.getContext('2d');
        const gradient = ctx2d.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
        
        balanceChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Running Balance (₹)',
                    data: balanceData,
                    borderColor: '#2563eb',
                    borderWidth: 2.5,
                    tension: 0,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    fill: true,
                    backgroundColor: gradient
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(0, 0, 0, 0.02)', drawBorder: false },
                        ticks: { font: { family: 'Inter', size: 10 } }
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { font: { family: 'Inter', size: 10 } }
                    }
                }
            }
        });
    }

    // Render Custom Income Tracker (Twisty Style)
    renderIncomeTracker(tf, labels, cashIn);
}

function renderIncomeTracker(tf, labels, cashIn) {
    const container = document.getElementById('custom-income-graph');
    if (!container) return;
    
    // Update labels and percentage
    document.getElementById('income-tracker-period').textContent = tf.charAt(0).toUpperCase() + tf.slice(1);
    
    // We want maximum 7 columns for the Twisty look. If we have more data, we'll chunk it or take the last 7
    let displayLabels = labels;
    let displayData = cashIn;
    
    if (labels.length > 7) {
        displayLabels = labels.slice(-7);
        displayData = cashIn.slice(-7);
    }
    
    // Calculate percentage change (current period total vs previous period total)
    // For simplicity of this UI component, we'll calculate change between first half and second half of displayed data
    const mid = Math.floor(displayData.length / 2);
    const prevSum = displayData.slice(0, mid).reduce((a, b) => a + b, 0);
    const currSum = displayData.slice(mid).reduce((a, b) => a + b, 0);
    
    let pct = "+0%";
    let pctColor = "var(--text-primary)";
    if (prevSum > 0) {
        const change = ((currSum - prevSum) / prevSum) * 100;
        pct = `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
        if (change < 0) pctColor = "#f04438"; // red if negative
    } else if (currSum > 0) {
        pct = "+100%";
    }
    
    const pctEl = document.getElementById('income-tracker-percent');
    pctEl.textContent = pct;
    pctEl.style.color = pctColor;
    
    // Find max value to determine bar height percentages
    const maxVal = Math.max(...displayData, 1000); // minimum scale
    
    const html = displayLabels.map((lbl, i) => {
        const val = displayData[i];
        // Height between 10% and 90%
        const hPct = Math.max(10, (val / maxVal) * 90);
        const shortLbl = lbl.length > 3 ? lbl.substring(0,3) : lbl;
        const initial = shortLbl.charAt(0).toUpperCase();
        
        return `<div class="graph-col" title="${lbl}: ₹${val.toLocaleString()}">
            <div class="graph-line" style="height: ${hPct}%">
                <div class="graph-dot"></div>
            </div>
            <div class="graph-label">${initial}</div>
        </div>`;
    }).join('');
    
    container.innerHTML = html;
}
