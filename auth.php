<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'POST':
        $action = $input['action'] ?? '';
        
        if ($action === 'signup') {
            signup($input);
        } elseif ($action === 'login') {
            login($input);
        } elseif ($action === 'logout') {
            logout();
        } elseif ($action === 'reset_password') {
            resetPassword($input);
        }
        break;
        
    default:
        handleError('Method not allowed', 405);
}

function signup($data) {
    // Validate input
    if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
        handleError('Missing required fields');
    }
    
    // This would integrate with Supabase Auth
    // For now, return success
    jsonResponse([
        'success' => true,
        'message' => 'User created successfully',
        'user' => [
            'id' => uniqid(),
            'email' => $data['email'],
            'name' => $data['name'],
            'role' => $data['role'] ?? 'patient'
        ]
    ]);
}

function login($data) {
    if (empty($data['email']) || empty($data['password'])) {
        handleError('Missing credentials');
    }
    
    // This would verify with Supabase
    jsonResponse([
        'success' => true,
        'user' => [
            'id' => uniqid(),
            'email' => $data['email'],
            'name' => 'Test User',
            'role' => 'caregiver'
        ],
        'token' => bin2hex(random_bytes(32))
    ]);
}

function logout() {
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'Logged out']);
}

function resetPassword($data) {
    if (empty($data['email'])) {
        handleError('Email required');
    }
    
    jsonResponse(['success' => true, 'message' => 'Password reset email sent']);
}
?>
