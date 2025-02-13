<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);
require 'authentication/_cors.php';
require 'authentication/_db_connection.php';


if (isset($_GET['coordinates'])) {
    // 특정 좌표에 대한 상세 정보 요청 처리
    $coordinates = $conn->real_escape_string($_GET['coordinates']);
    $query = "SELECT name, description, creator, DATE_FORMAT(created_at, '%Y-%m') as created_at, renew_count, extra_link FROM place WHERE coordinates = '$coordinates'";
    $result = $conn->query($query);

    if ($result->num_rows > 0) {
        $details = $result->fetch_assoc();
        header('Content-Type: application/json');
        echo json_encode($details);
    } else {
        echo json_encode([]);
    }
} else {
    // 초기 데이터 로딩 요청 처리
    $query = "SELECT coordinates, place_type FROM place";
    $result = $conn->query($query);

    $locations = [];
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            list($latitude, $longitude) = explode(',', $row['coordinates']);
            $locations[] = [
                'lat' => (float)$latitude,
                'lng' => (float)$longitude, 
                'place_type' => (int)$row['place_type']
            ];
        }
        header('Content-Type: application/json');
        echo json_encode($locations);
    } else {
        echo json_encode([]);
    }
}

// 데이터베이스 연결 종료
$conn->close();
?>
