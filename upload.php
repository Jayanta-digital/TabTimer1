<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    handleError('Method not allowed', 405);
}

if (empty($_FILES['file'])) {
    handleError('No file uploaded');
}

$file = $_FILES['file'];
$userId = $_POST['user_id'] ?? '';
$type = $_POST['type'] ?? 'voice';

// Validate file
$allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'image/jpeg', 'image/png'];
if (!in_array($file['type'], $allowedTypes)) {
    handleError('Invalid file type');
}

// Check file size (max 5MB)
if ($file['size'] > 5 * 1024 * 1024) {
    handleError('File too large. Max 5MB');
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid() . '_' . time() . '.' . $extension;
$uploadDir = '../uploads/';

// Create upload directory if not exists
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
    jsonResponse([
        'success' => true,
        'filename' => $filename,
        'url' => '/uploads/' . $filename,
        'type' => $file['type']
    ]);
} else {
    handleError('Upload failed');
}
?>
