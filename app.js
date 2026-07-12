import { initCRM } from './crm.js?v=20260605';
import { initCalendar } from './calendar.js?v=20260605';
import { initDashboard } from './dashboard.js?v=20260615';
import { initProposals } from './proposals.js?v=20260615';
import { supabase, syncFromSupabase, signIn, signUp, signOut, getNotifications, markNotificationRead, isSyncing } from './supabaseClient.js';

const USERS_KEY = 'agency365_users';

// ── Brand Settings ────────────────────────────────────────────
export function applyBrandSettings() {
    const logoHeight = localStorage.getItem('agency365_logo_height') || '30';
    document.documentElement.style.setProperty('--logo-height', logoHeight + 'px');

    const brandContainer = document.querySelector('.sidebar-brand');
    const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('agency365_theme') || 'light';
    const savedLogoLight = localStorage.getItem('agency365_brand_logo_light');
    const savedLogoDark = localStorage.getItem('agency365_brand_logo_dark');
    const oldSavedLogo = localStorage.getItem('agency365_brand_logo');
    
    let activeLogo = null;
    if (currentTheme === 'dark' && savedLogoDark) {
        activeLogo = savedLogoDark;
    } else if (currentTheme === 'light' && savedLogoLight) {
        activeLogo = savedLogoLight;
    } else if (savedLogoLight) {
        activeLogo = savedLogoLight;
    } else if (savedLogoDark) {
        activeLogo = savedLogoDark;
    } else if (oldSavedLogo) {
        activeLogo = oldSavedLogo;
    }

    let orgName = 'Agency 365';
    try {
        const user = JSON.parse(sessionStorage.getItem('agency365_current_user'));
        if (user?.orgName) orgName = user.orgName;
    } catch(e) {}
    
    if (brandContainer) {
        if (activeLogo) {
            brandContainer.innerHTML = `<a href="dashboard.html" style="display:flex; align-items:center; text-decoration:none;"><img src="${activeLogo}" alt="Agency Logo" style="max-height: var(--logo-height); width: auto; object-fit: contain;"></a>`;
        } else {
            brandContainer.innerHTML = `<a href="dashboard.html" style="display:flex; align-items:center; text-decoration:none;"><h2 class="serif-font" style="margin:0; font-size:1.4rem;font-weight:700;color:var(--text-primary);letter-spacing:-0.03em;">agency<span style="color:var(--accent-color)">365</span></h2></a>`;
        }
    }
}
applyBrandSettings();

// ── Custom Dialogs ────────────────────────────────────────────
window.customConfirm = function(message) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const box = document.createElement('div');
        box.style.cssText = 'background:var(--card-bg,#fff);padding:2rem;border-radius:12px;max-width:400px;width:90%;box-shadow:0 10px 25px rgba(0,0,0,0.2);';
        const text = document.createElement('p');
        text.style.cssText = 'margin-bottom:1.5rem;font-size:1rem;color:var(--text-primary,#333);line-height:1.5;';
        text.textContent = message;
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:1rem;';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel'; cancelBtn.className = 'secondary-btn';
        const okBtn = document.createElement('button');
        okBtn.textContent = 'Yes, Continue'; okBtn.className = 'primary-btn';
        cancelBtn.onclick = () => { document.body.removeChild(overlay); resolve(false); };
        okBtn.onclick    = () => { document.body.removeChild(overlay); resolve(true); };
        btnRow.append(cancelBtn, okBtn); box.append(text, btnRow); overlay.append(box); document.body.append(overlay);
    });
};

