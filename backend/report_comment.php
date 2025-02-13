<?php
require 'authentication/_cors.php';
require 'authentication/_db_connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 댓글 ID와 신고 사유 값을 $_POST 배열에서 추출
    // 댓글 ID 검증
    $commentId = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
    if ($commentId === null || $commentId === false) {
        die("올바르지 않은 댓글 식별자 입니다.");
    }
    // HTML 태그를 제거하고 신고 사유 처리
    $reportReason = strip_tags($_POST['reason'] ?? '');
    if (empty($reportReason) || mb_strlen($reportReason, 'UTF-8') > 100) {
        die("신고 사유가 올바르지 않거나 너무 깁니다.");
    }


    // 댓글의 신고 횟수와 마지막 신고 시간 조회
    $stmt = $conn->prepare("SELECT report_count, last_report_time FROM comments WHERE id = ?");
    $stmt->bind_param("i", $commentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $comment = $result->fetch_assoc();

    // 사용자 IP 주소
    $user_ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'];

    if ($comment && $reportReason) {
        // 마지막 신고 시간으로부터 5분이 경과했는지 확인
        $lastReportTime = strtotime($comment['last_report_time']);
        if (time() - $lastReportTime > 5 * 60) {
            // 신고 횟수 업데이트 및 마지막 신고 시간을 현재로 설정
            $updateStmt = $conn->prepare("UPDATE comments SET report_count = report_count + 1, last_report_time = NOW() WHERE id = ?");
            $updateStmt->bind_param("i", $commentId);
            $updateStmt->execute();

            // report_comment 테이블에 신고 사유 입력
            if ($updateStmt->affected_rows > 0) {
                $reportStmt = $conn->prepare("INSERT INTO report_comment (comment_id, report_reason, reporter_ip) VALUES (?, ?, ?)");
                $reportStmt->bind_param("iss", $commentId, $reportReason, $user_ip);
                $reportStmt->execute();

                if ($reportStmt->affected_rows > 0) {
                    echo "신고가 정상적으로 처리되었습니다.";
                } else {
                    echo "신고 처리 중 오류가 발생했습니다.";
                }
                $reportStmt->close();
            } else {
                echo "신고 처리 중 오류가 발생했습니다.";
            }

            $updateStmt->close();
        } else {
            echo "이미 다른 이용자가 신고한 댓글입니다.\n신고는 일정시간에 한번만 가능합니다.";
        }
    } else {
        echo "해당 댓글을 찾을 수 없거나 신고 사유가 전송되지 못했습니다.";
    }

    $stmt->close();
}


$conn->close();
?>
