<?php
require '../authentication/_cors.php';
require '../authentication/_db_connection.php';

// JSON 데이터 수신 및 정화
$json = file_get_contents('php://input');
$data = json_decode($json);

// 데이터 정화
$recaptcha_response = htmlspecialchars($data->recaptcha_response);
$creator = htmlspecialchars($data->creator);
$creator_email = filter_var($data->creator_email, FILTER_SANITIZE_EMAIL);
$name = htmlspecialchars($data->name);
$external_link = htmlspecialchars($data->link);
$description = htmlspecialchars($data->description);
$place_type = htmlspecialchars($data->place_type);
$sector_type = htmlspecialchars($data->sector_type);
$latitude = filter_var($data->latitude, FILTER_VALIDATE_FLOAT);
$longitude = filter_var($data->longitude, FILTER_VALIDATE_FLOAT);

function isLatitudeValid($latitude) {
    return $latitude !== false && $latitude >= -90 && $latitude <= 90;
}

function isLongitudeValid($longitude) {
    return $longitude !== false && $longitude >= -180 && $longitude <= 180;
}

// 입력값 검증
if (!$creator_email) {
    echo json_encode(["status" => "error", "message" => "잘못된 이메일 주소입니다."]);
    exit;
}

if (!isLatitudeValid($latitude) || !isLongitudeValid($longitude)) {
    echo json_encode(["status" => "error", "message" => "올바른 좌표가 아닙니다."]);
    exit;
}

// 이메일 주소 해시
$hashed_email = password_hash($creator_email, PASSWORD_DEFAULT);

// cURL을 사용하여 reCAPTCHA 검증 요청을 보냅니다.
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://www.google.com/recaptcha/api/siteverify",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'secret' => '{secret}',
        'response' => $recaptcha_response
    ])
]);

$response = curl_exec($curl);
$response_keys = json_decode($response, true);
curl_close($curl);

if (!$response_keys["success"]) {
    echo json_encode(["status" => "error", "message" => "reCAPTCHA verification failed"]);
    exit;
}

$user_ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'];

// 위도와 경도를 소수점 다섯째 자리까지 포맷
$coordinates = sprintf("%.5f,%.5f", $latitude, $longitude);

// 데이터베이스에 데이터 삽입
$stmt = $conn->prepare("INSERT INTO place (creator, creator_email, name, description, user_ip, coordinates, place_type, sector, extra_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "가게 정보를 저장하는중에 오류가 발생했습니다."]);
    exit;
}
$stmt->bind_param("sssssssss", $creator, $hashed_email, $name, $description, $user_ip, $coordinates, $place_type, $sector_type, $external_link);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "성공적으로 제출되었습니다"]);
} else {
    // 오류 코드 확인
    if ($conn->errno == 1062) {
        echo json_encode(["status" => "error", "message" => "동일한 좌표로 이미 스팟이 존재합니다. 스팟 위치를 살짝 변경해주세요."]);
    } else {
        // 에러 메시지의 자세함을 제한
        echo json_encode(["status" => "error", "message" => "현재 스팟 정보를 저장할 수 없습니다."]);
    }
}

$stmt->close();
$conn->close();
?>
