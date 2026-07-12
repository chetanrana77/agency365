// supabaseClient.js — Agency 365 Live Supabase Connection
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://nytzlivcfiflqmqnjivd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xwTbIz3WpbtJIgExXtCA8g_GFBDLzu9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Auth helpers ──────────────────────────────────────────────
export async function signUp(email, password, meta = {}) {
    const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: meta }
    });
    return { data, error };
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
}

export async function signOut() {
    await supabase.auth.signOut();
    sessionStorage.clear();
    localStorage.removeItem('agency365_unlocked');
}

export async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// ── Data Sync ─────────────────────────────────────────────────
const SYNC_TABLES = {
    'agency365_clients':   'clients',
    'agency365_expenses':  'expenses',
    'agency365_events':    'events',
    'agency365_proposals': 'proposals',
};

const _origSet = localStorage.setItem.bind(localStorage);

// Mutex queues for debounced, non-blocking syncs
const syncMutex = {};
const pendingSyncData = {};

export function isSyncing() {
    return Object.values(syncMutex).some(isLocked => isLocked) || Object.values(pendingSyncData).some(data => data !== null);
}

// Override localStorage.setItem to auto-sync safely to Supabase
localStorage.setItem = async function(key, value) {
    _origSet(key, value); // instant local save
    
    const table = SYNC_TABLES[key];
    if (!table) return;
    
    // Store latest value into the queue
    pendingSyncData[table] = value;
    
    // If a sync for this table is already running, return.
    // The active loop will pick up this newest pendingSyncData value.
    if (syncMutex[table]) return;
    
    // Otherwise, start the sync loop
    syncMutex[table] = true;
    
    try {
        const user = await getUser();
        if (!user) {
            syncMutex[table] = false;
            return;
        }

        while (pendingSyncData[table]) {
            const currentData = pendingSyncData[table];
            pendingSyncData[table] = null; // consume it from queue
            
            const arr = JSON.parse(currentData) || [];
            
            // Atomic-ish write: delete old and insert new state
            await supabase.from(table).delete().eq('user_id', user.id);
            if (arr.length > 0) {
                await supabase.from(table).insert(
                    arr.map(item => ({ user_id: user.id, data: item, item_id: item.id || null }))
                );
            }
        }
    } catch (err) {
        console.error(`Supabase Mutex sync error (${key}):`, err);
    } finally {
        syncMutex[table] = false;
    }
};

// Pull data from Supabase into localStorage on login/load
export async function syncFromSupabase() {
    const user = await getUser();
    if (!user) return;
    try {
        const [clients, expenses, events, proposals] = await Promise.all([
            supabase.from('clients').select('data').eq('user_id', user.id),
            supabase.from('expenses').select('data').eq('user_id', user.id),
            supabase.from('events').select('data').eq('user_id', user.id),
            supabase.from('proposals').select('data').eq('user_id', user.id),
        ]);
        if (clients.data?.length)   _origSet('agency365_clients',   JSON.stringify(clients.data.map(r => r.data)));
        if (expenses.data?.length)  _origSet('agency365_expenses',  JSON.stringify(expenses.data.map(r => r.data)));
        if (events.data?.length)    _origSet('agency365_events',    JSON.stringify(events.data.map(r => r.data)));
        if (proposals.data?.length) _origSet('agency365_proposals', JSON.stringify(proposals.data.map(r => r.data)));
        console.log('✅ Synced from Supabase:', user.email);
    } catch (err) {
        console.error('Supabase sync failed:', err);
    }
}

// ── Notifications ─────────────────────────────────────────────
export async function pushNotification(message, type = 'info') {
    const user = await getUser();
    if (!user) return;
    await supabase.from('notifications').insert({ user_id: user.id, message, type });
}

export async function getNotifications(limit = 20) {
    const user = await getUser();
    if (!user) return [];
    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
    return data || [];
}

export async function markNotificationRead(id) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
}

// ── Team ──────────────────────────────────────────────────────
export async function inviteTeamMember(email, role, orgId) {
    const user = await getUser();
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase.from('team_members').insert({
        owner_id: user.id,
        email,
        role,
        org_id: orgId || user.id,
        status: 'pending'
    });
    return { data, error };
}

export async function getTeamMembers() {
    const user = await getUser();
    if (!user) return [];
    const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', user.id);
    return data || [];
}

export async function updateTeamMemberRole(memberId, role) {
    const { data, error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);
    return { data, error };
}

// ── Onboarding Tokens ─────────────────────────────────────────
export async function createOnboardingToken(clientId) {
    const user = await getUser();
    if (!user) return null;
    const token = crypto.randomUUID();
    await supabase.from('onboarding_tokens').insert({
        user_id: user.id,
        client_id: clientId,
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
    return token;
}

export async function getOnboardingToken(token) {
    const { data } = await supabase
        .from('onboarding_tokens')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();
    return data;
}
