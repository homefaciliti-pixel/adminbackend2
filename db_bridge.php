<?php
/**
 * HomeFaciliti Ultra-Robust Secure Database HTTPS Bridge
 * Integrates directly with Laravel framework DB facade for 100% guaranteed zero-configuration connection.
 */
ob_start();
error_reporting(0);
ini_set('display_errors', '0');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Bridge-Secret');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(200);
    exit;
}

$SECURITY_KEY = 'HF_SECURE_KEY_2026_x92!';
$incomingKey = isset($_SERVER['HTTP_X_BRIDGE_SECRET']) ? $_SERVER['HTTP_X_BRIDGE_SECRET'] : '';

if ($incomingKey !== $SECURITY_KEY) {
    ob_end_clean();
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized Access']);
    exit;
}

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!$data || empty($data['sql'])) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing SQL query payload']);
    exit;
}

// Bootstrap Laravel Framework to use exact active website DB connection
$baseDir = dirname(__DIR__);
if (!file_exists($baseDir . '/vendor/autoload.php')) {
    $baseDir = __DIR__;
}

try {
    if (file_exists($baseDir . '/vendor/autoload.php')) {
        require_once $baseDir . '/vendor/autoload.php';
        $app = require_once $baseDir . '/bootstrap/app.php';
        $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();
        
        $sql = $data['sql'];
        $params = isset($data['params']) && is_array($data['params']) ? $data['params'] : [];
        
        if (preg_match('/^\s*(SELECT|SHOW|DESCRIBE|EXPLAIN)/i', $sql)) {
            $rows = \Illuminate\Support\Facades\DB::select($sql, $params);
            $rowsArray = json_decode(json_encode($rows), true);
            $response = ['success' => true, 'rows' => $rowsArray];
        } else {
            $affected = \Illuminate\Support\Facades\DB::affectingStatement($sql, $params);
            $response = ['success' => true, 'affectedRows' => $affected];
        }
        
        $jsonOutput = json_encode($response);
        ob_end_clean();
        echo $jsonOutput;
        exit;
    }
} catch (\Throwable $e) {
    // Fallback if framework bootstrap is bypassed
}

// Fallback mysqli connection if framework bootstrap is bypassed
$dbHost = '127.0.0.1';
$dbUser = 'homef4fw_homefaci';
$dbPass = base64_decode('WG5qMyp0JUYzNlJESysh');
$dbName = 'homef4fw_homefaci';

$conn = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($conn->connect_error) {
    $conn = @new mysqli('localhost', $dbUser, $dbPass, $dbName);
}

if ($conn->connect_error) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$conn->set_charset('utf8mb4');
$sql = $data['sql'];
$params = isset($data['params']) && is_array($data['params']) ? $data['params'] : [];

$stmt = $conn->prepare($sql);
if (!$stmt) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Prepare: ' . $conn->error]);
    $conn->close();
    exit;
}

if (!empty($params)) {
    $types = '';
    $bindValues = [];
    foreach ($params as $param) {
        if (is_int($param)) $types .= 'i';
        elseif (is_double($param) || is_float($param)) $types .= 'd';
        else $t .= 's';
        $bindValues[] = $param;
    }
    $stmt->bind_param($types, ...$bindValues);
}

if (!$stmt->execute()) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Execute: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}

$result = $stmt->get_result();
if ($result === false) {
    $response = ['success' => true, 'affectedRows' => $stmt->affected_rows, 'insertId' => $stmt->insert_id];
} else {
    $rows = $result->fetch_all(MYSQLI_ASSOC);
    $response = ['success' => true, 'rows' => $rows];
    $result->free();
}

$stmt->close();
$conn->close();

$jsonOutput = json_encode($response);
ob_end_clean();
echo $jsonOutput;
exit;