window.customPrompt = function(message, defaultValue) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const box = document.createElement('div');
        box.style.cssText = 'background:var(--card-bg,#fff);padding:2rem;border-radius:12px;max-width:400px;width:90%;box-shadow:0 10px 25px rgba(0,0,0,0.2);';
        const text = document.createElement('p');
        text.style.cssText = 'margin-bottom:1rem;font-size:0.95rem;font-weight:600;color:var(--text-primary,#333);';
        text.textContent = message;
        const input = document.createElement('input');
        input.type = 'text'; input.value = defaultValue || '';
        input.style.cssText = 'width:100%;padding:0.65rem;border:1px solid var(--border-color,#ccc);border-radius:6px;margin-bottom:1.5rem;background:var(--bg-secondary,#f9f9f9);color:var(--text-primary,#333);font-size:0.95rem;box-sizing:border-box;';
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:1rem;';
        const cancelBtn = document.createElement('button'); cancelBtn.textContent = 'Cancel'; cancelBtn.className = 'secondary-btn';
        const okBtn     = document.createElement('button'); okBtn.textContent = 'Save';   okBtn.className = 'primary-btn';
        cancelBtn.onclick = () => { document.body.removeChild(overlay); resolve(null); };
        okBtn.onclick     = () => { document.body.removeChild(overlay); resolve(input.value); };
        input.addEventListener('keypress', e => { if (e.key === 'Enter') okBtn.click(); });
        btnRow.append(cancelBtn, okBtn); box.append(text, input, btnRow); overlay.append(box); document.body.append(overlay);
        input.focus();
    });
};

// ── Keyboard Shortcuts ────────────────────────────────────────
function initKeyboardShortcuts() {
    const path = window.location.pathname;
    document.addEventListener('keydown', e => {
        const tag = document.activeElement?.tagName;
        if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;

        switch(e.key) {
            case '/':
                e.preventDefault();
                const searchBar = document.querySelector('input[type="search"], .search-input, #client-search, #proposal-search');
                if (searchBar) { searchBar.focus(); searchBar.select(); }
                break;
            case 'Escape':
                document.querySelectorAll('.modal-overlay.show, .side-panel.open').forEach(el => {
                    el.classList.remove('show', 'open');
                });
                break;
            case 'n': case 'N':
                if (path.includes('clients.html')) {
                    document.getElementById('add-client-header-btn')?.click();
                } else if (path.includes('proposals.html')) {
                    document.getElementById('new-proposal-btn')?.click();
                } else if (path.includes('crm.html')) {
                    document.getElementById('add-lead-btn')?.click();
                }
                break;
            case 'm': case 'M':
                if (path.includes('client-detail.html')) {
                    document.querySelector('.client-tab[data-tab="meetings"]')?.click();
                    setTimeout(() => document.getElementById('add-meeting-btn')?.click(), 50);
                }
                break;
            case '?':
                showShortcutHelp();
                break;
        }
    });
}

