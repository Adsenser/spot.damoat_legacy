var map;
var markerClusterGroup; // 클러스터 그룹을 위한 변수

//지도 초기 세팅 파트//
////////////////////////////////////////////////////////////////////////////////////////

function initMap() {
    // 지도 초기화
    map = L.map("map").setView([20.5519, 127.9918], 3);
  
    // 타일 레이어 추가
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
  
    // 클러스터 그룹 초기화
    markerClusterGroup = L.markerClusterGroup();
    map.addLayer(markerClusterGroup);
  
    // 마커 데이터 로드 및 처리
    loadMarkerData();
  
    // 현재 위치로 이동하는 버튼 추가
    addLocationButton();

    // 검색 버튼 추가
    addSearchButton();
  }
  // 페이지 로드 시 지도 초기화
  document.addEventListener("DOMContentLoaded", initMap);
  
  ///////////////////
  //마커추출+정보창파트///
  //////////////////
  
  function loadMarkerData() {
    fetch("https://api-spot.damoat.com/server.php?initial=true")
      .then((response) => response.json())
      .then((markersData) => {
        markersData.forEach((markerData) => {
          // 상태에 따른 마커 아이콘 설정
          var markerIcon = getMarkerIcon(markerData.place_type);
  
          var marker = L.marker([markerData.lat, markerData.lng], { icon: markerIcon });
          markerClusterGroup.addLayer(marker);
  
          marker.off("click").on("click", function () {
            // 클릭한 마커의 좌표 사용
            var latFixed = parseFloat(markerData.lat).toFixed(5);
            var lngFixed = parseFloat(markerData.lng).toFixed(5);
            var clickedCoordinates = `${latFixed},${lngFixed}`;
            fetch(`https://api-spot.damoat.com/server.php?coordinates=${clickedCoordinates}`)
              .then((response) => response.json())
              .then((fullData) => {
                // var descriptionWithBreaks = fullData.description.replace(/\n/g, '<br>');
                window.descriptionOriginal = fullData.description;
                var popupContent = `
                <div class="popup-content">
                  <div id=placeInformationTop>
                    <h3>${fullData.name}</h3>
                    <p>${fullData.created_at}</p>
                  </div>
                  <div id=placeInformationMiddle>
                    <h4>by ${fullData.creator}</h4>
                    
                    <div id="placeInformationButton">
                      <button id="placePopupEditButton" onclick="openEditPlace('${clickedCoordinates}')">수정</button>
                      <button id="placePopupReportButton" onclick="openReportPlace('${clickedCoordinates}')">신고</button>
                      <button id="placePopupShareButton" onclick="gotoShareSpot(${latFixed}, ${lngFixed})">공유</button>
                      
                    </div>
                  </div>
                  <p id="MarkerPopupDescription">${getDescriptionWithBreaks(descriptionOriginal)}</p>
                  <p id="MarkerPopupDescription"><a href="${fullData.extra_link}">${fullData.extra_link}</a></p>
                  <p id="MarkerPopupRenewCount">해당 스팟 정보가 수정된 횟수 : <strong>${fullData.renew_count}</strong></p>
                  <div id=placeInformationBottom>
                    <button id="PlaceInformationRouteButton" onclick="showRouteModal(${markerData.lat}, ${markerData.lng}, '${fullData.name}')">길찾기</button>
                    <button onclick="viewComments('${clickedCoordinates}')">댓글</button>
                    <button onclick="openPhotosModal('${clickedCoordinates}')">사진</button>
                  </div>
                </div>
                `;

                function getDescriptionWithBreaks(description) {
                  if (description.length > 170) {
                  var truncatedDescription = description.substring(0, 120);

                  // var descriptionNew = description.replace(/<br>/g, "\n");
                  // var sanitizedDescription = description.replace(/["'`]/g, ''); 
                  return `${truncatedDescription}...<button id="placePopupShareButton" onclick="openFullDescription()">더보기</button>`;
                  } else {
                  return description;
                  }
                }

                
                
                marker.bindPopup(popupContent).openPopup();
              })
              .catch((error) => console.error("Error:", error));
          });
        });
      })
      .catch((error) => console.error("Error:", error));
  }



