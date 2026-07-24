let events = JSON.parse(sessionStorage.getItem('agency365_events')) || [];
let currentEventId = null;
let calendar;

export function initCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    events = JSON.parse(sessionStorage.getItem('agency365_events')) || [];
    const clients = JSON.parse(sessionStorage.getItem('agency365_clients')) || [];

    populateClientDropdown();

    let displayEvents = [...events];
    const todayStr = new Date().toISOString().slice(0, 10);
    
    clients.forEach(c => {
        if (!c.tasks) return;
        c.tasks.forEach((t, i) => {
            if (!t.done) {
                displayEvents.push({
                    id: `task_${c.id}_${i}`,
                    title: `✅ ${c.name}: ${t.text}`,
                    start: t.dueDate || todayStr,
                    allDay: true,
                    classNames: ['fc-task-event']
                });
            }
        });
    });

    const generalTasks = JSON.parse(localStorage.getItem('agency365_general_tasks')) || [];
    generalTasks.forEach((t, i) => {
        if (!t.done) {
            displayEvents.push({
                id: `gtask_${i}`,
                title: `✅ ${t.text}`,
                start: t.dueDate || todayStr,
                allDay: true,
                classNames: ['fc-task-event']
            });
        }
    });

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: displayEvents,
        selectable: true,
        editable: true,
        select: function(info) {
            openEventPanel(null, info.startStr, info.endStr);
        },
        eventClick: function(info) {
            if (info.event.id.startsWith('task_')) {
                // If it's a client task, navigate to the client detail page to manage it
                const clientId = info.event.id.split('_')[1];
                const cl = clients.find(c => c.id === clientId);
                if (cl) {
                    const slug = encodeURIComponent(cl.name.toLowerCase().replace(/\s+/g, '-'));
                    window.location.href = `client-detail.html?id=${clientId}&slug=${slug}`;
                }
                return;
            }
            if (info.event.id.startsWith('gtask_')) {
                const idx = parseInt(info.event.id.split('_')[1]);
                const generalTasks = JSON.parse(localStorage.getItem('agency365_general_tasks')) || [];
                if(window.confirm(`Mark task "${generalTasks[idx].text}" as complete?`)) {
                    generalTasks[idx].done = true;
                    sessionStorage.setItem('agency365_general_tasks', JSON.stringify(generalTasks));
                    info.event.remove();
                }
                return;
            }
            const ev = events.find(e => String(e.id) === String(info.event.id));
            if(ev) openEventPanel(ev);
        },
        eventDrop: function(info) {
            updateEventDates(info.event);
        },
        eventResize: function(info) {
            updateEventDates(info.event);
        }
    });

    calendar.render();

    // Panel Event Listeners
    document.getElementById('add-event-btn').addEventListener('click', () => openEventPanel());
    document.getElementById('close-panel-btn').addEventListener('click', closeEventPanel);
    
    document.getElementById('add-task-panel-btn').addEventListener('click', () => openTaskPanel());
    document.getElementById('close-task-panel-btn').addEventListener('click', closeTaskPanel);

    document.getElementById('event-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEvent();
    });

    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveTask();
    });

    document.getElementById('delete-event-btn').addEventListener('click', deleteEvent);

    // Auto-open panel if coming from client detail page
    const preClient = sessionStorage.getItem('agency365_schedule_client');
    if (preClient) {
        sessionStorage.removeItem('agency365_schedule_client');
        const cl = JSON.parse(preClient);
        openEventPanel();
        document.getElementById('event-title').value = `Meeting with ${cl.name}`;
        document.getElementById('event-client').value = cl.id;
    }
}

function populateClientDropdown() {
    const sel = document.getElementById('event-client');
    const taskSel = document.getElementById('task-client-select');
    const clients = JSON.parse(sessionStorage.getItem('agency365_clients')) || [];
    
    if (sel) {
        sel.innerHTML = '<option value="">— No Client —</option>';
        clients.forEach(c => { sel.innerHTML += `<option value="${c.id}">${c.name}</option>`; });
    }
    if (taskSel) {
        taskSel.innerHTML = '<option value="">— General Task (No Client) —</option>';
        clients.forEach(c => { taskSel.innerHTML += `<option value="${c.id}">${c.name}</option>`; });
    }
}

function openEventPanel(event = null, startStr = '', endStr = '') {
    const panel = document.getElementById('event-side-panel');
    const title = document.getElementById('panel-title');
    const form = document.getElementById('event-form');
    const delBtn = document.getElementById('delete-event-btn');

    populateClientDropdown();

    if (event) {
        title.textContent = 'Edit Event';
        currentEventId = event.id;
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-start').value = event.start.slice(0, 16);
        // Calculate duration from start/end
        if (event.start && event.end) {
            const diffMs = new Date(event.end) - new Date(event.start);
            const diffMin = Math.round(diffMs / 60000);
            const durSel = document.getElementById('event-duration');
            // Try to match closest option
            const opts = [...durSel.options].map(o => parseInt(o.value));
            const closest = opts.reduce((prev, curr) => Math.abs(curr - diffMin) < Math.abs(prev - diffMin) ? curr : prev);
            durSel.value = closest.toString();
        }
        document.getElementById('event-color').value = event.backgroundColor || '#3b82f6';
        document.getElementById('event-desc').value = event.extendedProps?.description || '';
        document.getElementById('event-client').value = event.extendedProps?.clientId || '';
        delBtn.style.display = 'block';
    } else {
        title.textContent = 'Schedule Meeting';
        currentEventId = null;
        form.reset();
        
        if(startStr) {
            document.getElementById('event-start').value = startStr.includes('T') ? startStr.slice(0,16) : `${startStr}T09:00`;
        }
        
        delBtn.style.display = 'none';
    }
    
    panel.classList.add('open');
}