function showShortcutHelp() {
    const existing = document.getElementById('shortcut-help-overlay');
    if (existing) { existing.remove(); return; }
    const overlay = document.createElement('div');
    overlay.id = 'shortcut-help-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `
      <div style="background:var(--card-bg);border-radius:16px;padding:2rem;max-width:420px;width:90%;box-shadow:0 20px 40px rgba(0,0,0,0.25);">
        <h2 style="margin:0 0 1.25rem;font-size:1.1rem;font-weight:700;">⌨️ Keyboard Shortcuts</h2>
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:0.6rem 1.25rem;font-size:0.88rem;">
          <kbd style="background:var(--bg-secondary);padding:0.2rem 0.5rem;border-radius:5px;font-family:monospace;">/</kbd><span>Focus search bar</span>
          <kbd style="background:var(--bg-secondary);padding:0.2rem 0.5rem;border-radius:5px;font-family:monospace;">N</kbd><span>New client / lead / proposal</span>
          <kbd style="background:var(--bg-secondary);padding:0.2rem 0.5rem;border-radius:5px;font-family:monospace;">M</kbd><span>Add meeting (client detail)</span>
          <kbd style="background:var(--bg-secondary);padding:0.2rem 0.5rem;border-radius:5px;font-family:monospace;">ESC</kbd><span>Close any open modal</span>
          <kbd style="background:var(--bg-secondary);padding:0.2rem 0.5rem;border-radius:5px;font-family:monospace;">?</kbd><span>Show / hide this help</span>
        </div>
        <button onclick="this.closest('#shortcut-help-overlay').remove()" style="margin-top:1.5rem;width:100%;padding:0.65rem;background:var(--accent-color);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Got it</button>
      </div>`;
    document.body.append(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Notifications Bell ────────────────────────────────────────
async function initNotificationBell() {
    const bell = document.getElementById('notification-bell');
    if (!bell) return;
    const notes = await getNotifications(20);
    const unread = notes.filter(n => !n.read).length;
    const badge = bell.querySelector('.notif-badge');
    if (badge) badge.textContent = unread > 0 ? unread : '';
    if (badge) badge.style.display = unread > 0 ? 'block' : 'none';

    bell.addEventListener('click', async () => {
        const existing = document.getElementById('notif-dropdown');
        if (existing) { existing.remove(); return; }
        const dd = document.createElement('div');
        dd.id = 'notif-dropdown';
        dd.style.cssText = 'position:absolute;top:100%;right:0;background:var(--card-bg);border:1px solid var(--border-color);border-radius:12px;min-width:300px;max-height:360px;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.15);z-index:9990;padding:0.5rem;';
        if (notes.length === 0) {
            dd.innerHTML = '<p style="padding:1rem;color:var(--text-secondary);font-size:0.85rem;text-align:center;">No notifications yet</p>';
        } else {
            dd.innerHTML = notes.map(n => `
              <div class="notif-item" data-id="${n.id}" style="padding:0.75rem 1rem;border-radius:8px;cursor:pointer;transition:background 0.15s;${n.read?'opacity:0.5':''}">
                <div style="font-size:0.83rem;font-weight:600;color:var(--text-primary)">${n.message}</div>
                <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:0.2rem">${new Date(n.created_at).toLocaleString('en-IN')}</div>
              </div>`).join('');
            dd.querySelectorAll('.notif-item').forEach(item => {
                item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-secondary)');
                item.addEventListener('mouseleave', () => item.style.background = '');
                item.addEventListener('click', () => markNotificationRead(item.dataset.id));
            });
        }
        bell.style.position = 'relative'; bell.append(dd);
        setTimeout(() => document.addEventListener('click', () => dd.remove(), { once: true }), 100);
    });
}

// ── Theme Toggle ──────────────────────────────────────────────
function initTheme() {
    const savedTheme = localStorage.getItem('agency365_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.querySelectorAll('#theme-toggle-btn, #mob-theme-toggle').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('agency365_theme', newTheme);
            applyBrandSettings();
            // Update mob toggle icon
            document.querySelectorAll('#mob-theme-toggle .mob-theme-icon').forEach(ic => ic.classList.toggle('hidden'));
        });
    });
}

// ── App Init ──────────────────────────────────────────────────
async function initApp() {
    document.body.classList.remove('preload');
    
    // Migrate Closed to Inactive
    let clients = JSON.parse(localStorage.getItem('agency365_clients'));
    if (clients && clients.length > 0) {
        let changed = false;
        clients.forEach(c => {
            if (c.status === 'Closed') {
                c.status = 'Inactive';
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('agency365_clients', JSON.stringify(clients));
        }
    }

    initTheme();
    
    const hasData = localStorage.getItem('agency365_clients') !== null || localStorage.getItem('agency365_proposals') !== null;
    if (!hasData && sessionStorage.getItem('agency365_unlocked')) {
        await syncFromSupabase();
    }

    checkAuthAndInit();
    initKeyboardShortcuts();
    initNotificationBell();
    initPullToRefresh();
    
    if (hasData && sessionStorage.getItem('agency365_unlocked')) {
        syncFromSupabase();
    }
}

function initPullToRefresh() {
    let startY = 0;
    document.addEventListener('touchstart', e => {
        if (window.scrollY === 0) startY = e.touches[0].pageY;
    }, { passive: true });
    
    document.addEventListener('touchmove', e => {
        const y = e.touches[0].pageY;
        if (window.scrollY === 0 && y - startY > 150) {
            startY = y;
            const pullEl = document.createElement('div');
            pullEl.style.cssText = 'position:fixed;top:15px;left:50%;transform:translateX(-50%);background:var(--accent-color);color:#fff;border-radius:20px;padding:0.4rem 1.1rem;font-size:0.8rem;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.15);font-weight:600;display:flex;align-items:center;gap:0.4rem;pointer-events:none;';
            pullEl.innerHTML = '🔄 Refreshing…';
            document.body.append(pullEl);
            // Wait for any active syncs to finish before reloading safely
            const tryReload = () => {
                if (isSyncing()) setTimeout(tryReload, 100);
                else window.location.reload();
            };
            setTimeout(tryReload, 600);
        }
    }, { passive: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ── Auth Guard + Routing ──────────────────────────────────────
function checkAuthAndInit() {
    const isUnlocked = sessionStorage.getItem('agency365_unlocked');
    const path = window.location.pathname;
    const isPublicPage = ['index.html','login.html','signup.html','proposal-detail.html','onboarding.html','portal.html']
        .some(p => path.endsWith(p)) || path.endsWith('/');

    if (!isUnlocked && !isPublicPage) {
        window.location.href = 'login.html';
        return;
    }
    if (isPublicPage) {
        if (isUnlocked && (path.endsWith('login.html') || path.endsWith('signup.html'))) {
            const role = localStorage.getItem('agency365_mock_role') || 'Admin';
            window.location.href = role === 'Employee' ? 'clients.html' : 'dashboard.html';
            return;
        }
        if (path.endsWith('login.html'))  initLogin();
        if (path.endsWith('signup.html')) initSignup();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            initDataManagement();
            initNavigationHighlighting();
            initTheme();
            const path = window.location.pathname;

            if (path.includes('clients.html'))         initClients();
            else if (path.includes('crm.html'))        initCRM();
            else if (path.includes('finance.html'))    initFinance();
            else if (path.includes('calendar.html'))   initCalendar();
            else if (path.includes('dashboard.html'))  initDashboard();
            else if (path.includes('proposals.html'))  initProposals();
            
            // Global listener for background Supabase sync completion
            window.addEventListener('agency365_synced', () => {
                initNavigationHighlighting();
                if (path.includes('clients.html'))         initClients();
                else if (path.includes('crm.html'))        initCRM();
                else if (path.includes('finance.html'))    initFinance();
                else if (path.includes('calendar.html'))   initCalendar();
                else if (path.includes('dashboard.html'))  initDashboard();
                else if (path.includes('proposals.html'))  initProposals();
            });
        });
    }
}

function initNavigationHighlighting() {
    applyRBAC();
    const path = window.location.pathname;
    document.querySelectorAll('.icon-links a, .menu-links a').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && path.includes(href)) link.classList.add('active');
    });
    try {
        const clients   = JSON.parse(localStorage.getItem('agency365_clients'))   || [];
        const proposals = JSON.parse(localStorage.getItem('agency365_proposals')) || [];
        const activeClients = clients.filter(c => c.status && c.status.toLowerCase() !== 'lead' && c.status.toLowerCase() !== 'inactive');
        
        const cBadge = document.getElementById('badge-clients-count');
        const pBadge = document.getElementById('badge-proposals-count');
        
        if (cBadge) cBadge.textContent = activeClients.length;
        if (pBadge) pBadge.textContent = proposals.length;
    } catch(e) {}
    try {
        const user  = JSON.parse(sessionStorage.getItem('agency365_current_user')) || {};
        const nameEl  = document.getElementById('menu-user-name');
        const emailEl = document.getElementById('menu-user-email');
        const userName = user.name || user.orgName || 'Admin';
        if (nameEl)  nameEl.textContent  = userName;
        if (emailEl) emailEl.textContent = user.email || '';

        const savedProfilePic = localStorage.getItem('agency365_profile_pic');
        const avatars = document.querySelectorAll('.menu-user-avatar');
        avatars.forEach(img => {
            img.src = savedProfilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=12b76a&color=fff`;
        });
    } catch(e) {}
}

