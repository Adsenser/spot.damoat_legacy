<?php
require '../authentication/_cors.php';
require '../authentication/_db_connection.php';

// 좌표 데이터 검증
$pattern = '/^[0-9.,-]{1,20}$/';

if (isset($_POST['coordinates'])) {
    $coordinatesInput = $_POST['coordinates'];
    // 좌표 형식 검증 정규식
    if (preg_match($pattern, $coordinatesInput)) {
        // 좌표 데이터가 유효합니다. 데이터베이스 작업을 진행합니다.

        // place 테이블에서 정보 검색
        if ($stmt = $conn->prepare("SELECT name, creator, extra_link, description FROM place WHERE coordinates = ?")) {
            $stmt->bind_param("s", $coordinatesInput);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                $placeInfo = $result->fetch_assoc();
            } else {
                echo json_encode(['error' => '쿼리 실행에 실패했습니다.']);
                $stmt->close();
                exit;
            }
            $stmt->close();
        } else {
            echo json_encode(['error' => '쿼리 준비에 실패했습니다.']);
            exit;
        }

        // relation_photos_place 테이블에서 좌표에 해당하는 가장 작은 photo_id 검색
        if ($stmt = $conn->prepare("SELECT MIN(photo_id) AS photo_id FROM relation_photos_place WHERE coordinates = ?")) {
            $stmt->bind_param("s", $coordinatesInput);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                $photoId = $result->fetch_assoc()['photo_id'];
            } else {
                echo json_encode(['error' => '쿼리 실행에 실패했습니다.']);
                $stmt->close();
                exit;
            }
            $stmt->close();
        } else {
            echo json_encode(['error' => '쿼리 준비에 실패했습니다.']);
            exit;
        }

        // photos 테이블에서 photo_id에 해당하는 photo_name 검색
        if ($photoId && ($stmt = $conn->prepare("SELECT photo_name FROM photos WHERE photo_id = ?"))) {
            $stmt->bind_param("i", $photoId);
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                $photoName = $result->fetch_assoc()['photo_name'];
            } else {
                echo json_encode(['error' => '쿼리 실행에 실패했습니다.']);
                $stmt->close();
                exit;
            }
            $stmt->close();
        } else {
            $photoName = null;
        }

        // JSON 형식으로 결과 전송
        header('Content-Type: application/json');
        echo json_encode([
            'place' => $placeInfo,
            'photoName' => $photoName
        ]);

    } else {
        echo json_encode(['error' => '좌표 형식이 유효하지 않습니다.']);
    }
} else {
    echo json_encode(['error' => '좌표 데이터가 제공되지 않았습니다.']);
}

$conn->close();
?>
