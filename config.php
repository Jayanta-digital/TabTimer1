<?php
// PHP Configuration
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Enable CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Environment variables (create .env file or hardcode for now)
define('SUPABASE_URL', getenv('SUPABASE_URL') ?: 'https://tgpxefccobzlfyazqxwq.supabase.co');
define('SUPABASE_KEY', getenv('SUPABASE_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRncHhlZmNjb2J6bGZ5YXpxeHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTYxMTYsImV4cCI6MjA4Njg3MjExNn0.qaaxXMOHWAnEljal3Uh6FseKdo9ZDEHQ10JdrGAIw9c');
define('SUPABASE_SERVICE_KEY', getenv('SUPABASE_SERVICE_KEY') ?: 'YOUR_SUPABASE_SERVICE_KEY'); // ⚠️ Get from Supabase dashboard → Settings → API → service_role key

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_samesite', 'Strict');
session_start();

// CSRF token
function generateCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Sanitize input
function sanitize($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

// Response helper
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Error handler
function handleError($message, $code = 400) {
    jsonResponse(['success' => false, 'error' => $message], $code);
}

// Supabase HTTP client
function supabaseRequest($method, $endpoint, $data = null, $useServiceKey = false) {
    $url = SUPABASE_URL . '/rest/v1/' . $endpoint;
    $key = $useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_KEY;
    
    $options = [
        'http' => [
            'method' => $method,
            'header' => [
                'Content-Type: application/json',
                'apikey: ' . $key,
                'Authorization: Bearer ' . $key
            ]
        ]
    ];
    
    if ($data) {
        $options['http']['content'] = json_encode($data);
    }
    
    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    
    return json_decode($response, true);
}
?>
