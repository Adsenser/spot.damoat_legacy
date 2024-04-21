var map;
var currentMarker; // 현재 마커를 저장할 전역 변수

function initMap() {
  map = L.map("map").setView([37.5519, 126.9918], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    minZoom: 2,
    attribution: "OpenStreetMap",
  }).addTo(map);

  // 지도 이동 범위 제한
   var worldBounds = [
     [-60, -180], 
     [90, 180], 
   ];
   map.setMaxBounds(worldBounds);

  // 현재 위치로 이동하는 버튼 추가
  addLocationButton();

  // 검색 버튼 추가
  addSearchButton();

  map.on("click", function (e) {
    // 기존 마커가 있으면 제거
    if (currentMarker) {
      map.removeLayer(currentMarker);
    }

    // 소수점 n번째 자리까지의 좌표 값
    var lat = parseFloat(e.latlng.lat.toFixed(5));
    var lng = parseFloat(e.latlng.lng.toFixed(5));

    selectedLocation = { lat: lat, lng: lng };

    // 새로운 위치에 마커를 생성합니다.
    currentMarker = L.marker([
      selectedLocation.lat,
      selectedLocation.lng,
    ]).addTo(map);

    document.getElementById('coordinationCheckLat').innerText = selectedLocation.lat;
    document.getElementById('coordinationCheckLng').innerText = selectedLocation.lng ;

  });
}

function submitData(event) {
  event.preventDefault(); // 폼의 기본 제출 동작 중단

  if (typeof selectedLocation === "undefined") {
    alert("지도에서 위치를 선택해주세요.");
    return;
  }

  var form = document.getElementById("inputForm");
  if (!form.checkValidity()) {
    form.reportValidity(); // 유효하지 않은 경우, 브라우저 기본 유효성 메시지 표시
    return;
  }

  var recaptchaResponse = grecaptcha.getResponse();

  // reCAPTCHA 응답이 없는 경우
  if (recaptchaResponse.length === 0) {
    alert("reCAPTCHA를 확인해주세요.");
    return;
  }

  var data = {
    creator: document.getElementById("creator").value,
    creator_email: document.getElementById("creator_email").value,
    name: document.getElementById("name").value,
    link: document.getElementById("link").value,
    description: document.getElementById("description").value,
    place_type: document.getElementById("placeDropdown").value,
    sector_type: document.getElementById("sectorDropdown").value,
    latitude: selectedLocation.lat,
    longitude: selectedLocation.lng,
    recaptcha_response: recaptchaResponse,
  };

  fetch("https://api-spot.damoat.com/submit/submit.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json()) // JSON 형식의 응답을 기대함
    .then((responseJson) => {
      if (responseJson.status === "success") {
        alert("성공적으로 제출되었습니다.");
        window.location.reload(); // 성공 후 페이지 새로고침
      } else {
        alert("오류 발생: " + responseJson.message); // 변경된 부분: 서버 응답에서 메시지를 읽어옴
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("오류 발생: " + error.message);
    });
}


//description 최대 줄바꿈 개수 제한
document.addEventListener('DOMContentLoaded', function () {
  // descriptionTextarea에 input 이벤트 리스너를 추가
  var descriptionTextarea = document.getElementById('description');
  descriptionTextarea.addEventListener('input', function () {
    var lines = this.value.split('\n');
    if (lines.length > 25) { // 최대 줄바꿈 수.
      this.value = lines.slice(0, 25).join('\n');
    }
  });
});


document.addEventListener("DOMContentLoaded", function () {
  initMap();
});

///////////////////
// 현재위치 찾기 파트 ///
//////////////////////////////////////////////////////////////////////

function addLocationButton() {
  var locationButton = L.control({ position: "topright" });
  locationButton.onAdd = function (map) {
    var button = L.DomUtil.create("button", "custom-map-control-button");
    button.setAttribute("type", "button");
    button.innerText = "현위치 찾기";

    // 클릭 이벤트가 상위로 전파되지 않도록 이벤트 리스너를 추가
    L.DomEvent.on(button, "click", function (e) {
      L.DomEvent.stopPropagation(e); // 상위 요소로의 이벤트 전파를 멈춤
      L.DomEvent.preventDefault(e); // 기본 이벤트(여기서는 폼 제출)를 방지
      document.getElementById("loading").style.display = "block";
      document.getElementById("loading").style.zIndex = 1000;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            var pos = [position.coords.latitude, position.coords.longitude];
            map.setView(pos, 16); // 적절한 줌 레벨로 지도 중심 이동
            addCurrentLocationMarker(pos); // 현위치에 마커 추가
            document.getElementById("loading").style.display = "none";
          },
          function () {
            handleLocationError(true, map.getCenter()); // 위치 에러 처리
            document.getElementById("loading").style.display = "none";
          }
        );
      } else {
        handleLocationError(false, map.getCenter()); // 위치 서비스 지원 안 할 때 에러 처리
        document.getElementById("loading").style.display = "none";
      }
    });

    return button;
  };
  locationButton.addTo(map);
}

// 현위치 아이콘 생성
var currentLocationIcon = L.icon({
  iconUrl: "/images/currentLocation_red.png", 
  iconSize: [22, 22], 
  iconAnchor: [11, 11],
});

// 현위치 마커와 깜빡임 효과를 위한 변수
var currentLocationMarker;
var markerBlinkInterval;

