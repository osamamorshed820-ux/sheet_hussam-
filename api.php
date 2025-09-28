<?php
// Enable CORS for cross-origin requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Data file path
$dataFile = 'data.json';

// Initialize data file if it doesn't exist
function initializeDataFile($file) {
    if (!file_exists($file)) {
        $initialData = [
            'inventory' => [
                ['category' => 'العمر 20-29', 'total' => 20, 'remaining' => 20],
                ['category' => 'العمر 30-40', 'total' => 30, 'remaining' => 30],
                ['category' => 'الدخل 401-500 (C2)', 'total' => 60, 'remaining' => 60],
                ['category' => 'الدخل 501-600 (C1)', 'total' => 41, 'remaining' => 41],
                ['category' => 'الدخل 601+ (A&B)', 'total' => 48, 'remaining' => 48],
                ['category' => 'نيدو', 'total' => 90, 'remaining' => 90],
                ['category' => 'حليبنا', 'total' => 29, 'remaining' => 29],
                ['category' => 'إنجوي', 'total' => 29, 'remaining' => 29]
            ],
            'transactions' => [],
            'lastUpdated' => date('Y-m-d H:i:s')
        ];
        file_put_contents($file, json_encode($initialData, JSON_PRETTY_PRINT));
    }
}

// Read data from file
function readData($file) {
    initializeDataFile($file);
    $data = json_decode(file_get_contents($file), true);
    return $data ?: ['inventory' => [], 'transactions' => [], 'lastUpdated' => date('Y-m-d H:i:s')];
}

// Write data to file
function writeData($file, $data) {
    $data['lastUpdated'] = date('Y-m-d H:i:s');
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

// Validate inventory to ensure remaining <= total
function validateInventory($inventory) {
    return array_map(function($item) {
        if ($item['remaining'] > $item['total']) {
            $item['remaining'] = $item['total'];
        }
        if ($item['remaining'] < 0) {
            $item['remaining'] = 0;
        }
        return $item;
    }, $inventory);
}

// Recalculate remaining quantities based on transactions
function recalculateRemainingQuantities($inventory, $transactions) {
    // Reset all remaining quantities to their total values
    $inventoryWithReset = array_map(function($item) {
        return [
            'category' => $item['category'],
            'total' => $item['total'],
            'remaining' => $item['total']
        ];
    }, $inventory);
    
    // Subtract quantities based on transactions
    foreach ($transactions as $transaction) {
        foreach ($inventoryWithReset as &$item) {
            if ($item['category'] === $transaction['category']) {
                $item['remaining'] = max(0, $item['remaining'] - 1);
            }
        }
    }
    
    return $inventoryWithReset;
}

// Handle API requests
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get all data
        $data = readData($dataFile);
        // Recalculate remaining quantities to ensure accuracy
        $data['inventory'] = recalculateRemainingQuantities($data['inventory'], $data['transactions']);
        $data['inventory'] = validateInventory($data['inventory']);
        writeData($dataFile, $data); // Save the recalculated data
        echo json_encode($data);
        break;
        
    case 'POST':
        // Add a transaction
        $input = json_decode(file_get_contents('php://input'), true);
        $categories = $input['categories'] ?? [];
        $notes = $input['notes'] ?? '';
        
        // Validate input
        if (empty($categories)) {
            http_response_code(400);
            echo json_encode(['error' => 'Categories are required']);
            exit;
        }
        
        // Read current data
        $data = readData($dataFile);
        
        // Add transactions for each category
        $timestamp = date('Y-m-d H:i:s');
        foreach ($categories as $category) {
            $transaction = [
                'category' => $category,
                'notes' => $notes,
                'timestamp' => $timestamp
            ];
            $data['transactions'][] = $transaction;
        }
        
        // Recalculate remaining quantities
        $data['inventory'] = recalculateRemainingQuantities($data['inventory'], $data['transactions']);
        $data['inventory'] = validateInventory($data['inventory']);
        
        // Save updated data
        if (writeData($dataFile, $data)) {
            echo json_encode(['message' => 'Transaction recorded successfully', 'data' => $data]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save transaction']);
        }
        break;
        
    case 'DELETE':
        // Delete transactions by timestamp
        if (!isset($_GET['timestamp'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Timestamp is required']);
            exit;
        }
        
        $timestamp = $_GET['timestamp'];
        
        // Read current data
        $data = readData($dataFile);
        
        // Find and remove transactions with this timestamp
        $transactionsToRemove = array_filter($data['transactions'], function($t) use ($timestamp) {
            return $t['timestamp'] === $timestamp;
        });
        
        $data['transactions'] = array_filter($data['transactions'], function($t) use ($timestamp) {
            return $t['timestamp'] !== $timestamp;
        });
        
        // Re-index array
        $data['transactions'] = array_values($data['transactions']);
        
        // Recalculate remaining quantities
        $data['inventory'] = recalculateRemainingQuantities($data['inventory'], $data['transactions']);
        $data['inventory'] = validateInventory($data['inventory']);
        
        // Save updated data
        if (writeData($dataFile, $data)) {
            echo json_encode([
                'message' => 'Transaction deleted successfully', 
                'removedTransactions' => count($transactionsToRemove)
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete transaction']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
?>