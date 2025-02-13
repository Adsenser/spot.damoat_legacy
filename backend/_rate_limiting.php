<?php
require 'authentication/_db_connection.php';
function getClientIP() {
    if (isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
        // 클라우드플레어 프록시를 사용할 때
        return $_SERVER["HTTP_CF_CONNECTING_IP"];
    } elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // 리버스 프록시 또는 로드 밸런서를 사용할 때
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        // 기본적인 서버 IP 주소
        return $_SERVER['REMOTE_ADDR'];
    }
}

function checkRateLimit($conn, $ip) {
    $limit = 20; //  허용된 최대 요청 수
    $interval = 600; // 초 단위로 측정되는 간격

    // 현재 시간과 1분 전 시간을 구합니다.
    $currentTime = new DateTime(); // 현재 시간
    $startTime = (new DateTime())->sub(new DateInterval('PT' . $interval . 'S')); // 현재 시간에서 $interval 초 이전 시간

    // 데이터베이스에서 해당 IP의 최근 요청 기록을 조회합니다.
    $query = "SELECT COUNT(*) as request_count FROM request_log WHERE ip_address = ? AND timestamp BETWEEN ? AND ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("sss", $ip, $startTime->format('Y-m-d H:i:s'), $currentTime->format('Y-m-d H:i:s'));
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();

    if ($row['request_count'] > $limit) {
        return false; // 요청 한계를 초과했으므로 false를 반환
    }

    // 요청 로그를 기록합니다.
    $insert_query = "INSERT INTO request_log (ip_address, timestamp) VALUES (?, ?)";
    $insert_stmt = $conn->prepare($insert_query);
    $insert_stmt->bind_param("ss", $ip, $currentTime->format('Y-m-d H:i:s'));
    $insert_stmt->execute();

    return true; // 요청 한계를 초과하지 않았으므로 true를 반환
}

