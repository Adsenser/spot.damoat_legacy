<?php
// 데이터베이스 연결 설정
$host = 'ipaddress+port';
$username = 'username';
$password = 'password';
$dbname = 'dbname';

// 데이터베이스 연결
$conn = new mysqli($host, $username, $password, $dbname);

// 연결 오류 확인
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>