// ── Dashboard ──────────────────────────────────────────────────
function initDashboard() {
    const custBtn = document.getElementById('dashboard-customize-btn');
    if (custBtn) {
        // Remove old listeners by replacing node
        const newCustBtn = custBtn.cloneNode(true);
        custBtn.parentNode.replaceChild(newCustBtn, custBtn);
        newCustBtn.addEventListener('click', () => {
            alert('Dashboard Customization coming soon! You will be able to add custom widgets here.');
        });
    }
}

// ── Login ─────────────────────────────────────────────────────
function initLogin() {
    const form     = document.getElementById('login-form');
    const errorMsg = document.getElementById('auth-error');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const pass  = document.getElementById('login-password').value;
        const btn   = form.querySelector('button[type="submit"]');
        btn.textContent = 'Signing in…'; btn.disabled = true;
        errorMsg.classList.remove('show');

        // Try Supabase auth first
        const { data, error } = await signIn(email, pass);
        if (!error && data?.user) {
            sessionStorage.setItem('agency365_unlocked', 'true');
            sessionStorage.setItem('agency365_current_user', JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || email.split('@')[0],
                orgName: data.user.user_metadata?.orgName || 'My Agency',
                role: data.user.user_metadata?.role || 'admin',
            }));
            await syncFromSupabase();
            const role = localStorage.getItem('agency365_mock_role') || 'Admin';
            window.location.href = role === 'Employee' ? 'clients.html' : 'dashboard.html';
            return;
        }

        // Fallback: local dev backdoor
        if (email === 'admin@agency365.com' && pass === 'password') {
            sessionStorage.setItem('agency365_unlocked', 'true');
            const role = localStorage.getItem('agency365_mock_role') || 'Admin';
            window.location.href = role === 'Employee' ? 'clients.html' : 'dashboard.html';
            return;
        }

        errorMsg.textContent = error?.message || 'Incorrect email or password.';
        errorMsg.classList.add('show');
        btn.textContent = 'Sign In'; btn.disabled = false;
    });
}

