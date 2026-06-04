<?php
require_once('leo-cfg.php');
if (isMobileOrTablet()) {
    header('HTTP/1.0 404 NotFound');
    echo '<h1>Please use Desktop instead</h1>';
    exit;
}
// Check if the user is already logged in
if (!isset($_SERVER['PHP_AUTH_USER']) || $_SERVER['PHP_AUTH_USER'] !== $authUser || $_SERVER['PHP_AUTH_PW'] !== $authPwd) {
    // If not logged in, send the authentication headers
    header('WWW-Authenticate: Basic realm="Restricted Area"');
    header('HTTP/1.0 401 Unauthorized');
    echo '<h1>401</h1>';
    echo '<h2>You are not Authorized</h2>';
    echo '<h3>Contact: leo.trinh@conarum.com</h3>';
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" href="https://conarum.com/wp-content/uploads/2019/04/conarum_favicon@32px.png" type="image/png" sizes="32x32" />
    <title><?php echo $appTitle ?? "Online JSON Editor"; ?></title>
    <link rel="stylesheet" href="./assets/redesign.css" />
</head>

<body>
    <!-- Header -->
    <div class="header">
        <div class="header-content">
            <div class="header-left">
                <img src="<?php echo $appLogoPath; ?>" alt="Logo" class="logo">
                <div class="app-title"><?php echo $appTitle ?? "JSON Editor"; ?></div>
                <div class="version-badge">v<?php echo $appVersion; ?></div>
            </div>

            <div class="header-center">
                <div class="file-select-wrapper" id="file-select-wrapper">
                    <input id="file-search" class="file-select" type="text" autocomplete="off"
                        placeholder="Search &amp; select a file..." aria-label="Search and select JSON file">
                    <div id="file-dropdown" class="file-dropdown"></div>
                </div>
                <button id="refresh-button" class="btn-icon" title="Reload file list">
                    &#8635; Reload
                </button>
            </div>

            <div class="header-right">
                <button id="theme-toggle" class="theme-toggle" title="Toggle dark/light mode">&#127769;</button>
                <button id="logout-button" class="theme-toggle" title="Logout">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Container -->
    <div class="container">
        <!-- Left Sidebar -->
        <aside class="sidebar">
            <!-- File Operations -->
            <div class="sidebar-section">
                <div class="sidebar-title">Create New</div>
                <div class="input-group">
                    <label for="create-file-name">File Name</label>
                    <input id="create-file-name" type="text" placeholder="MY_CONFIG" aria-label="Enter JSON file name">
                    <div class="help-text">Prefix '<?php echo $filePrefixBefore; ?>' will be added automatically</div>
                </div>
                <button id="create-button" class="btn btn-primary" style="width: 100%;">Create File</button>
            </div>

            <!-- Format Actions -->
            <div class="sidebar-section">
                <div class="sidebar-title">Format</div>
                <div class="btn-group">
                    <button id="beautify" class="btn btn-secondary">Beautify</button>
                    <button id="minify" class="btn btn-secondary">Minify</button>
                </div>
            </div>

            <!-- Save/Delete Actions -->
            <div class="sidebar-section">
                <div class="sidebar-title">Actions</div>
                <button id="save-button" class="btn btn-success" style="width: 100%; margin-bottom: 8px;">Save</button>
                <button id="delete-button" class="btn btn-danger" style="width: 100%;">Delete</button>
            </div>

            <!-- Settings -->
            <div class="sidebar-section">
                <button id="settings-button" class="btn btn-secondary" style="width: 100%;">&#9881; API Settings</button>
            </div>

            <!-- Help Text -->
            <div style="padding: 12px; background-color: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 6px; font-size: 12px; color: var(--color-text-muted); line-height: 1.5;">
                <strong>Tip:</strong> Validate JSON before saving at <a href="https://jsoneditoronline.org" target="_blank" style="color: var(--color-accent-primary);">jsoneditoronline.org</a>
            </div>
        </aside>

        <!-- Editor Area -->
        <div class="editor-area">
            <div class="editor-header">
                <div class="editor-info">
                    <span>API Endpoint:</span>
                    <a id="api-link" href="" target="_blank">Select a file</a>
                </div>
                <button id="copy-api-link" class="btn-copy" title="Copy API link">&#128203; Copy</button>
            </div>

            <div class="editor-wrapper">
                <div id="editor"></div>
            </div>

            <div class="editor-footer">
                <div class="status-message" id="status-message">Ready</div>
            </div>
        </div>
    </div>

    <!-- Side Panel: API Settings -->
    <div id="settings-overlay" class="side-panel-overlay"></div>
    <div id="settings-panel" class="side-panel">
        <div class="panel-header">
            <h2>API Key Settings</h2>
            <button id="settings-close" class="panel-close" title="Close">&#10005;</button>
        </div>

        <div class="panel-content">
            <div class="panel-section">
                <div class="panel-info">
                    Keys authenticate the REST API via the <code>j-api-key</code> header. Leave "Allowed files" empty to grant access to all files.
                </div>
            </div>

            <div class="panel-section">
                <h3 id="key-form-title">Create New Key</h3>
                <form id="key-form">
                    <div class="form-col" style="margin-bottom: 12px;">
                        <label for="key-label" style="font-weight: 600; color: var(--color-text-primary); font-size: 12px;">Label</label>
                        <input id="key-label" type="text" placeholder="e.g. Mobile app" class="input-group input" style="padding: 8px 12px;">
                    </div>

                    <div class="form-col" style="margin-bottom: 12px;">
                        <label for="key-expire" style="font-weight: 600; color: var(--color-text-primary); font-size: 12px;">Expires (empty = never)</label>
                        <input id="key-expire" type="datetime-local" class="input-group input" style="padding: 8px 12px;">
                    </div>

                    <div class="form-col" style="margin-bottom: 12px;">
                        <label style="font-weight: 600; color: var(--color-text-primary); font-size: 12px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                            <input id="key-enabled" type="checkbox" checked style="width: 16px; height: 16px; cursor: pointer;">
                            Active
                        </label>
                    </div>

                    <div class="form-col" style="margin-bottom: 12px;">
                        <label style="font-weight: 600; color: var(--color-text-primary); font-size: 12px; margin-bottom: 6px; display: block;">Allowed Files</label>
                        <div id="key-files" class="checkbox-group"></div>
                    </div>

                    <div class="btn-group" style="gap: 8px;">
                        <button id="key-submit" type="submit" class="btn btn-success">Create Key</button>
                        <button id="key-form-reset" type="button" class="btn btn-secondary">Clear</button>
                    </div>
                </form>
            </div>

            <div class="panel-section">
                <h3>Existing Keys</h3>
                <div style="overflow-x: auto;">
                    <table class="key-table">
                        <thead>
                            <tr>
                                <th>Label</th>
                                <th>Status</th>
                                <th>Expires</th>
                                <th>Allowed</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="key-table-body">
                            <tr>
                                <td colspan="5" style="text-align: center; color: var(--color-text-muted); padding: 16px;">No keys yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <a href="https://github.com/leotrinh" target="_blank">
            <?php echo "&copy; " . date('Y') . " | Dev by Tình Leo"; ?>
        </a>
    </div>

    <!-- ACE Editor -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ace.js"></script>
    <script>
        // Initialize Ace Editor
        const editor = ace.edit('editor', {
            mode: 'ace/mode/json',
            selectionStyle: 'text',
            showPrintMargin: false,
            theme: 'ace/theme/chrome',
            fontSize: 14
        });

        // Theme Management
        const themeToggle = document.getElementById('theme-toggle');

        const savedTheme = localStorage.getItem('json-editor-theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.textContent = '☀️';
            editor.setTheme('ace/theme/textmate');
        } else {
            themeToggle.textContent = '🌙';
            editor.setTheme('ace/theme/monokai');
        }

        themeToggle.addEventListener('click', () => {
            const isLightMode = document.body.classList.toggle('light-mode');
            localStorage.setItem('json-editor-theme', isLightMode ? 'light' : 'dark');
            themeToggle.textContent = isLightMode ? '☀️' : '🌙';
            editor.setTheme(isLightMode ? 'ace/theme/textmate' : 'ace/theme/monokai');
        });

        // Logout (HTTP Basic Auth): overwrite cached credentials, then hit the
        // 401 logout page so the browser forgets them for this realm.
        document.getElementById('logout-button').addEventListener('click', () => {
            if (!confirm('Log out?')) return;
            fetch('./logout.php', { headers: { Authorization: 'Basic ' + btoa('logout:' + Date.now()) } })
                .catch(() => {})
                .finally(() => { window.location.href = './logout.php'; });
        });

        // Side Panel Management (open/close); data handled by assets/settings.js
        const settingsButton = document.getElementById('settings-button');
        const settingsPanel = document.getElementById('settings-panel');
        const settingsOverlay = document.getElementById('settings-overlay');
        const settingsClose = document.getElementById('settings-close');

        settingsButton.addEventListener('click', () => {
            settingsPanel.classList.add('open');
            settingsOverlay.classList.add('open');
        });
        function closeSettings() {
            settingsPanel.classList.remove('open');
            settingsOverlay.classList.remove('open');
        }
        settingsClose.addEventListener('click', closeSettings);
        settingsOverlay.addEventListener('click', closeSettings);

        // File Selection (searchable combobox)
        const fileSearch = document.getElementById('file-search');
        const fileDropdown = document.getElementById('file-dropdown');
        const fileWrapper = document.getElementById('file-select-wrapper');
        let allFiles = [];      // every available file name
        let selectedFile = '';  // currently selected file
        let activeIndex = -1;   // keyboard-highlighted option index
        const refreshButton = document.getElementById('refresh-button');
        const createButton = document.getElementById('create-button');
        const saveButton = document.getElementById('save-button');
        const deleteButton = document.getElementById('delete-button');
        const createFileName = document.getElementById('create-file-name');
        const apiLink = document.getElementById('api-link');
        const beautifyBtn = document.getElementById('beautify');
        const minifyBtn = document.getElementById('minify');
        const copyApiLink = document.getElementById('copy-api-link');
        const statusMessage = document.getElementById('status-message');

        const API_LOAD_JSON_ENDPOINT = `${window.location.href}api/json.php?target=`;
        const FILE_PREFIX_BEFORE = `<?php echo $filePrefixBefore; ?>`;

        // Utility: Show notification (exposed for settings.js)
        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
        window.showNotification = showNotification;

        // Utility: Update status
        function updateStatus(message, type = 'info') {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}`;
        }

        // Format JSON
        function formatJSON(spacing = 4) {
            try {
                const current = JSON.parse(editor.getValue());
                editor.setValue(JSON.stringify(current, null, spacing));
                editor.focus();
                updateStatus(`JSON ${spacing ? 'beautified' : 'minified'}`, 'success');
            } catch (err) {
                updateStatus('Invalid JSON', 'error');
                showNotification('Invalid JSON: ' + err.message, 'error');
            }
        }

        beautifyBtn.addEventListener('click', () => formatJSON(4));
        minifyBtn.addEventListener('click', () => formatJSON(0));

        // Load JSON file
        function loadJSON(fileName) {
            if (!fileName) return;
            updateStatus(`Loading ${fileName}...`);

            const xhr = new XMLHttpRequest();
            xhr.open('GET', './api/json.php?target=' + fileName, true);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        const jsonData = JSON.parse(xhr.responseText);
                        editor.setValue(JSON.stringify(jsonData, null, 4));
                        setAPILink(fileName);
                        updateStatus(`Loaded: ${fileName}`, 'success');
                    } catch (err) {
                        updateStatus('Failed to load JSON', 'error');
                        showNotification('Cannot load JSON: ' + err.message, 'error');
                    }
                } else {
                    updateStatus('Load error', 'error');
                }
            };
            xhr.send();
        }

        // Save JSON file
        function saveJSON(fileName, jsonContent) {
            try {
                JSON.parse(jsonContent);
            } catch (err) {
                updateStatus('Invalid JSON', 'error');
                showNotification('Cannot save invalid JSON', 'error');
                return;
            }

            updateStatus('Saving...');
            const xhr = new XMLHttpRequest();
            xhr.open('POST', './api/save_json.php?file=' + fileName, true);
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
            xhr.onload = function() {
                if (xhr.status === 200) {
                    updateStatus(`Saved: ${fileName}`, 'success');
                    showNotification(`${fileName} saved successfully`, 'success');
                } else {
                    updateStatus('Save failed', 'error');
                    showNotification('Error saving JSON', 'error');
                }
            };
            xhr.send(jsonContent);
        }

        // Create new JSON file (server prepends FILE_PREFIX_BEFORE)
        function createJSONFile(fileName) {
            updateStatus('Creating...');
            const xhr = new XMLHttpRequest();
            xhr.open('POST', './api/create_json.php?file=' + fileName, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function() {
                if (xhr.status === 200) {
                    createFileName.value = '';
                    const created = FILE_PREFIX_BEFORE + fileName;
                    updateStatus(`Created: ${created}`, 'success');
                    showNotification(`${created} created successfully`, 'success');
                    loadConfigs(created);
                } else {
                    updateStatus('Creation failed', 'error');
                    showNotification('Error creating file', 'error');
                }
            };
            xhr.send(JSON.stringify({}));
        }

        // Delete JSON file
        function deleteJSON(fileName) {
            const confirmed = confirm(`Delete ${fileName}? This cannot be undone.`);
            if (!confirmed) return;

            updateStatus('Deleting...');
            fetch('./api/delete_json.php?file=' + fileName, { method: 'DELETE' })
                .then(response => {
                    if (response.ok) {
                        updateStatus('Deleted', 'success');
                        showNotification(`${fileName} deleted`, 'success');
                        loadConfigs();
                    } else {
                        updateStatus('Delete failed', 'error');
                        showNotification('Error deleting file', 'error');
                    }
                })
                .catch(() => {
                    updateStatus('Delete error', 'error');
                    showNotification('Error deleting file', 'error');
                });
        }

        // Load config list into the searchable combobox
        function loadConfigs(preselect = null) {
            fetch('./api/list_json.php')
                .then(response => response.json())
                .then(configs => {
                    allFiles = Array.isArray(configs) ? configs : [];
                    if (!allFiles.length) {
                        selectedFile = '';
                        fileSearch.value = '';
                        updateStatus('No files found', 'info');
                        renderDropdown('');
                        return;
                    }
                    const toSelect = (preselect && allFiles.includes(preselect)) ? preselect : allFiles[0];
                    pickFile(toSelect);
                })
                .catch(() => {
                    updateStatus('Failed to load file list', 'error');
                });
        }

        // --- Searchable combobox -------------------------------------------
        // Render the dropdown filtered by query (case-insensitive substring).
        function renderDropdown(query) {
            const q = (query || '').toLowerCase();
            const matches = allFiles.filter(f => f.toLowerCase().includes(q));
            activeIndex = -1;
            fileDropdown.innerHTML = '';
            if (!matches.length) {
                fileDropdown.innerHTML = '<div class="file-option empty">No match</div>';
                return;
            }
            matches.forEach((f) => {
                const opt = document.createElement('div');
                opt.className = 'file-option' + (f === selectedFile ? ' selected' : '');
                opt.textContent = f;
                // mousedown (not click) so it fires before the input blur closes the list
                opt.addEventListener('mousedown', (e) => { e.preventDefault(); pickFile(f); });
                fileDropdown.appendChild(opt);
            });
        }

        function openDropdown() {
            renderDropdown(fileSearch.value === selectedFile ? '' : fileSearch.value);
            fileWrapper.classList.add('open');
        }
        function closeDropdown() {
            fileWrapper.classList.remove('open');
            activeIndex = -1;
        }

        // Select a file: update state, input, load it.
        function pickFile(fileName) {
            selectedFile = fileName;
            fileSearch.value = fileName;
            closeDropdown();
            loadJSON(fileName);
        }

        // Keyboard navigation within the open dropdown.
        function moveActive(delta) {
            const opts = fileDropdown.querySelectorAll('.file-option:not(.empty)');
            if (!opts.length) return;
            activeIndex = (activeIndex + delta + opts.length) % opts.length;
            opts.forEach((o, i) => o.classList.toggle('active', i === activeIndex));
            opts[activeIndex].scrollIntoView({ block: 'nearest' });
        }

        fileSearch.addEventListener('focus', openDropdown);
        fileSearch.addEventListener('input', () => { renderDropdown(fileSearch.value); fileWrapper.classList.add('open'); });
        fileSearch.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); openDropdownIfClosed(); moveActive(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
            else if (e.key === 'Enter') {
                e.preventDefault();
                const opts = fileDropdown.querySelectorAll('.file-option:not(.empty)');
                if (!opts.length) return;
                pickFile(opts[activeIndex >= 0 ? activeIndex : 0].textContent);
            } else if (e.key === 'Escape') {
                fileSearch.value = selectedFile;
                closeDropdown();
                fileSearch.blur();
            }
        });
        function openDropdownIfClosed() {
            if (!fileWrapper.classList.contains('open')) openDropdown();
        }
        // Close on click/focus outside the combobox.
        document.addEventListener('click', (e) => {
            if (!fileWrapper.contains(e.target)) {
                // restore the input text to the actual selection if abandoned mid-search
                if (fileSearch.value !== selectedFile) fileSearch.value = selectedFile;
                closeDropdown();
            }
        });

        // Set API link
        function setAPILink(fileName) {
            const url = API_LOAD_JSON_ENDPOINT + fileName;
            apiLink.textContent = url;
            apiLink.href = url;
        }

        // Copy API link
        copyApiLink.addEventListener('click', () => {
            const url = apiLink.href;
            if (!url || apiLink.textContent === 'Select a file') {
                showNotification('Select a file first', 'error');
                return;
            }
            navigator.clipboard.writeText(url)
                .then(() => {
                    copyApiLink.textContent = '✓ Copied';
                    setTimeout(() => { copyApiLink.innerHTML = '&#128203; Copy'; }, 2000);
                    showNotification('API link copied', 'success');
                })
                .catch(() => showNotification('Failed to copy', 'error'));
        });

        // Event Listeners
        refreshButton.addEventListener('click', () => loadConfigs(selectedFile));

        createButton.addEventListener('click', () => {
            const fileName = createFileName.value.trim();
            if (!fileName) {
                showNotification('Enter a file name', 'error');
                return;
            }
            if (!/^[a-zA-Z_]+$/.test(fileName)) {
                showNotification('Only letters and underscores allowed', 'error');
                return;
            }
            createJSONFile(fileName);
        });

        saveButton.addEventListener('click', () => {
            if (!selectedFile) {
                showNotification('Select a file first', 'error');
                return;
            }
            saveJSON(selectedFile, editor.getValue());
        });

        deleteButton.addEventListener('click', () => {
            if (!selectedFile) {
                showNotification('Select a file first', 'error');
                return;
            }
            deleteJSON(selectedFile);
        });

        // Initialize
        loadConfigs();
    </script>
    <script src="./assets/settings.js"></script>
</body>

</html>
