<?php
require_once 'config.php';

// Payment gateway webhook handler
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

// Log webhook
file_put_contents('../logs/webhook.log', date('Y-m-d H:i:s') . ' - ' . $payload . "\n", FILE_APPEND);

// Verify webhook signature (implement based on payment gateway)
// Process payment update

jsonResponse(['success' => true, 'message' => 'Webhook received']);
?>
