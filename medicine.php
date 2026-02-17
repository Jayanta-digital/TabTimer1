<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

switch($method) {
    case 'GET':
        getMedicines();
        break;
    case 'POST':
        createMedicine($input);
        break;
    case 'PUT':
        updateMedicine($input);
        break;
    case 'DELETE':
        deleteMedicine($input);
        break;
    default:
        handleError('Method not allowed', 405);
}

function getMedicines() {
    $userId = $_GET['user_id'] ?? '';
    $role = $_GET['role'] ?? 'patient';
    
    if (empty($userId)) {
        handleError('User ID required');
    }
    
    // Query Supabase
    $filterField = $role === 'patient' ? 'patient_id' : 'caregiver_id';
    $medicines = supabaseRequest('GET', "medicines?$filterField=eq.$userId&status=eq.ACTIVE");
    
    jsonResponse(['success' => true, 'data' => $medicines]);
}

function createMedicine($data) {
    // Validate required fields
    $required = ['patient_id', 'caregiver_id', 'name', 'dosage', 'time', 'stock'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            handleError("Missing field: $field");
        }
    }
    
    // Insert into Supabase
    $result = supabaseRequest('POST', 'medicines', $data);
    
    jsonResponse(['success' => true, 'data' => $result]);
}

function updateMedicine($data) {
    if (empty($data['id'])) {
        handleError('Medicine ID required');
    }
    
    $id = $data['id'];
    unset($data['id']);
    
    $result = supabaseRequest('PATCH', "medicines?id=eq.$id", $data);
    
    jsonResponse(['success' => true, 'data' => $result]);
}

function deleteMedicine($data) {
    if (empty($data['id'])) {
        handleError('Medicine ID required');
    }
    
    // Soft delete
    $result = supabaseRequest('PATCH', "medicines?id=eq.{$data['id']}", ['status' => 'INACTIVE']);
    
    jsonResponse(['success' => true, 'message' => 'Medicine deleted']);
}
?>