// 상태에 따른 마커 아이콘 반환 함수
function getMarkerIcon(status) {
    var iconUrl;
    switch (status) {
      case 1:
        iconUrl = '/images/1.png'; 
        break;
      case 2:
        iconUrl = '/images/2.png'; 
        break;
      case 0:
        iconUrl = '/images/0.png'; 
    }
  
    return L.icon({
      iconUrl: iconUrl,
      iconSize: [28, 39], 
      iconAnchor: [13, 33], //앵커 포인트
      popupAnchor: [1, -34], // 팝업 앵커
    });
  }

  ////////////////
// 초기모달창 구동 파트 //
//////////////////

var initial_modal = document.getElementById("initialModal");

// 페이지 로드 시 모달창 표시
window.onload = function() {
  initial_modal.classList.add("show");
}

// 모달 외부 클릭 시 모달창 닫기
window.onclick = function(event) {
  if (!initial_modal.contains(event.target)) {
    initial_modal.classList.add("hidden");
  }
}

// 애니메이션 완료 후 hidden 클래스 제거 및 visibility 속성 변경
initial_modal.addEventListener('transitionend', function() {
  if (initial_modal.classList.contains("hidden")) {
    initial_modal.style.visibility = "hidden";
    initial_modal.style.display = "none";
  } else {
    initial_modal.style.visibility = "visible";
  }
});

///////////////////
//현재위치 찾기 파트///
///////////////////
var currentLocationMarker = null;

function addLocationButton() {
  var locationButton = L.control({ position: "topleft" });
  locationButton.onAdd = function (map) {
    var button = L.DomUtil.create("button", "custom-map-control-button");
    button.style.backgroundImage = "url('images/currentLocation-button.png')";
    button.style.backgroundSize = "cover"; // 아이콘 크기를 버튼에 맞춤
    button.style.width = "35px"; // 버튼의 너비 설정
    button.style.height = "35px"; 
    button.onclick = function () {
      document.getElementById("loading").style.display = "block";
      document.getElementById("loading").style.zIndex = 1000;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            var pos = [position.coords.latitude, position.coords.longitude];
            map.setView(pos, 14);

            addCurrentLocationMarker(pos);
            document.getElementById("loading").style.display = "none";
          },
          function () {
            handleLocationError(true, map.getCenter());
            document.getElementById("loading").style.display = "none";
          }
        );
      } else {
        handleLocationError(false, map.getCenter());
        document.getElementById("loading").style.display = "none";
      }
    };
    return button;
  };
  locationButton.addTo(map);
}

// 현위치 아이콘 생성
var currentLocationIcon = L.icon({
  iconUrl: "/images/currentLocation_blue.png",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// 현위치 마커와 깜빡임 효과를 위한 변수
var currentLocationMarker;


function addCurrentLocationMarker(pos) {
  if (currentLocationMarker) {
    map.removeLayer(currentLocationMarker); // 기존 마커 제거
  }

  var blinkingIcon = L.divIcon({
    className: 'smooth-blink',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: '<img src="/images/currentLocation_blue.png" style="width:24px;height:24px;">'
  });

  currentLocationMarker = L.marker(pos, { icon: blinkingIcon }).addTo(map);
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
          
          container.style.cursor = 'pointer';
          container.style.backgroundImage = "url('images/search-button.png')";
          container.style.backgroundSize = "cover"; // 아이콘 크기를 버튼에 맞춤
          container.style.width = "35px"; // 버튼의 너비 설정
          container.style.height = "35px"; 
          // container.style.border = 'none';
          // container.style.padding = '5px';

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