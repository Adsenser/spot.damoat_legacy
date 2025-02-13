<?php
// https://spot.damoat.com
// header('Access-Control-Allow-Origin: https://spot.damoat.com');
// header('Access-Control-Allow-Methods: GET,POST,OPTIONS');
// header('Access-Control-Allow-Headers: *');

$allowed_domains = ['https://spot.damoat.com'];
// $allowed_domains = ['https://spot.damoat.com'];

if (isset($_SERVER['HTTP_ORIGIN'])) {
    // 요청이 허용된 도메인 중 하나에서 왔는지 확인
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_domains)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    }
}

header('Access-Control-Allow-Methods: GET,POST,OPTIONS');
header('Access-Control-Allow-Headers: *');

?>
