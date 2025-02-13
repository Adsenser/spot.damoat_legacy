<?php
require '../authentication/_cors.php';
require '../authentication/_db_connection.php';
include '../_rate_limiting.php'; 

// 리캡챠 서버 사이드 검증
$recaptchaToken = htmlspecialchars($_POST['recaptchaToken']);
if (!verifyRecaptcha($recaptchaToken)) {
    exit('리캡챠 검증 실패');
}

// Rate Limiting 확인
if (!checkRateLimit($conn, getClientIP())) {
    die("요청 횟수가 너무 많습니다. 잠시 후 다시 시도하세요.");
    }

// SQL 인젝션 방지를 위한 데이터 준비
$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
$name = htmlspecialchars($_POST['name']);
$description = htmlspecialchars($_POST['description']);
$coordinates = htmlspecialchars($_POST['coordinates']);
$link = htmlspecialchars($_POST['link']);

// 이메일 검증
$stmt = $conn->prepare("SELECT creator_email FROM place WHERE coordinates = ?");
$stmt->bind_param("s", $coordinates);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if ($row && password_verify($email, $row['creator_email'])) {
    // 데이터 업데이트
    $update_stmt = $conn->prepare("UPDATE place SET name = ?, description = ?, extra_link = ?,renew_count = renew_count + 1, last_updated_date = NOW() WHERE coordinates = ?");
    $update_stmt->bind_param("ssss", $name, $description, $link ,$coordinates);
    if ($update_stmt->execute()) {
        echo "수정에 성공하였습니다.";
    } else {
        echo "수정에 실패하였습니다." ;
    }
    $update_stmt->close();
} else {
    echo "이메일 검증에 실패하였습니다.";
}

$stmt->close();
$conn->close();

function verifyRecaptcha($token) {
    $secret = '6LcB8rApAAAAAGl8-uYL6SuVgipoWQomIXaTVuoy';
    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => "https://www.google.com/recaptcha/api/siteverify",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'secret' => $secret,
            'response' => $token
        ])
    ]);

    $response = curl_exec($curl);
    $responseKeys = json_decode($response, true);
    curl_close($curl);

    return $responseKeys["success"];
}
?>
