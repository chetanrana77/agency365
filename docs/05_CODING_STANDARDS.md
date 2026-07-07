# 05_CODING_STANDARDS.md — Javascript & HTML Coding Standards

This document establishes the official coding standards for **Agency365**.

---

## 1. Javascript Design Patterns

### A. Modular ES6 Standard
All page scripts must use ES6 modules. Direct script imports should be mapped as modules:
```html
<script type="module" src="app.js"></script>
```

### B. Global Scope Contamination
- Variables and functions must not be assigned to the global `window` scope unless they are designed to be shared globally (e.g. `window.customConfirm`).
- Wrap standalone page scripts in closures or modular handlers to keep local states clean:
```js
// Preferred module pattern
(function() {
    let localState = [];
    function init() { ... }
    document.addEventListener('DOMContentLoaded', init);
})();
```

### C. State Mutability
- Cache states using clean local variables (`let clients = [...]`).
- Always load data directly from `localStorage` inside initializers:
```js
let clients = JSON.parse(localStorage.getItem('agency365_clients')) || [];
```
- Modifications to arrays must always trigger a complete call to save the data:
```js
function saveClients() {
    localStorage.setItem('agency365_clients', JSON.stringify(clients));
}
```

---

## 2. DOM Interaction & Event Handling

### A. Element Selection
- Prefer `document.getElementById('element-id')` for single unique controls.
- Use `querySelector` and `querySelectorAll` for class-based queries or component trees.
- Never write hardcoded inline handlers in HTML like `<button onclick="doSomething()">`. Use `addEventListener` inside the Javascript code.

### B. DOM Building & Security
- Never assign user input directly to `innerHTML` (prevents XSS vulnerabilities).
- Use `textContent` for plain text inputs, or sanitize HTML components:
```js
// Safe text insert
nameEl.textContent = client.name;
```

---

## 3. Date & Currency Conventions

### A. Currency Formatting (INR)
All currency displays must utilize the Indian Rupee formatting standard (`en-IN` locale):
```js
const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
console.log(fmt.format(150000)); // ₹1,50,000
```

### B. Date Formats
- Internally, all dates must be saved in ISO format: `YYYY-MM-DD`.
- Displays should match the user's localized locale (`en-GB` format `DD/MM/YYYY` or readable day names for calendar views).
- When using `<input type="date">`, set `max="9999-12-31"` to prevent browser bugs with year input boundaries.
