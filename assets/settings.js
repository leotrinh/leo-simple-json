/**
 * API Key management for the redesigned settings side-panel.
 * Talks to ./api/admin/keys.php (protected by the app's Basic Auth).
 * Panel open/close is handled inline in index.php; this only loads data,
 * renders the keys table + file picker, and handles create/update/delete.
 */
const SETTINGS = {
    endpoint: './api/admin/keys.php',
    files: [],
    editingId: null,

    init() {
        const open = document.getElementById('settings-button');
        const form = document.getElementById('key-form');
        const reset = document.getElementById('key-form-reset');
        if (!open || !form) return;

        open.addEventListener('click', () => SETTINGS.loadAll());
        form.addEventListener('submit', (e) => { e.preventDefault(); SETTINGS.submit(); });
        reset.addEventListener('click', () => SETTINGS.resetForm());
    },

    notify(msg, type) {
        if (typeof window.showNotification === 'function') window.showNotification(msg, type);
        else alert(msg);
    },

    api(action, method, body) {
        return fetch(`${SETTINGS.endpoint}?action=${action}`, {
            method: method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        }).then((r) => r.json());
    },

    loadAll() {
        Promise.all([SETTINGS.api('files'), SETTINGS.api('list')])
            .then(([files, keys]) => {
                SETTINGS.files = (files && files.data) || [];
                SETTINGS.renderFilesPicker(SETTINGS.editingId ? null : []);
                SETTINGS.renderKeys((keys && keys.data) || []);
            })
            .catch(() => SETTINGS.notify('Failed to load API keys', 'error'));
    },

    renderFilesPicker(selected) {
        const box = document.getElementById('key-files');
        box.innerHTML = '';
        if (!SETTINGS.files.length) {
            box.innerHTML = '<span style="color:var(--color-text-muted);font-size:11px">No JSON files found</span>';
            return;
        }
        const sel = selected || [];
        SETTINGS.files.forEach((f) => {
            const item = document.createElement('label');
            item.className = 'checkbox-item';
            item.innerHTML = `<input type="checkbox" value="${SETTINGS.escape(f)}" ${sel.includes(f) ? 'checked' : ''}> ${SETTINGS.escape(f)}`;
            box.appendChild(item);
        });
    },

    selectedFiles() {
        return Array.from(document.querySelectorAll('#key-files input:checked')).map((c) => c.value);
    },

    renderKeys(keys) {
        const tbody = document.getElementById('key-table-body');
        tbody.innerHTML = '';
        if (!keys.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted);padding:16px;">No keys yet</td></tr>';
            return;
        }
        keys.forEach((rec) => tbody.appendChild(SETTINGS.renderRow(rec)));
    },

    renderRow(rec) {
        const tr = document.createElement('tr');
        const scope = (!rec.allowed_files || !rec.allowed_files.length)
            ? 'All files'
            : `${rec.allowed_files.length} file(s)`;
        tr.innerHTML = `
            <td>${SETTINGS.escape(rec.label)}</td>
            <td>${SETTINGS.statusBadge(rec)}</td>
            <td>${SETTINGS.formatExpire(rec.expire_at)}</td>
            <td>${SETTINGS.escape(scope)}</td>
            <td class="key-actions"></td>`;
        const cell = tr.lastElementChild;
        cell.appendChild(SETTINGS.actBtn('Copy', 'var(--color-bg-tertiary)', 'var(--color-text-primary)', () => SETTINGS.copy(rec.key)));
        cell.appendChild(SETTINGS.actBtn('Edit', 'var(--color-accent-info)', '#fff', () => SETTINGS.edit(rec)));
        cell.appendChild(SETTINGS.actBtn(rec.enabled ? 'Off' : 'On', 'var(--color-accent-warning)', 'var(--color-bg-primary)', () => SETTINGS.toggle(rec)));
        cell.appendChild(SETTINGS.actBtn('Del', 'var(--color-accent-danger)', '#fff', () => SETTINGS.remove(rec)));
        return tr;
    },

    actBtn(text, bg, fg, onClick) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = text;
        b.style.cssText = `margin:1px;padding:3px 7px;font-size:10px;font-weight:600;border:none;border-radius:4px;cursor:pointer;background:${bg};color:${fg};`;
        b.addEventListener('click', onClick);
        return b;
    },

    submit() {
        const label = document.getElementById('key-label').value.trim();
        if (!label) { SETTINGS.notify('Label is required', 'error'); return; }
        const expireRaw = document.getElementById('key-expire').value;
        const payload = {
            label,
            expire_at: expireRaw ? Math.floor(new Date(expireRaw).getTime() / 1000) : null,
            allowed_files: SETTINGS.selectedFiles(),
            enabled: document.getElementById('key-enabled').checked,
        };
        const action = SETTINGS.editingId ? 'update' : 'create';
        if (SETTINGS.editingId) payload.id = SETTINGS.editingId;
        SETTINGS.api(action, 'POST', payload).then((res) => {
            if (!res.success) { SETTINGS.notify(res.msg || 'Error', 'error'); return; }
            SETTINGS.notify(SETTINGS.editingId ? 'Key updated' : 'Key created', 'success');
            if (!SETTINGS.editingId && res.data && res.data.key) SETTINGS.copy(res.data.key);
            SETTINGS.resetForm();
            SETTINGS.loadAll();
        });
    },

    edit(rec) {
        SETTINGS.editingId = rec.id;
        document.getElementById('key-label').value = rec.label;
        document.getElementById('key-expire').value = rec.expire_at ? SETTINGS.toLocalInput(rec.expire_at) : '';
        document.getElementById('key-enabled').checked = !!rec.enabled;
        SETTINGS.renderFilesPicker(rec.allowed_files || []);
        document.getElementById('key-form-title').textContent = `Edit: ${rec.label}`;
        document.getElementById('key-submit').textContent = 'Update Key';
        document.querySelector('.panel-content').scrollTop = 0;
    },

    toggle(rec) {
        SETTINGS.api('update', 'POST', { id: rec.id, enabled: !rec.enabled })
            .then(() => SETTINGS.loadAll());
    },

    remove(rec) {
        if (!confirm(`Delete key "${rec.label}"? This cannot be undone.`)) return;
        SETTINGS.api('delete', 'POST', { id: rec.id }).then(() => {
            SETTINGS.notify('Key deleted', 'success');
            SETTINGS.loadAll();
        });
    },

    resetForm() {
        SETTINGS.editingId = null;
        document.getElementById('key-form').reset();
        document.getElementById('key-enabled').checked = true;
        SETTINGS.renderFilesPicker([]);
        document.getElementById('key-form-title').textContent = 'Create New Key';
        document.getElementById('key-submit').textContent = 'Create Key';
    },

    copy(text) {
        navigator.clipboard.writeText(text)
            .then(() => SETTINGS.notify('API key copied to clipboard', 'success'))
            .catch(() => prompt('Copy the API key:', text));
    },

    formatExpire(ts) {
        if (!ts) return 'Never';
        const expired = Date.now() > ts * 1000;
        const d = new Date(ts * 1000).toLocaleDateString();
        return expired ? `${d} (expired)` : d;
    },

    statusBadge(rec) {
        if (!rec.enabled) return '<span class="badge badge-disabled">disabled</span>';
        if (rec.expire_at && Date.now() > rec.expire_at * 1000)
            return '<span class="badge badge-expired">expired</span>';
        return '<span class="badge badge-active">active</span>';
    },

    toLocalInput(ts) {
        const d = new Date(ts * 1000);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },

    escape(s) {
        const div = document.createElement('div');
        div.textContent = s == null ? '' : s;
        return div.innerHTML;
    },
};

document.addEventListener('DOMContentLoaded', () => SETTINGS.init());
