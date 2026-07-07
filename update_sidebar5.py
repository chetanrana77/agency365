import os, glob

sidebar_html = """            <ul class="nav-links">
                <li><a href="dashboard.html" class="nav-btn">Dashboard</a></li>
                <li><a href="clients.html" class="nav-btn">Clients</a></li>
                <li><a href="crm.html" class="nav-btn">CRM (Leads)</a></li>
                <li><a href="finance.html" class="nav-btn">Billing</a></li>
                <li><a href="calendar.html" class="nav-btn">Calendar</a></li>
            </ul>
            <div class="sidebar-footer">
                <a href="account.html" class="nav-btn" style="margin-bottom: 1rem;">Account</a>
            </div>"""

for filepath in glob.glob('*.html'):
    if filepath in ('invoice.html', 'client-detail.html', 'revenue.html'): continue
    with open(filepath, 'r') as f:
        content = f.read()
    start_str = '<ul class="nav-links">'
    end_str = '</nav>'
    if start_str in content and end_str in content:
        start_idx = content.find(start_str)
        end_idx = content.find(end_str, start_idx)
        new_content = content[:start_idx] + sidebar_html + "\n        </nav>" + content[end_idx + len(end_str):]
        # Also rename Finance 365 in title if present
        new_content = new_content.replace('Finance 365', 'Billing')
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
