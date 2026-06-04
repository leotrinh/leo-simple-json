<?php
/**
 * Logout for HTTP Basic Auth.
 *
 * Always returns 401 with a WWW-Authenticate challenge so the browser drops
 * the cached credentials for this realm. If the user dismisses the re-auth
 * dialog they land on this page; clicking "Log in again" re-triggers auth.
 */
header('HTTP/1.1 401 Unauthorized');
header('WWW-Authenticate: Basic realm="Restricted Area"');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Logged out</title>
    <style>
        body {
            margin: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background-color: #0f1419;
            color: #e4e6eb;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        a {
            color: #00d4ff;
            text-decoration: none;
            border: 1px solid #323843;
            padding: 10px 20px;
            border-radius: 6px;
            transition: all 0.2s;
        }
        a:hover {
            background-color: #00d4ff;
            color: #0f1419;
        }
    </style>
</head>
<body>
    <h2>You have been logged out</h2>
    <a href="./index.php">Log in again</a>
</body>
</html>