// ── Signup ────────────────────────────────────────────────────
function initSignup() {
    const form     = document.getElementById('signup-form');
    const errorMsg = document.getElementById('auth-error');
    if (!form) return;

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const orgName = document.getElementById('signup-org')?.value.trim();
        const name    = document.getElementById('signup-name')?.value.trim();
        const email   = document.getElementById('signup-email')?.value.trim();
        const pass    = document.getElementById('signup-password')?.value;
        const btn     = form.querySelector('button[type="submit"]');
        btn.textContent = 'Creating account…'; btn.disabled = true;
        errorMsg.classList.remove('show');

        const { data, error } = await signUp(email, pass, { name, orgName, role: 'admin' });
        if (error) {
            errorMsg.textContent = error.message;
            errorMsg.classList.add('show');
            btn.textContent = 'Create Account'; btn.disabled = false;
            return;
        }

        // Supabase may require email confirmation — handle gracefully
        if (data?.user) {
            sessionStorage.setItem('agency365_unlocked', 'true');
            sessionStorage.setItem('agency365_current_user', JSON.stringify({
                id: data.user.id, email, name, orgName, role: 'admin'
            }));
            const role = localStorage.getItem('agency365_mock_role') || 'Admin';
            window.location.href = role === 'Employee' ? 'clients.html' : 'dashboard.html';
        } else {
            errorMsg.textContent = '✅ Check your email to confirm your account, then log in.';
            errorMsg.classList.add('show');
            btn.textContent = 'Create Account'; btn.disabled = false;
        }
    });
}

