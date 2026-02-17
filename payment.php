<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $action = $input['action'] ?? '';
    
    if ($action === 'confirm_payment') {
        confirmPayment($input);
    } elseif ($action === 'verify_payment') {
        verifyPayment($input);
    } elseif ($action === 'check_subscription') {
        checkSubscription($input);
    }
}

function confirmPayment($data) {
    $transactionId = $data['transaction_id'] ?? '';
    $plan = $data['plan'] ?? '';
    $userId = $data['user_id'] ?? '';
    
    if (empty($transactionId) || empty($plan) || empty($userId)) {
        handleError('Missing required fields');
    }
    
    $prices = [
        'monthly' => ['amount' => 49, 'days' => 30],
        'yearly' => ['amount' => 490, 'days' => 365]
    ];
    
    $payment = $prices[$plan];
    $validUntil = date('Y-m-d H:i:s', strtotime("+{$payment['days']} days"));
    
    // Insert payment record
    $paymentData = [
        'user_id' => $userId,
        'amount' => $payment['amount'],
        'currency' => 'INR',
        'payment_method' => 'UPI_MANUAL',
        'payment_id' => $transactionId,
        'upi_id' => 'jayantakumarkakati1999@oksbi',
        'status' => 'PENDING_VERIFICATION',
        'plan_type' => $plan,
        'valid_until' => $validUntil
    ];
    
    supabaseRequest('POST', 'payments', $paymentData, true);
    
    jsonResponse([
        'success' => true,
        'message' => 'Payment recorded. Verification pending.'
    ]);
}

function verifyPayment($data) {
    $transactionId = $data['transaction_id'] ?? '';
    $verified = $data['verified'] ?? false;
    
    if (empty($transactionId)) {
        handleError('Transaction ID required');
    }
    
    if ($verified) {
        // Update payment status
        supabaseRequest('PATCH', "payments?payment_id=eq.$transactionId", [
            'status' => 'SUCCESS',
            'verified_at' => date('Y-m-d H:i:s')
        ], true);
        
        // TODO: Upgrade user account
    }
    
    jsonResponse(['success' => true, 'message' => 'Payment verified']);
}

function checkSubscription($data) {
    $userId = $data['user_id'] ?? '';
    
    if (empty($userId)) {
        handleError('User ID required');
    }
    
    // Check user subscription status
    $user = supabaseRequest('GET', "users?id=eq.$userId&select=is_paid,subscription_end_date", true);
    
    jsonResponse(['success' => true, 'data' => $user[0] ?? null]);
}
?>
