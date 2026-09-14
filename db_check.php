<?php
header('Content-Type: application/json');

$passwords = [
    'Xnj3*t%F36RDK+!',
    'Xnj3*t%F36RDK+! ',
    trim('Xnj3*t%F36RDK+!')
];

$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    $c = file_get_contents($envPath);
    if (preg_match('/DB_PASSWORD=(.*)/', $c, $m)) {
        $passwords[] = trim($m[1], " \t\n\r\0\x0B\"'");
    }
}

$results = [];

foreach ($passwords as $p) {
    $conn1 = @new mysqli('127.0.0.1', 'homef4fw_homefaci', $p, 'homef4fw_homefaci');
    if (!$conn1->connect_error) {
        $results[] = ['host' => '127.0.0.1', 'status' => 'SUCCESS', 'pass' => $p];
        $conn1->close();
        break;
    }
    
    $conn2 = @new mysqli('localhost', 'homef4fw_homefaci', $p, 'homef4fw_homefaci');
    if (!$conn2->connect_error) {
        $results[] = ['host' => 'localhost', 'status' => 'SUCCESS', 'pass' => $p];
        $conn2->close();
        break;
    }
    
    $results[] = ['host' => 'both', 'status' => 'FAILED', 'error' => $conn1->connect_error];
}

echo json_encode($results);
