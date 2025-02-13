<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

require 'authentication/_cors.php';
require 'authentication/_db_connection.php';


// 댓글 저장 로직
// 댓글 저장 로직
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // reCAPTCHA 검증
    $recaptcha_secret = '{secret}';
    $recaptcha_response = $_POST['g-recaptcha-response'];

    // cURL을 사용하여 reCAPTCHA 검증 요청을 보냅니다.
    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => "https://www.google.com/recaptcha/api/siteverify",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'secret' => $recaptcha_secret,
            'response' => $recaptcha_response
        ])
    ]);

    $response = curl_exec($curl);
    $response_keys = json_decode($response, true);

    curl_close($curl);

    if ($response_keys["success"]) {
        // reCAPTCHA 검증 성공
        // 이후 로직 처리


        // 사용자 입력 검증 및 정화
        $coordinates = htmlspecialchars($_POST['coordinates'], ENT_QUOTES, 'UTF-8');
        $comment = htmlspecialchars($_POST['comment'], ENT_QUOTES, 'UTF-8');
        $user_name = htmlspecialchars(trim($_POST['user_name']), ENT_QUOTES, 'UTF-8');
        $user_email = htmlspecialchars(trim($_POST['user_email']), ENT_QUOTES, 'UTF-8');

        // 사용자 IP 주소
        $user_ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'];

        // 이메일 주소 해시
        $hashed_email = password_hash($user_email, PASSWORD_DEFAULT);

        // SQL 쿼리 준비
        $stmt = $conn->prepare("INSERT INTO comments (coordinates, user_ip, user_name, comment, email) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $coordinates, $user_ip, $user_name, $comment, $hashed_email);

        // 쿼리 실행
        if ($stmt->execute()) {
            echo "댓글이 저장되었습니다";
            // 'place' 테이블의 'last_updated_date' 업데이트
            $update_stmt = $conn->prepare("UPDATE place SET last_updated_date = CURDATE() WHERE coordinates = ?");
            $update_stmt->bind_param("s", $coordinates);

            if ($update_stmt->execute()) {
                echo " :)";
            } else {
                // 오류 메시지 자세함 제한
                echo "업데이트 중 오류가 발생했습니다.";
            }

            $update_stmt->close();
        } else {
            // 오류 메시지 자세함 제한
            echo "댓글 저장에 실패했습니다. 나중에 다시 시도해주세요.";
        }

        $stmt->close();
    } else {
        // reCAPTCHA 검증 실패
        echo "reCAPTCHA 검증에 실패했습니다. 다시 시도해주세요.";
    }
}


if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $coordinates = $_GET['coordinates'];

    // 총 댓글 수 계산
    $totalResult = $conn->query("SELECT COUNT(*) FROM comments WHERE coordinates = '$coordinates'");
    $totalCount = $totalResult->fetch_row()[0];

    // SQL 쿼리 실행 (페이징 제거), 생성날짜 포함
    $result = $conn->query("SELECT comment, created_at, user_name, id FROM comments WHERE coordinates = '$coordinates' ORDER BY created_at DESC");

    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $comments[] = $row;
    }

    // 총 댓글 수와 함께 댓글 데이터 반환
    echo json_encode(['total' => $totalCount, 'comments' => $comments]);
}

$conn->close();
?>