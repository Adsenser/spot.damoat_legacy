<?php
require 'authentication/_cors.php';
require 'authentication/_db_connection.php';


// 입력값 확인
$photo_id = isset($_GET['photo_id']) ? $conn->real_escape_string($_GET['photo_id']) : '';

// 데이터베이스에서 해당 photo_id의 정보를 조회
$query = "SELECT photo_name, photo_creator, DATE_FORMAT(created_at, '%Y-%m-%d') as created_at FROM photos WHERE photo_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $photo_id);
$stmt->execute();
$result = $stmt->get_result();

// 결과가 존재할 경우 JSON 형태로 반환
if ($row = $result->fetch_assoc()) {

    $cloudfront_base_url = 'https://cdn-spot.damoat.com/original/';

    // 서버의 파일 시스템 경로를 웹 URL 경로로 변환
    $row['photo_path'] = $cloudfront_base_url . $row['photo_name'];
    echo json_encode($row);
} else {
    echo json_encode(['error' => 'No photo found']);
}

// DB 연결 종료
$stmt->close();
$conn->close();
?>
