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
    <title><?php echo $appTitle ?? "Leo Admin Config"; ?></title>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0/css/bootstrap.css" />
    <link rel="stylesheet" href="./assets/style.css" />
</head>

<body>
    <div class="card">
        <div class="card-body">
            <div class="row">
                <div class="col-6">
                    <div class="row">
                        <div class="col-4">
                            <img src="<?php echo $appLogoPath; ?>" width="100px" />
                        </div>
                        <div class="col-7">
                            <h1>Online JSON</h1>
                        </div>
                        <div class="col-1">
                            <h3>V <?php echo $appVersion; ?></h3>
                        </div>
                    </div>

                    <hr />
                    <div class="row">
                        <div class="col-8">
                            <select class="dropdown form-select form-select-lg mb-3" aria-label=".form-select-lg example" id="json-file-select"></select>
                        </div>
                        <div class="col-4 text-right">
                            <button id="refresh-button" class="btn btn-secondary">RELOAD LIST</button>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="row">
                        <div class="col-12">
                            <p class="lead">Please check valid JSON using <a href="https://jsoneditoronline.org" target="_blank">https://jsoneditoronline.org </a> before saving data to avoid errors in your service</p>
                        </div>
                    </div>
                    <div class="row pt-3">
                        <div class="col-12">
                            <div class="input-group mb-3">
                                <input id="create-file-name" type="text" class="form-control" placeholder="Please aware that '<?php echo $filePrefixBefore; ?>' will auto append before the name" aria-label="Enter JSON name" aria-describedby="Enter JSON name">
                                <div class="input-group-append">
                                    <button id="create-button" class="btn btn-primary" type="button">Create NEW</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <hr />
            <div class="form-group">
                <div id="editorWrapper">
                    <div id="editor"></div>
                </div>
            </div>
            <div class="row">
                <div class="col-2">
                    <button class="btn btn-danger" id="delete-button">Delete</button>
                </div>
                <div class="col-2">
                    <a class="btn btn-warning" id="minify">Minify</a>
                </div>
                <div class="col-2">
                    <a class="btn btn-info" id="beautify">Beautify</a>
                </div>
                <div class="col-2">
                    <button class="btn btn-success" id="save-button">SAVE</button>
                </div>
                <div class="col-4">
                    API: <a id="api-link" href="" target="_blank"></a>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-12 text-center">

            <a class="text-reset fw-bold" href="https://github.com/leotrinh" target="_blank">
                <?php
                $currentYear = date('Y');
                echo "&copy; $currentYear" . " | Dev by Tình Leo";
                ?>
            </a>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.3.3/ace.js"></script>
    <script>
        const API_LOAD_JSON_ENDPOINT = `${window.location.href}api/json.php?target=`;
        const FILE_PREFIX_BEFORE = `<?php echo $filePrefixBefore; ?>`;
        //define global variable
        const oAceJSONEditor = ace.edit('editor', {
            mode: 'ace/mode/json',
            selectionStyle: 'text',
            showPrintMargin: false,
            theme: 'ace/theme/chrome'
        });

        // Load a list of JSON files
        const jsonFileSelect = document.getElementById('json-file-select');
        const refreshButton = document.getElementById('refresh-button');
        const createButton = document.getElementById('create-button');
        const saveButton = document.getElementById('save-button');
        const deleteButton = document.getElementById('delete-button');
        const jsonEditor = document.getElementById('json-editor');
        const createFileName = document.getElementById('create-file-name');
        const apiLink = document.getElementById('api-link');

        const LEO_KIT = {
            init: function() {
                //Init JSON Editor event
                oAceJSONEditor.on('paste', (event) => {
                    try {
                        event.text = JSON.stringify(JSON.parse(event.text), null, 4)
                    } catch (err) {
                        console.log("Init ACE JSON failed: ", err);
                        // meh
                    }
                });
                document.getElementById('minify').addEventListener('click', () => LEO_KIT.formatJsonContent());
                document.getElementById('beautify').addEventListener('click', () => LEO_KIT.formatJsonContent(4));

                //Init event handle for button
                jsonFileSelect.addEventListener('change', function() {
                    const selectedFile = jsonFileSelect.value;
                    LEO_KIT.loadJSON(selectedFile);
                });
                refreshButton.addEventListener('click', function() {
                    LEO_KIT.loadConfigs();
                });
                createButton.addEventListener('click', function() {
                    const fileName = createFileName.value;
                    if (!fileName || fileName.length == 0) {
                        alert("Please enter JSON Name");
                        return;
                    }
                    if (!LEO_KIT.isValidConfigName(fileName)) {
                        alert(`Please enter valid JSON Name  (allow UPPERCASE, UNDERSCORE only"). Example "CONFIG_DATA"`);
                        return;
                    }
                    LEO_KIT.createJSONFile(fileName);
                });
                saveButton.addEventListener('click', function() {
                    const selectedFile = jsonFileSelect.value;
                    const editedJSON = oAceJSONEditor.getValue();
                    if (!editedJSON || editedJSON.length == 0) {
                        alert("Content is empty");
                        return;
                    }

                    LEO_KIT.saveJSON(selectedFile, editedJSON);
                });
                deleteButton.addEventListener('click', function() {
                    const deleteFileName = jsonFileSelect.value;
                    if (!deleteFileName) {
                        alert("Something went wrong contact leo.trinh@conarum.com");

                    }
                    const confirmDeleteMsg = `Are you sure? We'll delete config: ${deleteFileName} and can not restore`;
                    const isConfirmDelete = confirm(confirmDeleteMsg);
                    if (isConfirmDelete) {
                        LEO_KIT.deleteSelectedFile(jsonFileSelect.value);
                    }

                });

                //Load default data
                LEO_KIT.loadConfigs();
            },
            formatJsonContent: function(spacing = 0) {
                try {
                    const current = JSON.parse(oAceJSONEditor.getValue())
                    oAceJSONEditor.setValue(JSON.stringify(current, null, spacing))
                    oAceJSONEditor.focus()
                    oAceJSONEditor.selectAll()
                    document.execCommand('copy')
                } catch (err) {
                    alert('ERROR: Unable to parse text as JSON')
                }
            },
            loadJSON: function(fileName) {

                console.log("Load Config:", fileName);
                const xhr = new XMLHttpRequest();
                xhr.open('GET', './api/json.php?target=' + fileName, true);
                xhr.onload = function() {
                    console.log("Load Json Status", xhr.status);
                    if (xhr.status === 200) {
                        try {
                            const jsonData = JSON.parse(xhr.responseText);
                            const jsonEditor = document.getElementById('editor');
                            console.log("edtittt", jsonEditor);
                            oAceJSONEditor.setValue(JSON.stringify(jsonData, null, 4));
                            LEO_KIT.setAPILink(fileName);
                        } catch (err) {
                            alert("Can not load JSON content! Please contact Admin");
                            console.log("Parse JSON failed: ", err);
                        }
                    }
                };
                xhr.send();
            },
            saveJSON: function(fileName, jsonContent) {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', './api/save_json.php?file=' + fileName, true);
                xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        alert(`Update ${fileName} successfully.`);
                    } else {
                        alert('Error saving JSON.');
                    }
                };
                xhr.send(jsonContent);
            },
            createJSONFile: function(fileName) {
                // Use AJAX to create a new JSON file
                var xhr = new XMLHttpRequest();
                xhr.open('POST', './api/create_json.php?file=' + fileName, true);
                xhr.setRequestHeader('Content-Type', 'application/json');

                xhr.onload = function() {
                    if (xhr.status === 200) {
                        console.log('New JSON file created successfully.');
                        createFileName.value = "";
                        // Reload the list of JSON files
                        LEO_KIT.loadConfigs(FILE_PREFIX_BEFORE + fileName);
                    } else {
                        console.error('Error creating JSON file.');
                    }
                };

                xhr.send(JSON.stringify({}));
            },
            deleteSelectedFile: function(selectedFileName) {
                // Send an AJAX request to delete the selected file
                fetch('./api/delete_json.php?file=' + selectedFileName, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (response.ok) {
                            console.log('File deleted successfully.');
                            LEO_KIT.loadConfigs(); // Refresh the select options after deletion
                        } else {
                            console.error('Error deleting file:', response.status);
                        }
                    })
                    .catch(error => console.error('Error deleting file:', error));

            },
            clearConfigList: function() {
                while (jsonFileSelect.firstChild) {
                    jsonFileSelect.removeChild(jsonFileSelect.firstChild);
                }
            },
            loadConfigs: function(defaultSelectFile) {
                LEO_KIT.clearConfigList();
                fetch('./api/list_json.php').then(response => response.json()).then(configs => {
                    if (!configs || configs.length == 0) {
                        return;
                    }
                    configs.forEach(fileName => {
                        const option = document.createElement('option');
                        option.value = fileName;
                        option.textContent = fileName;
                        jsonFileSelect.appendChild(option);
                    });
                    if (!defaultSelectFile) {
                        const firstConfig = configs[0]; //select first item
                        LEO_KIT.loadJSON(firstConfig);
                    } else {
                        LEO_KIT.loadJSON(defaultSelectFile);
                        jsonFileSelect.value = defaultSelectFile;
                    }

                });
            },
            isValidConfigName: function(config) {
                if (!config) {
                    return false;
                }
                // Regular expression pattern that matches only letters (uppercase and lowercase) and underscores
                const configPattern = /^[a-zA-Z_]+$/;
                return configPattern.test(config);
            },
            setAPILink: function(fileName) {
                apiLink.text = `${API_LOAD_JSON_ENDPOINT}${fileName}`;
                apiLink.href = `${API_LOAD_JSON_ENDPOINT}${fileName}`;
            }

        };
        LEO_KIT.init();
    </script>
</body>

</html>