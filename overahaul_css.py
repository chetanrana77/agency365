import re

with open('styles.css', 'r') as f:
    css = f.read()

# 1. Update variables
css = re.sub(r'--bg-color: #fcfcfd;', '--bg-color: #f6f8fa;', css)
css = re.sub(r'--bg-secondary: #ffffff;', '--bg-secondary: #ffffff;', css)
css = re.sub(r'--border-color: #f2f4f7;', '--border-color: #f1f5f9;', css)
css = re.sub(r'--accent-color: #000000;', '--accent-color: #7c3aed;', css)
css = re.sub(r'--accent-hover: #333333;', '--accent-hover: #6d28d9;', css)
css = re.sub(r'--input-bg: #f9fafb;', '--input-bg: #f8fafc;', css)
css = re.sub(r'--card-radius: 20px;', '--card-radius: 16px;', css)
css = re.sub(r'--card-shadow: 0 12px 36px rgba\(0, 0, 0, 0.04\), 0 4px 12px rgba\(0, 0, 0, 0.02\);', '--card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);', css)

# 2. Update Body Background
body_replacement = """body {
    font-family: 'Inter', -apple-system, sans-serif;
    background-color: var(--bg-color);
    background-image: 
        radial-gradient(circle at 15% 50%, rgba(124, 58, 237, 0.05), transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(59, 130, 246, 0.05), transparent 25%);
    color: var(--text-primary);
    min-height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
}"""
css = re.sub(r'body \{[\s\S]*?\}', body_replacement, css, count=1)

# 3. Update #app
app_replacement = """#app {
    display: flex;
    height: calc(100vh - 3rem);
    width: 100%;
    max-width: 1600px;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.02);
}"""
css = re.sub(r'#app \{[\s\S]*?\}', app_replacement, css)

# 4. Remove sidebar borders & fix active states
css = re.sub(r'border-right: 1px solid var\(--border-color\);', '/* border removed */', css)
css = re.sub(r'\.sidebar-icons \{[\s\S]*?\}', lambda m: m.group(0).replace('height: 100vh;', 'height: 100%; background: transparent;'), css)
css = re.sub(r'\.sidebar-menu \{[\s\S]*?\}', lambda m: m.group(0).replace('height: 100vh;', 'height: 100%; background: transparent;'), css)

css = css.replace('background: rgba(18, 183, 106, 0.1);', 'background: #f1f5f9; color: var(--text-primary);')
css = css.replace('.menu-links a.active {\n    color: var(--text-primary);\n    background: var(--bg-color);', '.menu-links a.active {\n    color: var(--text-primary);\n    background: #f1f5f9;')
css = css.replace('.icon-links a.active {\n    color: var(--accent-color);\n    background: #f1f5f9; color: var(--text-primary);', '.icon-links a.active {\n    color: var(--text-primary);\n    background: #f1f5f9;')

# 5. Fix tabs to pill style
tab_replacement = """/* Tabs */
.tabs-container {
    display: flex;
    gap: 0.5rem;
    border-bottom: none;
    background: var(--input-bg);
    padding: 0.25rem;
    border-radius: 12px;
    width: fit-content;
}
.tab-btn {
    background: transparent;
    border: none;
    padding: 0.5rem 1.25rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s;
}
.tab-btn:hover {
    color: var(--text-primary);
}
.tab-btn.active {
    color: var(--text-primary);
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    font-weight: 600;
}"""
css = re.sub(r'/\* Tabs \*/[\s\S]*?/\* Buttons \*/', tab_replacement + "\n\n/* Buttons */", css)

with open('styles.css', 'w') as f:
    f.write(css)
