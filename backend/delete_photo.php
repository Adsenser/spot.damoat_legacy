<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

//필요 함수 정의
require 'authentication/_cors.php';
require 'authentication/_db_connection.php';
include '_rate_limiting.php'; 
require 'authentication/_s3client.php'; 

// 입력값 확인 및 초기화
$photo_id = isset($_POST['photo_id']) ? $_POST['photo_id'] : '';
$user_email = isset($_POST['email']) ? $_POST['email'] : '';

// Rate Limiting 확인
if (!checkRateLimit($conn, getClientIP())) {
    die("요청 횟수가 너무 많습니다. 잠시 후 다시 시도하세요.");
}

// 입력값 검증
if (empty($photo_id) || empty($user_email)) {
    die("필수 입력값이 누락되었습니다.");
}

// 해당 photo_id의 creator_email 가져오기
$query = "SELECT creator_email, photo_name FROM photos WHERE photo_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $photo_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $creator_email_hash = $row['creator_email'];
    $thumbnail_path = '/volume1/Damoat_WEB/spot.damoat.com/user_photos/thumbnail/' . $row['photo_name'];

    // S3 버킷 내 파일 경로 추출
    $photo_path_s3 = $row['photo_name'];

    // 이메일 해시 검증
    if (password_verify($user_email, $creator_email_hash)) {
        // 사진 파일 삭제
        //썸네일 이미지
        
        $s3Client = getS3Client(); // S3 클라이언트 인스턴스 생성
        $keyToRemove = 'thumbnail/'.$photo_path_s3;

        try {
            $s3Client->deleteObject([
                'Bucket' => '{bucket-name}', // S3 버킷 이름
                'Key' => $keyToRemove, // S3 객체 키
            ]);
        } catch (Aws\S3\Exception\S3Exception $e) {
            echo "사진을 삭제하는데 실패했습니다. 블라인드된 사진은 수동으로 삭제할 수 없습니다. " ;
            exit;
        }
        
        
        // S3 버킷에서 원본 사진 삭제
        $s3Client = getS3Client(); // S3 클라이언트 인스턴스 생성
        $keyToRemove = 'original/'.$photo_path_s3;

        try {
            $s3Client->deleteObject([
                'Bucket' => '{bucket-name}', // S3 버킷 이름
                'Key' => $keyToRemove, // S3 객체 키
            ]);
        } catch (Aws\S3\Exception\S3Exception $e) {
            echo "사진을 삭제하는데 실패했습니다. 블라인드된 사진은 수동으로 삭제할 수 없습니다. " ;
            exit;
        }

        // photos 테이블에서 해당 photo_id의 사진 경로 값 제거
        $update_query = "UPDATE photos SET photo_name = NULL WHERE photo_id = ?";
        $update_stmt = $conn->prepare($update_query);
        $update_stmt->bind_param("i", $photo_id);
        $update_stmt->execute();

        // relation_photos_place에서 해당 photo_id의 행 삭제
        $delete_query = "DELETE FROM relation_photos_place WHERE photo_id = ?";
        $delete_stmt = $conn->prepare($delete_query);
        $delete_stmt->bind_param("i", $photo_id);
        $delete_stmt->execute();

        echo "사진이 삭제되었습니다.";
    } else {
        echo "비밀번호가 일치하지 않습니다.";
    }
} else {
    echo "해당 사진을 찾을 수 없습니다.";
}

// 연결 종료
$stmt->close();
$conn->close();
?>
