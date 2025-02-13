<?php
// 데이터베이스 설정
require '/volume1/Damoat_WEB/spot.damoat.com/authentication/_db_connection.php';

// 신고 수가 3회 이상인 댓글을 blind_comments 테이블에 저장
$insertBlindComments = "INSERT INTO blind_comments (comment_id, user_name, original_comment, user_ip)
                        SELECT id, user_name, comment, user_ip FROM comments WHERE report_count >= 3";

if ($conn->query($insertBlindComments) === TRUE) {
    echo "Blind comments inserted successfully.\n";
} else {
    echo "Error inserting blind comments: " . $conn->error . "\n";
}

// comments 테이블에서 신고 수가 3회 이상인 댓글의 내용 변경 및 신고 횟수 초기화
$updateComments = "UPDATE comments SET comment = '블라인드 처리된 후기입니다.', report_count = 0 WHERE report_count >= 3";

if ($conn->query($updateComments) === TRUE) {
    echo "Comments updated successfully.\n";
} else {
    echo "Error updating comments: " . $conn->error . "\n";
}

// 신고 수가 3회 이상인 사진을 blind_photos 테이블에 저장
$insertBlindPhotos = "INSERT INTO blind_photos (photo_id, user_name, user_ip, photo_name)
                        SELECT photo_id, photo_creator, user_ip, photo_name FROM photos WHERE report_count >= 3";

if ($conn->query($insertBlindPhotos) === TRUE) {
    echo "Blind Photos inserted successfully.\n";
} else {
    echo "Error inserting blind Photos: " . $conn->error . "\n";
}

// photos 테이블 업데이트
$updatePhotos = "UPDATE photos SET photo_name = 'blind_photo.png', report_count = 0 WHERE report_count >= 3";

if ($conn->query($updatePhotos) === TRUE) {
    echo "Photos updated successfully.\n";
} else {
    echo "Error updating photos: " . $conn->error . "\n";
}

// 연결 종료
$conn->close();
?>