function closeEventPanel() {
    document.getElementById('event-side-panel').classList.remove('open');
    currentEventId = null;
}

function saveEvent() {
    const title = document.getElementById('event-title').value;
    const start = document.getElementById('event-start').value;
    const durationMin = parseInt(document.getElementById('event-duration').value) || 30;
    const color = document.getElementById('event-color').value;
    const desc = document.getElementById('event-desc').value;
    const clientId = document.getElementById('event-client').value;

    // Calculate end from start + duration
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + durationMin * 60000);
    const end = endDate.toISOString().slice(0, 16);

    // If a client is selected, prepend client name to the title shown on calendar
    let displayTitle = title;
    if (clientId) {
        const clients = JSON.parse(sessionStorage.getItem('agency365_clients')) || [];
        const cl = clients.find(c => c.id === clientId);
        if (cl && !title.startsWith(cl.name)) {
            displayTitle = `${cl.name} — ${title}`;
        }
    }

    const eventData = {
        id: String(currentEventId || Date.now()),
        title: displayTitle,
        start: start,
        end: end,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
            description: desc,
            clientId: clientId
        }
    };

    if (currentEventId) {
        const idx = events.findIndex(e => String(e.id) === String(currentEventId));
        if (idx > -1) events[idx] = eventData;
        const calEvent = calendar.getEventById(String(currentEventId));
        if(calEvent) calEvent.remove();
        calendar.addEvent(eventData);
    } else {
        events.push(eventData);
        calendar.addEvent(eventData);
    }

    sessionStorage.setItem('agency365_events', JSON.stringify(events));
    closeEventPanel();
}

async function deleteEvent(e) {
    e.preventDefault();
    if(!currentEventId) return;
    const confirmed = await window.customConfirm('Are you sure you want to delete this event?');
    if(confirmed) {
        events = events.filter(e => String(e.id) !== String(currentEventId));
        sessionStorage.setItem('agency365_events', JSON.stringify(events));
        
        const calEvent = calendar.getEventById(String(currentEventId));
        if(calEvent) calEvent.remove();
        
        closeEventPanel();
    }
}

function updateEventDates(calEvent) {
    if (calEvent.id.startsWith('task_')) {
        const parts = calEvent.id.split('_');
        const clientId = parts[1];
        const taskIdx = parseInt(parts[2]);
        
        const clients = JSON.parse(sessionStorage.getItem('agency365_clients')) || [];
        const client = clients.find(c => c.id === clientId);
        if (client && client.tasks && client.tasks[taskIdx]) {
            client.tasks[taskIdx].dueDate = calEvent.startStr;
            sessionStorage.setItem('agency365_clients', JSON.stringify(clients));
        }
        return;
    }
    if (calEvent.id.startsWith('gtask_')) {
        const idx = parseInt(calEvent.id.split('_')[1]);
        const generalTasks = JSON.parse(localStorage.getItem('agency365_general_tasks')) || [];
        if (generalTasks[idx]) {
            generalTasks[idx].dueDate = calEvent.startStr;
            sessionStorage.setItem('agency365_general_tasks', JSON.stringify(generalTasks));
        }
        return;
    }

    const idx = events.findIndex(e => String(e.id) === String(calEvent.id));
    if(idx > -1) {
        events[idx].start = calEvent.startStr;
        events[idx].end = calEvent.endStr || null;
        sessionStorage.setItem('agency365_events', JSON.stringify(events));
    }
}

function openTaskPanel() {
    populateClientDropdown();
    document.getElementById('task-form').reset();
    document.getElementById('task-side-panel').classList.add('open');
}

function closeTaskPanel() {
    document.getElementById('task-side-panel').classList.remove('open');
}

function saveTask() {
    const title = document.getElementById('task-title').value;
    const clientId = document.getElementById('task-client-select').value;
    const dueDate = document.getElementById('task-due').value;

    if (clientId) {
        const clients = JSON.parse(sessionStorage.getItem('agency365_clients')) || [];
        const client = clients.find(c => c.id === clientId);
        if (client) {
            if (!client.tasks) client.tasks = [];
            client.tasks.push({ text: title, done: false, dueDate: dueDate || null });
            sessionStorage.setItem('agency365_clients', JSON.stringify(clients));
        }
    } else {
        const generalTasks = JSON.parse(localStorage.getItem('agency365_general_tasks')) || [];
        generalTasks.push({ text: title, done: false, dueDate: dueDate || null });
        sessionStorage.setItem('agency365_general_tasks', JSON.stringify(generalTasks));
    }

    closeTaskPanel();
    
    // Re-initialize calendar to show the new task
    // It's the simplest way without mutating the underlying FullCalendar cache directly
    document.getElementById('calendar').innerHTML = '';
    initCalendar();
}
