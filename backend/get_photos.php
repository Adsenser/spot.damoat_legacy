<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);
require 'authentication/_cors.php';
require 'authentication/_db_connection.php';

// 입력값 확인 및 초기화
$coordinates = isset($_GET['coordinates']) ? $conn->real_escape_string($_GET['coordinates']) : '';

// relation_photos_place와 photos 테이블을 조인하여 해당 좌표에 대한 사진 경로 정보 가져오기 + 사진 아이디
$query = "SELECT p.photo_id, p.photo_name
          FROM relation_photos_place AS rpp
          JOIN photos AS p ON rpp.photo_id = p.photo_id
          WHERE rpp.coordinates = ?
          ORDER BY p.photo_id DESC";

$stmt = $conn->prepare($query);

// 바인드 파라미터 설정
$stmt->bind_param("s", $coordinates);

// 쿼리 실행
$stmt->execute();

// 결과 가져오기
$result = $stmt->get_result();
$photos = [];

while ($row = $result->fetch_assoc()) {

    $thumbnail_base_url = 'https://cdn-spot.damoat.com/thumbnail/';
    // 서버의 파일 시스템 경로를 웹 URL 경로로 변환
    $relativeThumbnailPath = $thumbnail_base_url. $row['photo_name'];
    
    $photos[] = [
        'thumbnail_path' => $relativeThumbnailPath,
        'photo_id' => $row['photo_id']
    ];
}

// JSON 형태로 클라이언트에 데이터 반환
header('Content-Type: application/json');
echo json_encode(['photos' => $photos]);



// 연결 종료
$stmt->close();
$conn->close();
?>