function addCurrentLocationMarker(pos) {
  if (currentLocationMarker) {
    map.removeLayer(currentLocationMarker); // 기존 마커 제거
    clearInterval(markerBlinkInterval); // 깜빡임 인터벌 제거
  }

  currentLocationMarker = L.marker(pos, { icon: currentLocationIcon }).addTo(
    map
  );
  // currentLocationMarker.bindPopup("현재 위치").openPopup();

  var visible = true;
  markerBlinkInterval = setInterval(function () {
    currentLocationMarker.setOpacity(visible ? 1 : 0);
    visible = !visible;
  }, 400);
}

function handleLocationError(browserHasGeolocation, pos) {
  L.popup()
    .setLatLng(pos)
    .setContent(
      browserHasGeolocation
        ? "설정 > 개인정보 보호 및 보안 > 위치 서비스에서<br>브라우저에 위치권한을 설정해주세요"
        : "오류: 브라우저가 위치 추적을 지원하지 않습니다."
    )
    .openOn(map);
}

function addSearchButton() {
  var customControl = L.Control.extend({
      options: {
          position: 'topright' // 버튼을 왼쪽 하단에 배치
      },
      onAdd: function (map) {
          var container = L.DomUtil.create('button', 'search-button');
          container.innerText = '장소 검색';
          container.style.cursor = 'pointer';
          container.style.background = '#fff';
          container.style.border = 'none';
          container.style.padding = '5px';

          L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation)
                    .on(container, 'click', L.DomEvent.preventDefault)
                    .on(container, 'click', function(e) {
                        showSearchModal(); // 검색 모달창 표시 함수
                    });

          return container;
      }
  });
  map.addControl(new customControl());
}

// 검색 모달창 표시 함수 (실제 모달 구현은 여기에 추가)
function showSearchModal() {
  var modal = document.getElementById("searchModal");
  modal.style.display = "block";
  

  
}

function closeSearchModal() {
  var modal = document.getElementById("searchModal");
  modal.style.display = "none";
}


// 검색 버튼 이벤트 리스너
document.getElementById('searchButton').addEventListener('click', function() {
  var query = document.getElementById('searchInput').value;
  if (query.length > 1) { // 최소 길이 제한
    searchPlaces(query);
  }
});

// OpenStreetMap Nominatim 검색 API 사용
function searchPlaces(query) {
	document.getElementById('Locationloading').style.display = 'block'; // 로딩 서클 표시
  var url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      displaySearchResults(data);
      
    });
}


// 검색 결과 표시
function displaySearchResults(results) {
  var resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerText = ''; // 이전 결과 클리어
  document.getElementById('Locationloading').style.display = 'none'; // 로딩 서클 숨김
  results.forEach(function(place) {
    var parts = place.display_name.split(', '); // 쉼표로 분할

    var div = document.createElement('div');
    div.innerText = parts; // innerText를 사용하여 텍스트를 추가
    div.className = 'search-result';
    div.onclick = function() {
      map.eachLayer(function(layer) { // 이전 동그라미 제거
        if (layer instanceof L.Circle) {
          map.removeLayer(layer);
        }
      });
      var circle = L.circle([place.lat, place.lon], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 70, // 반경 설정
        weight: 1
      }).addTo(map);
      map.setView([place.lat, place.lon], 15); // 선택된 위치로 지도 중심 이동
      document.getElementById("searchModal").style.display = "none"; // 모달 닫기
    }
    resultsDiv.appendChild(div);
  });
}

// 메타 정보 추출 모달 
function showExifModal() {
  var modal = document.getElementById("exifModal");
  modal.style.display = "block";
}

function closeExifModal() {
  var modal = document.getElementById("exifModal");
  modal.style.display = "none";
}

function ConvertDMSToDD(degrees, minutes, seconds, direction) {
  var dd = degrees + minutes/60 + seconds/(60*60);
  if (direction === "S" || direction === "W") {
      dd = dd * -1;
  }
  return dd;
}

// 소수점 5째자리로 좌표를 제한하는 함수
function limitPrecision(number, precision) {
  return parseFloat(number.toFixed(precision));
}

// 지도에 좌표를 표시하는 함수
function displayOnMap(latitude, longitude) {
  // 소수점 5째자리로 제한
  var lat = limitPrecision(latitude, 5);
  var lon = limitPrecision(longitude, 5);

  map.eachLayer(function(layer) { // 이전 동그라미 제거
      if (layer instanceof L.Circle) {
          map.removeLayer(layer);
      }
  });

  var circle = L.circle([lat, lon], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 15, // 반경 설정
      weight: 1
  }).addTo(map);

  map.setView([lat, lon], 18); // 선택된 위치로 지도 중심 이동
  // 모달 창이 열려있다면 닫기
  var searchModal = document.getElementById("exifModal");
  if (searchModal) {
  	alert("추출된 좌표 범위가 지도에 빨간원으로 표시되었습니다.")
      searchModal.style.display = "none";
  }
}

// 파일이 선택되었을 때 실행될 리스너
document.getElementById('image-input').addEventListener('change', function(event) {
  var file = event.target.files[0];
  if (file) {
      

      EXIF.getData(file, function() {
          var lat = EXIF.getTag(this, "GPSLatitude");
          var lon = EXIF.getTag(this, "GPSLongitude");

          if (lat && lon) {
              var latitude = ConvertDMSToDD(lat[0], lat[1], lat[2], EXIF.getTag(this, "GPSLatitudeRef"));
              var longitude = ConvertDMSToDD(lon[0], lon[1], lon[2], EXIF.getTag(this, "GPSLongitudeRef"));

              
              // 추출된 좌표를 지도에 표시
              displayOnMap(latitude, longitude);
          } else {
              alert('사진에 좌표정보가 없습니다.');
              
          }
      });
  }
});
