<?php
require 'authentication/_cors.php';
require 'authentication/_db_connection.php';

// 입력값 확인 및 초기화
$coordinates = isset($_GET['coordinates']) ? $conn->real_escape_string($_GET['coordinates']) : '';

// relation_photos_place 테이블에서 해당 좌표의 사진 개수 가져오기
$query = "SELECT COUNT(*) AS photo_count
          FROM relation_photos_place
          WHERE coordinates = ?";

$stmt = $conn->prepare($query);

// 바인드 파라미터 설정
$stmt->bind_param("s", $coordinates);

// 쿼리 실행
$stmt->execute();

// 결과 가져오기
$result = $stmt->get_result();
$row = $result->fetch_assoc();

// JSON 형태로 클라이언트에 데이터 반환
header('Content-Type: application/json');
echo json_encode(['photo_count' => $row['photo_count']]);

// 연결 종료
$stmt->close();
$conn->close();
?>
