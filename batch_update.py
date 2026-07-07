#!/usr/bin/env python3
"""
Batch update script for Agency 365 project.
Applies all 5 tasks across the HTML and JS files.
"""
import re, os

BASE = '/Users/chetanrana/Antigravity Codes/project-365'

PWA_META = '''    <link rel="manifest" href="manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Agency 365">
    <meta name="theme-color" content="#12b76a">'''

SW_SCRIPT = '''<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
</script>'''

THEME_BTN = '''    <button id="mob-theme-toggle" class="mob-nav-item" title="Toggle Theme" style="background:none;border:none;cursor:pointer;">
        <svg class="mob-theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
        <span>Theme</span>
    </button>'''

# The 8 main pages for PWA + dark mode toggle
APP_PAGES = [
    'dashboard.html',
    'clients.html',
    'crm.html',
    'calendar.html',
    'proposals.html',
    'finance.html',
    'account.html',
    'revenue.html',
    'client-detail.html',
]

# ── TASK 1 + 2: Process all app pages ────────────────────────────────

def get_last_link_pattern(content):
    """Find the last <link ...> tag in <head> to insert after it."""
    # Find all link tags in head
    head_match = re.search(r'<head>(.*?)</head>', content, re.DOTALL | re.IGNORECASE)
    if not head_match:
        return None
    head = head_match.group(1)
    # Find last <link ...> in head (could be self-closing or not)
    links = list(re.finditer(r'<link[^>]*>', head, re.IGNORECASE))
    if not links:
        return None
    return links[-1]

def process_page(filename):
    path = os.path.join(BASE, filename)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # ── Task 1: Add PWA meta tags ─────────────────────────────────
    if 'rel="manifest"' not in content:
        # Find last <link in head section
        # Strategy: find the last link tag before </head>
        head_end = content.find('</head>')
        head_portion = content[:head_end]
        
        # Find last link tag position in head
        last_link_end = -1
        for m in re.finditer(r'<link[^>]*>', head_portion, re.IGNORECASE):
            last_link_end = m.end()
        
        if last_link_end != -1:
            content = content[:last_link_end] + '\n' + PWA_META + content[last_link_end:]
            print(f'  [PWA meta] Added to {filename}')
            modified = True
    else:
        print(f'  [PWA meta] Already present in {filename}')
    
    # ── Task 1: Add SW registration ──────────────────────────────
    if 'serviceWorker' not in content:
        # Insert before </body>
        content = content.replace('</body>', SW_SCRIPT + '\n</body>', 1)
        print(f'  [SW reg]   Added to {filename}')
        modified = True
    else:
        print(f'  [SW reg]   Already present in {filename}')
    
    # ── Task 2: Add theme toggle to mob-nav ──────────────────────
    # Only add to pages that have mob-nav (client-detail.html doesn't have mob-nav)
    if 'mob-nav' in content and 'mob-theme-toggle' not in content:
        # Find the finance.html mob-nav-item and insert theme button after it
        # Pattern: find `<a href="finance.html" class="mob-nav-item...">...</a>` in mob-nav
        # The finance link in mob-nav ends with </a> followed by newline and then </nav>
        # We need to insert after the closing </a> of the finance mob-nav-item
        
        # Find mob-nav section
        mob_nav_match = re.search(r'<nav class="mob-nav"[^>]*>.*?</nav>', content, re.DOTALL)
        if mob_nav_match:
            mob_nav = mob_nav_match.group(0)
            # Find last </a> before </nav> (which is the finance link)
            # Insert theme button after the last </a> in mob-nav
            last_a_end = mob_nav.rfind('</a>')
            if last_a_end != -1:
                insert_pos = mob_nav_match.start() + last_a_end + len('</a>')
                content = content[:insert_pos] + '\n' + THEME_BTN + content[insert_pos:]
                print(f'  [Theme btn] Added to {filename}')
                modified = True
        else:
            print(f'  [Theme btn] Could not find mob-nav in {filename}')
    elif 'mob-theme-toggle' in content:
        print(f'  [Theme btn] Already present in {filename}')
    else:
        print(f'  [Theme btn] No mob-nav in {filename} (skipped)')
    
    if modified:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'  ✓ Saved {filename}')
    
    return modified

print('=== Processing HTML pages ===')
for page in APP_PAGES:
    print(f'\n[{page}]')
    process_page(page)

print('\n=== All done! ===')
