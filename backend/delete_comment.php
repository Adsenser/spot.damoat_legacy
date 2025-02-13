<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);
require 'authentication/_cors.php';
require 'authentication/_db_connection.php';
include '_rate_limiting.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 이메일과 ID 값을 $_POST 배열에서 추출
    $email = $_POST['email'] ?? '';
    $id = $_POST['id'] ?? '';

    // Rate Limiting 확인
    if (!checkRateLimit($conn, getClientIP())) {
        die("요청 횟수가 너무 많습니다. 잠시 후 다시 시도하세요.");
        }

    // 입력값 검증
    if (!isset($id, $email) || strlen($email) > 30) {
        die("올바른 비밀번호 형식이 아닙니다.");
    }

    // 입력값 할당
    $commentId = $id; 
    
    // 데이터베이스에 저장된 해시된 이메일 조회
    $query = "SELECT email FROM comments WHERE id = ? LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $commentId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    // 데이터베이스에 저장된 해시된 이메일과 입력된 이메일이 일치하는지 확인
    if ($row && password_verify($email, $row['email'])) {
        // 이메일이 일치하면 댓글 삭제
        $deleteQuery = "DELETE FROM comments WHERE id = ?";
        $deleteStmt = $conn->prepare($deleteQuery);
        $deleteStmt->bind_param("i", $commentId);
        $deleteStmt->execute();
    
        if ($deleteStmt->affected_rows > 0) {
            echo "댓글이 삭제되었습니다.";
        } else {
            echo "삭제할 댓글이 없거나 비밀번호가 일치하지 않습니다.";
        }
    
        $deleteStmt->close();
    } else {
        echo "비밀번호가 일치하지 않습니다.";
    }
    
}


$stmt->close();
$conn->close();
?>