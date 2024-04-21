document.addEventListener('DOMContentLoaded', function() {
    // URLSearchParams 객체를 사용하여 쿼리 매개변수에서 좌표 추출
    const params = new URLSearchParams(window.location.search);
    // 좌표 문자열 디코딩
    const coordinates = decodeURIComponent(params.get('c') || '');
    // 좌표가 존재하는지 확인
    if (coordinates) {
        
        window.coordinates = coordinates

        // 좌표 형식이 올바른지 확인 (isValidCoordinates 함수가 이전에 정의되어 있다고 가정)
        if (isValidCoordinates(window.coordinates)) {
            // 서버에 fetch 요청
            fetch('https://api-spot.damoat.com/share/share_spot.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                // 이미 디코딩된 coordinates를 사용
                body: `coordinates=${window.coordinates}`
            })
            .then(response => response.json()) // 응답을 JSON으로 파싱
            .then(data => {
                parseJsonData(data); // JSON 데이터 파싱 및 처리
                showData(); // 데이터 표시
            })
            .catch(error => {
                console.error('Error:', error);
                alert('잘못된 응답입니다. URL이 올바른지 확인해주세요.')
            });
        } else {
            console.error('Invalid coordinates format.');
            alert('잘못된 형식입니다.')
        }
    } else {
        console.error('Coordinates not found in URL.');
        alert('스팟을 찾을 수 없습니다.')
    }
});


function isValidCoordinates(coordinates) {
    // ., -, 숫자, 쉼표를 제외한 모든 문자를 찾습니다.
    // 이 정규 표현식은 위에서 언급한 문자들을 제외한 모든 것에 일치합니다.
    const invalidCharsPattern = /[^0-9.,-]/;

    // ., -, 숫자, 쉼표만 포함되어 있다면, 이 패턴은 일치하지 않습니다.
    // 따라서, ! 연산자를 사용하여 특수문자가 없는 경우 true를 반환하도록 합니다.
    return !invalidCharsPattern.test(coordinates);
}

function parseJsonData(data) {
    

    // 각 값을 변수에 저장
    window.photoName = data.photoName;
    
    window.placeName = data.place.name;
    window.creator = data.place.creator;
    window.extraLink = data.place.extra_link; 
    window.descriptionOriginal = data.place.description;

    const [latitude, longitude] = coordinates.split(',');
    window.lat = latitude.trim();
    window.lng = longitude.trim();

    // 결과 확인을 위해 콘솔에 출력
    // console.log(`Photo Name: ${photoName}`);
    // console.log(`Place Name: ${placeName}`);
    // console.log(`Creator: ${creator}`);
    // console.log(`Extra Link: ${extraLink}`);
    // console.log(`coordinates: ${window.coordinates}`);
    // console.log(`description: ${window.descriptionOriginal}`);
}


function showData() {
    var cardImage = document.getElementById('cardImage');
    var placeName = document.getElementById('spotName');
    var creator = document.getElementById('creator');

    cardImage.src = "https://d3bjds5jtmvmmt.cloudfront.net/original/" + window.photoName;
    // ']' 문자 뒤에 첫 번째 인스턴스에만 '<br>'을 추가
    var formattedPlaceName = window.placeName.replace(/\]/, ']<br>');
    
    placeName.innerHTML = formattedPlaceName; 
    

    if (window.extraLink) {
        var linkElement = document.getElementById('extraLink');
        
        // 'href' 속성에 'window.extraLink' 값을 설정
        linkElement.href = window.extraLink;
        creator.innerText = window.creator+" 🔗";
    }
    else {
        creator.innerText = window.creator;
    }


}

function copySpotLink() {
    // 현재 페이지의 URL 가져오기
    const url = window.location.href;

    // navigator.clipboard API를 사용하여 클립보드에 URL 복사
    navigator.clipboard.writeText(url).then(() => {
        alert('해당 스팟 링크가 복사되었습니다.');
    }).catch(err => {
        alert('링크 복사에 실패했습니다.');
    });
}