// ── Data Export / Import ──────────────────────────────────────
function initDataManagement() {
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = {
                agency365_clients:   localStorage.getItem('agency365_clients'),
                agency365_expenses:  localStorage.getItem('agency365_expenses'),
                agency365_events:    localStorage.getItem('agency365_events'),
                agency365_proposals: localStorage.getItem('agency365_proposals'),
                agency365_theme:     localStorage.getItem('agency365_theme'),
                agency365_start_date:     localStorage.getItem('agency365_start_date'),
                agency365_invoice_counter: localStorage.getItem('agency365_invoice_counter'),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `agency365_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click(); URL.revokeObjectURL(url);
        });
    }
    if (importBtn) importBtn.addEventListener('click', () => importFile?.click());
    if (importFile) {
        importFile.addEventListener('change', e => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    const data = JSON.parse(ev.target.result);
                    Object.keys(data).forEach(key => { if (data[key]) localStorage.setItem(key, data[key]); });
                    alert('Data imported! Reloading…');
                    window.location.reload();
                } catch { alert('Invalid backup file.'); }
            };
            reader.readAsText(file);
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (await window.customConfirm('Log out of Agency 365?')) {
                await signOut();
                window.location.href = 'login.html';
            }
        });
    }
}


// ── RBAC Logic ──────────────────────────────────────────────
function applyRBAC() {
    const role = localStorage.getItem('agency365_mock_role') || 'Admin';
    const path = window.location.pathname;
    
    // Inject Logout Button
    const userCard = document.querySelector('.menu-user-card');
    if (userCard && !document.getElementById('logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.title = 'Log Out';
        logoutBtn.style.cssText = 'background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:0.5rem; display:flex; align-items:center; justify-content:center; width:38px; height:38px; border-radius:50%;';
        logoutBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
        
        logoutBtn.addEventListener('mouseenter', () => { logoutBtn.style.color = '#ef4444'; logoutBtn.style.background = 'rgba(239, 68, 68, 0.1)'; });
        logoutBtn.addEventListener('mouseleave', () => { logoutBtn.style.color = 'var(--text-secondary)'; logoutBtn.style.background = 'none'; });
        
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('agency365_unlocked');
            sessionStorage.removeItem('agency365_current_user');
            window.location.href = 'login.html';
        });
        userCard.appendChild(logoutBtn);
    }

    // Role Policies
    // Keys match href values in the sidebar
    const policies = {
        'Admin': { hide: [], allowAll: true },
        'Manager': { hide: ['account.html', 'team.html'], allowAll: false },
        'Finance': { hide: ['crm.html', 'clients.html', 'calendar.html', 'team.html'], allowAll: false },
        'Employee': { hide: ['dashboard.html', 'proposals.html', 'finance.html', 'account.html'], allowAll: false }
    };
    
    const policy = policies[role] || policies['Admin'];

    // Update Sidebar Navigation
    document.querySelectorAll('.menu-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        let shouldHide = false;
        policy.hide.forEach(blockedRoute => {
            if (href.includes(blockedRoute)) shouldHide = true;
        });

        if (shouldHide) {
            link.parentElement.style.display = 'none'; // hide the <li>
        } else {
            link.parentElement.style.display = '';
        }
    });

    // Enforce Route Guard
    // Don't guard public pages or the current allowed pages
    const isPublicPage = ['index.html','login.html','signup.html','portal.html'].some(p => path.endsWith(p)) || path.endsWith('/');
    if (!isPublicPage && !policy.allowAll) {
        let blocked = false;
        policy.hide.forEach(blockedRoute => {
            if (path.includes(blockedRoute)) blocked = true;
        });
        
        if (blocked) {
            if (role === 'Employee') window.location.href = 'clients.html';
            else if (role === 'Finance') window.location.href = 'finance.html';
            else window.location.href = 'dashboard.html';
        }
    }
}
