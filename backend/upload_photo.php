<?php
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

// 필요한 함수 정의
require 'authentication/_cors.php';
require 'authentication/_s3client.php'; 

function generateRandomString($length = 5)
{
    $characters = '0123456789';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}




// 파일 업로드 수신 및 초기 응답 전송
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Turnstile 검증 토큰 수신
    $turnstileResponse = htmlspecialchars($_POST['cf-turnstile-response']);

    // cURL을 사용하여 Turnstile 검증 요청
    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'secret' => '{secret}',
            'response' => $turnstileResponse
        ]),
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/x-www-form-urlencoded"
        ]
    ]);

    $response = curl_exec($curl);
    $responseData = json_decode($response, true);

    curl_close($curl);

    // 검증 결과 확인
    if (!$responseData['success']) {
        echo json_encode(['success' => false, 'error' => 'CAPTCHA validation failed']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => 'File uploaded successfully']);




    // 2. 파일 검사 (확장자, MIME 유형 등)
    $file = $_FILES['file'];
    $fileType = mime_content_type($file['tmp_name']);
    if (!in_array($fileType, ['image/jpeg'])) {
        // 파일 유형이 지원되지 않음
        exit;
    }

    // 3. 파일명 변경
    $randomNumber = generateRandomString();
    $newFileName = date('Y-m-d-H-i-s') . '-' . $randomNumber;

    // 4. 워터마크 삽입  ->일시중지
    if ($fileType === 'image/jpeg') {
        $image = imagecreatefromjpeg($file['tmp_name']);
    } elseif ($fileType === 'image/png') {
        $image = imagecreatefrompng($file['tmp_name']);
    }
    

    // 5. WebP 변환
    $webpPath = '/volume1/Damoat_WEB/spot.damoat.com/user_photos/original/' . $newFileName . '.webp';
    // 이미지를 저장
    imagewebp($image, $webpPath);

    // 6. 썸네일용 이미지 생성
    $thumbnailPath = '/volume1/Damoat_WEB/spot.damoat.com/user_photos/thumbnail/' . $newFileName . '.webp';
    $thumbnailMaxSize = 300;

    // WebP 이미지를 읽어옴
    $webpImage = imagecreatefromwebp($webpPath);

    // 원본 이미지의 너비와 높이를 구함
    $originalWidth = imagesx($webpImage);
    $originalHeight = imagesy($webpImage);

    // 썸네일의 너비와 높이를 계산
    $thumbnailWidth = $thumbnailMaxSize;
    $thumbnailHeight = ($originalHeight / $originalWidth) * $thumbnailMaxSize;

    // 썸네일 크기로 새 캔버스 생성
    $thumbnail = imagecreatetruecolor($thumbnailWidth, $thumbnailHeight);

    // 썸네일 이미지 생성
    imagecopyresampled($thumbnail, $webpImage, 0, 0, 0, 0, $thumbnailWidth, $thumbnailHeight, $originalWidth, $originalHeight);

    // 썸네일 이미지를 파일로 저장
    imagewebp($thumbnail, $thumbnailPath);

    // 썸네일 이미지 리소스 해제
    imagedestroy($thumbnail);
    // 이미지 리소스 해제
    imagedestroy($image);
    
    // S3에 썸네일 이미지 업로드
    $s3Client = getS3Client(); // s3client.php에서 정의된 함수
    $bucketName = '{bucket-name}'; 
    $s3KeyOriginal = 'thumbnail/' . $newFileName . '.webp';

    try {
        $result = $s3Client->putObject([
            'Bucket' => $bucketName,
            'Key' => $s3KeyOriginal,
            'SourceFile' => $thumbnailPath,
            
        ]);
        // 업로드된 이미지의 URL을 얻습니다.
        $s3Url = $result['ObjectURL'];
    } catch (AwsException $e) {
        // 오류 처리
        error_log("썸네일 이미지를 저장하는데 실패하였습니다.");
        
        exit;
    }
	
	// S3에 원본 이미지 업로드
    $s3Client = getS3Client(); // s3client.php에서 정의된 함수
    $bucketName = '{bucket-name}'; 
    $s3KeyOriginal = 'original/' . $newFileName . '.webp';

    try {
        $result = $s3Client->putObject([
            'Bucket' => $bucketName,
            'Key' => $s3KeyOriginal,
            'SourceFile' => $webpPath,
            
        ]);
        // 업로드된 이미지의 URL을 얻습니다.
        $s3Url = $result['ObjectURL'];
    } catch (AwsException $e) {
        // 오류 처리
        error_log("고화질 이미지를 저장하는데 실패하였습니다.");
        
        exit;
    }

    

    // 로컬 서버에 저장된 원본 이미지 삭제
    unlink($webpPath);
    unlink($thumbnailPath);

    // DB 연결 및 저장 로직...
    require 'authentication/_db_connection.php';

    // 데이터베이스에 파일 정보 저장
    $email = htmlspecialchars($_POST['email']);
    $nickname = htmlspecialchars($_POST['nickname']);
    $coordinates = htmlspecialchars($_POST['coordinates']);

    // 파일명을 변수에 저장
    $photoName = $newFileName . '.webp';

    // 이메일 주소 해시
    $hashed_email = password_hash($email, PASSWORD_DEFAULT);

    // 아이피주소
    $user_ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'];

    // photos 테이블에 파일 정보 저장
    $stmt = $conn->prepare("INSERT INTO photos (photo_name, photo_creator, creator_email, user_ip) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $photoName, $nickname, $hashed_email, $user_ip);
    $stmt->execute();

    // 마지막으로 삽입된 photo_id 가져오기
    $photoId = $conn->insert_id;

    // relation_photos_place 테이블에 관계 데이터 저장
    $stmt = $conn->prepare("INSERT INTO relation_photos_place (photo_id, coordinates) VALUES (?, ?)");
    $stmt->bind_param("is", $photoId, $coordinates);
    $stmt->execute();

    // place 테이블의 last_updated_date 업데이트
    $update_stmt = $conn->prepare("UPDATE place SET last_updated_date = CURDATE() WHERE coordinates = ?");
    $update_stmt->bind_param("s", $coordinates);

    if ($update_stmt->execute()) {

    } else {
        // 아무 정보도 주지 말기
    }

    $update_stmt->close();

    // DB 연결 종료
    $stmt->close();
    $conn->close();

}
?>
