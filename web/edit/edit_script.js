// URL에서 쿼리 스트링 파싱
var queryParams = new URLSearchParams(window.location.search);
// 'coordinates' 파라미터 값 얻기
var coordinates = queryParams.get('coordinates');

// 지도 초기화
var map = L.map('map', {
  zoomControl: false // 확대/축소 컨트롤을 비활성화
}).setView(coordinates.split(','), 18);


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: 'OpenStreetMap'
}).addTo(map);

// URL에서 가져온 좌표에 마커 추가
var marker = L.marker(coordinates.split(',')).addTo(map);

function submitData(event) {
  event.preventDefault(); // 폼의 기본 제출 동작 중지

  var queryParams = new URLSearchParams(window.location.search);
  var coordinates = queryParams.get('coordinates');

  // 폼 데이터 가져오기
  var email = document.getElementById('creator_email').value;
  var name = document.getElementById('name').value;
  var description = document.getElementById('description').value;
  var link = document.getElementById('link').value;
  var recaptchaToken = grecaptcha.getResponse(); 

  // 리캡챠 토큰 검증
  if (!recaptchaToken) {
    alert('리캡챠를 완료해주세요.');
    return;
  }

  // 서버로 전송할 데이터 준비
  var formData = new FormData();
  formData.append('email', email);
  formData.append('name', name);
  formData.append('description', description);
  formData.append('recaptchaToken', recaptchaToken); 
  formData.append('coordinates', coordinates);
  formData.append('link', link);

  // 서버로 POST 요청 보내기
  fetch('https://api-spot.damoat.com/edit/edit.php', {
    method: 'POST',
    body: formData
  })
  .then(response => response.text())
  .then(data => {
    // 서버 응답 처리
    
      alert(data);
    
  })
  .catch(error => {
    console.error('오류가 발생했습니다:', error);
  });
  

  // 리캡챠 토큰 초기화
  grecaptcha.reset();
}

// 페이지 로드시 지도에 마커를 추가하는 함수 실행
document.addEventListener('DOMContentLoaded', function() {
  // 좌표 파라미터가 있는지 확인하고 지도에 표시
  if (coordinates) {
    var coordsArray = coordinates.split(',');
    map.setView(new L.LatLng(coordsArray[0], coordsArray[1]), 13);
    marker.setLatLng(coordsArray);
  } else {
    console.error('좌표 정보가 없습니다.');
  }
});
