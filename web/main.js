// document.addEventListener('contextmenu', function(event) {
//   event.preventDefault(); // 기본 우클릭 이벤트 차단
// });

let isUploading = false; //사진 업로드중임을 표시하는 변수
let isLoadingPhotos = false; //사진 표시관련 전역변수

////////////////////
//댓글 관련 정보 파트//
//////////////////

// 모달을 표시하는 함수
function addComment(coordinates) {
  // 모달에 좌표 데이터 설정
  document.getElementById("commentModal").dataset.coordinates = coordinates;
  // 모달 표시
  document.getElementById("commentModal").style.display = "block";
}

// 모달을 닫는 함수
function closeCommentModal() {
  document.getElementById("commentModal").style.display = "none";
}

// 댓글 제출 함수
function submitComment(event) {
  event.preventDefault(); // 폼의 기본 제출 동작 방지

  var form = document.getElementById("commentForm");
  var formData = new FormData(form);

  
  var coordinates = document.getElementById("commentModal").dataset.coordinates;
  formData.append("coordinates", coordinates);

  fetch("https://api-spot.damoat.com/comments.php", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.text())
    .then((response) => {
      alert(response); 
      closeCommentModal(); // 댓글 모달 닫기
      
      // 리캡챠 토큰 초기화
      grecaptcha.reset();
      //닫기
      document.getElementById("viewCommentsModal").style.display = "none";
    })
    .catch((error) => console.error("Error:", error));
    // 리캡챠 토큰 초기화
    grecaptcha.reset();
}

var commentInput = document.getElementById("commentInput");
var charCountDisplay = document.getElementById("charCountDisplay");
var maxCharCount = 100;
var maxLineBreaks = 5; // 최대 줄바꿈 개수

commentInput.addEventListener("input", function () {
  var text = commentInput.value;
  var lineBreaks = text.split("\n").length - 1; // 줄바꿈 개수 계산
  var charCount = text.length - lineBreaks; // 줄바꿈을 제외한 글자 수

  // 최대 글자 수를 넘어가면 줄바꿈을 방지하고 최대 글자 수까지 자름
  if (charCount > maxCharCount) {
    var diff = charCount - maxCharCount;
    var newText = text.substring(0, text.length - diff);
    commentInput.value = newText;
    charCount = maxCharCount;
  }

  // 최대 줄바꿈 개수를 넘어가면 줄바꿈을 방지
  if (lineBreaks > maxLineBreaks) {
    var lines = text.split("\n");
    var newLines = lines.slice(0, maxLineBreaks);
    commentInput.value = newLines.join("\n");
    lineBreaks = maxLineBreaks;
  }

  // 글자수와 줄바꿈 횟수를 표시
  charCountDisplay.textContent = charCount + "/" + maxCharCount;
});

// 초기 상태 설정
charCountDisplay.textContent = "0/" + maxCharCount;

///////////////////////////////////////////////
/////////////////////댓글읽기파트/////////////////
///////////////////////////////////////////////

// 댓글 보기 모달을 표시하는 함수
function viewComments(coordinates) {
  current_coordinates = coordinates; // 현재 좌표 업데이트
  fetch(`https://api-spot.damoat.com/comments.php?coordinates=${coordinates}`)
    .then((response) => response.json())
    .then((data) => {
      const comments = data.comments; // 서버로부터 받은 데이터 내의 comments 배열
      const totalComments = data.total;

      // 댓글 데이터 처리 로직
      var commentsList = document.getElementById("commentsList");
      while (commentsList.firstChild) {
        commentsList.removeChild(commentsList.firstChild);
      }

      // 총 댓글 수 표시
      var totalCommentsLabel = document.getElementById("totalCommentsLabel");
      totalCommentsLabel.innerText = `총 댓글 수: ${totalComments}`;

      comments.forEach((comment) => {
        var commentContainer = document.createElement("div");
        commentContainer.className = "comment-container";

        var commentHeader = document.createElement("div");
        commentHeader.className = "comment-header";
        var nickname = document.createElement("span");
        nickname.className = "nickname";
        nickname.textContent = comment.user_name; 

        var commentText = document.createElement("div");
        commentText.className = "comment-text";
        commentText.innerText = comment.comment;

        var commentDate = document.createElement("div");
        commentDate.className = "comment-date";
        var date = new Date(comment.created_at);
        commentDate.innerText = date.toLocaleDateString("ko-KR");

        var commentActions = document.createElement("div");
        commentActions.className = "comment-actions";
        var deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "삭제";
        // 각 댓글 컨테이너에 data-id 속성 추가
        commentContainer.dataset.id = comment.id;

        // 삭제 버튼 이벤트 리스너 추가
        deleteButton.onclick = function () {
          // 사용자가 입력한 이메일을 가져오기
          var userEmail = prompt("비밀번호를 입력하세요.");

          // 서버에 요청 보내기
          if (userEmail) {
            // 서버로 삭제 요청을 보내기
            fetch("https://api-spot.damoat.com/delete_comment.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body:
                "id=" +
                encodeURIComponent(commentContainer.dataset.id) +
                "&email=" +
                encodeURIComponent(userEmail),
            })
              .then((response) => response.text())
              .then((data) => {
                alert(data); // 서버로부터의 응답을 사용자에게 알립니다
                if (data === "댓글이 삭제되었습니다.") {
                  
                }
              })
              .catch((error) => console.error("Error:", error));
          }
        };

        var reportButton = document.createElement("button");
        reportButton.className = "report-btn";
        reportButton.textContent = "신고";
        // 신고 버튼 이벤트 리스너 추가
        reportButton.onclick = function () {
          // 사용자에게 신고를 확인
          if (confirm("해당 댓글을 신고하시겠습니까?")) {
            // 신고 사유를 사용자에게서 입력받기
            var reportReason = prompt("신고 사유를 입력해주세요.\n(최대 100자)");
          
            if (reportReason !== null && reportReason.trim() !== "") {
              // 서버로 신고 요청을 보내기
              fetch("https://api-spot.damoat.com/report_comment.php", {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: "id=" + encodeURIComponent(commentContainer.dataset.id) + "&reason=" + encodeURIComponent(reportReason),
              })
              .then((response) => response.text())
              .then((data) => {
                alert(data); // 서버로부터의 응답을 사용자에게 알림
              })
              .catch((error) => console.error("Error:", error));
            } else {
              alert("신고 사유가 입력되지 않았습니다.");
            }
          }
          
        };

        // 컨테이너에 각 요소 추가
        commentHeader.appendChild(nickname);
        commentHeader.appendChild(commentDate);
        commentActions.appendChild(deleteButton);
        commentActions.appendChild(reportButton);
        commentContainer.appendChild(commentHeader);
        commentContainer.appendChild(commentText);
        commentContainer.appendChild(commentActions);
        commentsList.appendChild(commentContainer);
      });

      // 댓글 보기 모달을 표시
      document.getElementById("viewCommentsModal").style.display = "block";
    })
    .catch((error) => console.error("Error:", error));
}

// 댓글 보기 모달을 닫는 함수
function closeViewCommentsModal() {

  var commentModal = document.getElementById("viewCommentsModal");
  // 페이드 아웃 애니메이션 추가
  commentModal.classList.add("fade-out");

  commentModal.addEventListener('animationend', function() {
    commentModal.style.display = "none";
    // 애니메이션이 종료된 후 fade-out 클래스 제거
    commentModal.classList.remove("fade-out");
  }, { once: true }); // 이벤트 리스너가 한 번 실행된 후 제거되도록 설정
}

//////////////////////////
//////길찾기 기능구현/////////
//////////////////////////

// 길찾기 모달을 표시하는 함수
function showRouteModal(lat, lng, name) {
  // 모달 창 표시
  var routeModal = document.getElementById("routeModal");
  routeModal.style.display = "block";

  // 각 링크에 클릭 이벤트 리스너 설정
  document.getElementById("naverMap").onclick = function () {
    window.open(`nmap://place?lat=${lat}&lng=${lng}&name=${name}`);
  };
  document.getElementById("KakaoMap").onclick = function () {
    window.open(`https://map.kakao.com/link/map/스팟 위치,${lat},${lng}`);
  };
  document.getElementById("googleMap").onclick = function () {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

}
  

  


// 길찾기 모달을 닫는 함수
function closeRouteModal() {
  var routeModal = document.getElementById("routeModal");
  // 페이드 아웃 애니메이션 추가
  routeModal.classList.add("fade-out");

  routeModal.addEventListener('animationend', function() {
    routeModal.style.display = "none";
    // 애니메이션이 종료된 후 fade-out 클래스 제거
    routeModal.classList.remove("fade-out");
  }, { once: true }); // 이벤트 리스너가 한 번 실행된 후 제거되도록 설정
}


//////////////////////
////사진 갤러리 파트/////
//////////////////////

//사진첩 보기
function openPhotosModal(coordinates) {
  current_coordinates = coordinates;

  // 총 사진 개수 가져오기
  fetchPhotoCount(coordinates);
  
  clearPhotosGrid();

  // 초기 사진 로드
  fetchPhotos(coordinates);

  // 사진첩 보기 모달을 표시
  document.getElementById("viewPhotosModal").style.display = "block";
}

// 사진 개수 카운트
function fetchPhotoCount(coordinates) {
  fetch(`https://api-spot.damoat.com/photo_count.php?coordinates=${coordinates}`)
    .then((response) => response.json())
    .then((data) => {
      document.getElementById(
        "photoCount"
      ).textContent = `총 사진 수: ${data.photo_count}`;
    })
    .catch((error) => console.error("Error fetching photo count:", error));
}

// 사진을 가져오는 함수
function fetchPhotos(coordinates) {
  if (isLoadingPhotos) return;

  isLoadingPhotos = true;

  window.have_photo_id = [];

  fetch(`https://api-spot.damoat.com/get_photos.php?coordinates=${coordinates}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.photos.length > 0) {
        data.photos.forEach((photo) => {
          // 배열에 photo_id 추가
          window.have_photo_id.push(photo.photo_id);
          createPhotoElement(photo.thumbnail_path, photo.photo_id);
        });
      } else {
        // 더 이상 로드할 사진이 없을 경우 처리
      }
    })
    .catch((error) =>
      console.error("사진을 가져오는 중 오류가 발생했습니다:", error)
    )
    .finally(() => {
      isLoadingPhotos = false;
    });
}

// 사진 엘리먼트를 생성하는 함수
function createPhotoElement(photoPath, photo_id) {
  const photoContainer = document.getElementById("photosGrid");
  const photoElement = document.createElement("img");
  photoElement.src = photoPath;
  photoElement.alt = "Photo";
  photoElement.className = "photo-thumbnail"; 
  photoElement.onclick = () => openPhotoModal(photo_id);
  photoContainer.appendChild(photoElement);
}

// 사진 보기 모달을 닫는 함수
function closePhotosModal() {
  var photoModal = document.getElementById("viewPhotosModal");
  // 페이드 아웃 애니메이션 추가
  photoModal.classList.add("fade-out");

  photoModal.addEventListener('animationend', function() {
    photoModal.style.display = "none";
    // 애니메이션이 종료된 후 fade-out 클래스 제거
    photoModal.classList.remove("fade-out");
  }, { once: true }); // 이벤트 리스너가 한 번 실행된 후 제거되도록 설정

  //생성된 사진 갤러리 제거
  clearPhotosGrid();
}

// 사진 자세한 정보보기 모달을 여는 함수
function openPhotoModal(photo_id) {
  
  window.currentPhotoId = photo_id;
  // 모달창 찾기
  const photoModal = document.getElementById("photoDetailModal");
  if (photoModal) {
    // 모달 내부의 요소 찾기 및 초기화
    const imgElement = photoModal.querySelector(".modal-photo-img");
    const creatorElement = photoModal.querySelector(".modal-photo-creator");
    const dateElement = photoModal.querySelector(".modal-photo-date");

    if (imgElement) imgElement.src = "";
    if (creatorElement) creatorElement.textContent = "";
    if (dateElement) dateElement.textContent = "";

    // 사진 상세 정보 가져오기
    showPhotoDetail(photo_id);

    // 모달창 표시
    photoModal.style.display = "block";

    // 이전, 다음 버튼 이벤트 리스너 설정
  const previousButton = document.querySelector(".previous-photo-button");
  const nextButton = document.querySelector(".next-photo-button");

  if (previousButton) {
    previousButton.addEventListener("click", showPreviousPhoto);
  }
  if (nextButton) {
    nextButton.addEventListener("click", showNextPhoto);
  }

    /////////
    //사진 삭제 파트
    // 삭제 버튼에 photo_id 설정
    const deleteButton = photoModal.querySelector(".delete-photo-button");
    if (deleteButton) {
      deleteButton.dataset.photoId = photo_id;

      deleteButton.onclick = function () {
        var userEmail = prompt("비밀번호를 입력하세요.");
        if (userEmail) {
          fetch("https://api-spot.damoat.com/delete_photo.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "photo_id=" + encodeURIComponent(this.dataset.photoId) +
                  "&email=" + encodeURIComponent(userEmail),
          })
          .then(response => response.text())
          .then(data => {
            alert(data);
            if (data === "사진이 삭제되었습니다.") {
              closePhotoDetailModal();
              
            }
          })
          .catch(error => console.error("Error:", error));
        }
      };
    }

    // '사진 크게 보기' 버튼에 대한 처리
    const viewPhotoButton = photoModal.querySelector(".view-photo-button");
    // 기존에 할당된 이벤트 리스너를 제거
    viewPhotoButton.removeEventListener("click", openPhotoInNewWindow);
    // 새로운 이벤트 리스너를 추가
    viewPhotoButton.addEventListener("click", openPhotoInNewWindow, { once: true });
      
    

    ///////////
    // 신고 버튼에 photo_id 설정
    const reportButton = photoModal.querySelector(".report-photo-button");
    if (reportButton) {
      reportButton.dataset.photoId = photo_id;

      reportButton.onclick = function () {
        if (confirm("해당 사진을 신고하시겠습니까?")) {
          // 신고 사유를 사용자에게서 입력받기
          var reportReason = prompt("신고 사유를 입력해주세요.\n(최대 100자)");
        
          if (reportReason !== null && reportReason.trim() !== "") {
            // 서버로 신고 요청을 보내기
            fetch("https://api-spot.damoat.com/report_photo.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: "photo_id=" + encodeURIComponent(this.dataset.photoId) + "&reason=" + encodeURIComponent(reportReason),
            })
            .then((response) => response.text())
            .then((data) => {
              alert(data); // 서버로부터의 응답을 사용자에게 알리기
            })
            .catch((error) => console.error("Error:", error));
          } else {
            alert("신고 사유가 입력되지 않았습니다.");
          }
        }
      };
    }
  }
}

// 사진 크게 보기 이벤트 리스너를 별도의 함수로 정의
function openPhotoInNewWindow() {
  const url = window.originalImgUrl; 
  window.open(url, "_blank");
}


function showPhotoDetail(photo_id) {
  // 서버에 사진 상세 정보 요청
  fetch(`https://api-spot.damoat.com/get_photo_details.php?photo_id=${photo_id}`)
    .then((response) => response.json())
    .then((data) => {
      // 모달창에 정보를 표시하는 로직
      const photoModal = document.getElementById("photoDetailModal");
      photoModal.querySelector(".modal-photo-img").src = data.photo_path; // 원본 이미지 경로 설정
      window.originalImgUrl= data.photo_path
      photoModal.querySelector(".modal-photo-creator").textContent =
        data.photo_creator; // 사진 생성자 설정
      photoModal.querySelector(".modal-photo-date").textContent =
        data.created_at; // 생성 날짜 설정
    })
    .catch((error) => {
      console.error("Error fetching photo details:", error);
      alert("사진 정보를 가져오는데 실패했습니다.");
    });
}

// 사진 상세 정보보기 모달을 닫는 함수를 Promise를 반환하도록 수정
function closePhotoDetailModal() {
  return new Promise((resolve, reject) => {
    var photoDetailModal = document.getElementById("photoDetailModal");
    // 페이드 아웃 애니메이션 추가
    photoDetailModal.classList.add("fade-out");

    photoDetailModal.addEventListener('animationend', function() {
      photoDetailModal.style.display = "none";
      // 애니메이션이 종료된 후 fade-out 클래스 제거
      photoDetailModal.classList.remove("fade-out");
      resolve(); // 애니메이션이 완료되면 Promise를 resolve
    }, { once: true });
  });
}

function clearPhotosGrid() {
  // photosGrid 내의 모든 사진 엘리먼트를 제거
  const photoContainer = document.getElementById("photosGrid");
  while (photoContainer.firstChild) {
    photoContainer.removeChild(photoContainer.firstChild);
  }
}

// 사진 이전, 다음 버튼 이벤트 리스너
function findPhotoIndex(currentPhotoId) {
  return window.have_photo_id.indexOf(currentPhotoId);
}

// 이전 사진을 보는 함수
function showPreviousPhoto() {
  closePhotoDetailModal().then(() => {
    setTimeout(() => { // 애니메이션 완료 후 잠시 대기
      const currentPhotoIndex = findPhotoIndex(window.currentPhotoId);
      if (currentPhotoIndex > 0) {
        const previousPhotoId = window.have_photo_id[currentPhotoIndex - 1];
        openPhotoModal(previousPhotoId);
      } else {
        console.log('이전 사진이 없습니다.');
      }
    }, 1); 
  });
}

// 다음 사진을 보는 함수
function showNextPhoto() {
  closePhotoDetailModal().then(() => {
    setTimeout(() => { // 애니메이션 완료 후 잠시 대기
      const currentPhotoIndex = findPhotoIndex(window.currentPhotoId);
      if (currentPhotoIndex < window.have_photo_id.length - 1) {
        const nextPhotoId = window.have_photo_id[currentPhotoIndex + 1];
        openPhotoModal(nextPhotoId);
      } else {
        console.log('다음 사진이 없습니다.');
      }
    }, 1); 
  });
}


//////////////////////
////사진 업로드 파트/////
//////////////////////

//// 로딩창 ///////
// 로딩 모달창 생성, 소멸 함수
function openLoadingModal() {
  // 로딩 창을 열고 사용자에게 보여주기
  document.getElementById("loadingModal").style.display = "block";
}
////////////////

function closeLoadingModal() {
  // 로딩 창을 숨기기
  document.getElementById("loadingModal").style.display = "none";
}


//모달창 생성, 소멸
function openPhotoUploadModal(coordinates) {
  // 모달창을 열고 현재 좌표를 저장
  document.getElementById("addPhotoModal").style.display = "block";
  document.getElementById("addPhotoModal").dataset.coordinates = coordinates;

  // Turnstile 위젯 초기화
  turnstile.render("#turnstile-widget", {
    sitekey: "0x4AAAAAAARv3oy8DvYjNVgz",
  });

  // 이미지 업로드 폼에 이벤트 리스너 추가
  document
    .getElementById("photoUploadForm")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // 폼의 기본 제출 동작을 막기
      var photoInput = document.getElementById("photoInput");
      if (photoInput.files.length > 0) {
        var file = photoInput.files[0];
        var validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

        if (validImageTypes.includes(file.type)) {
          // 이미지 해상도 조정 함수를 호출
          if (!isUploading) {
            openLoadingModal(); // 업로드 시작 전 로딩 창을 표시
            resizeAndUpload(file, this); // 'this'는 현재 폼을 가리킴
          }
        } else {
          closeLoadingModal();
          alert(
            "유효한 이미지 파일 형식이 아닙니다. JPEG,PNG 또는 webp 파일을 선택해주세요."
          );
        }
      }
    });
}

function closePhotoModal() {
  document.getElementById("addPhotoModal").style.display = "none";
}

// 이미지 리사이징 및 업로드 함수
function resizeAndUpload() {
  // 업로드 중 상태를 true로 설정
  isUploading = true;
  var fileInput = document.getElementById("photoInput");
  var nicknameInput = document.getElementById("UploadUserNameInput");
  var emailInput = document.getElementById("UploadUserEmailInput");

  var coordinates =
    document.getElementById("addPhotoModal").dataset.coordinates;

  if (fileInput.files.length > 0) {
    var file = fileInput.files[0];
    var nickname = nicknameInput.value;
    var email = emailInput.value;

    // FileReader를 사용하여 파일을 읽기
    var reader = new FileReader();
    reader.onload = function (readerEvent) {
      var image = new Image();
      image.onload = function (imageEvent) {
        // 캔버스에 이미지를 그리기
        var canvas = document.createElement("canvas");
        var max_size = 1700; // 최대 너비 설정
        var width = image.width;
        var height = image.height;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(image, 0, 0, width, height);

        // 리사이즈된 이미지를 Blob 데이터로 변환
        canvas.toBlob(
          function (blob) {
            // FormData를 생성하고 Blob 데이터와 다른 정보를 추가
            var formData = new FormData();
            formData.append("file", blob); // 리사이즈된 이미지 파일
            formData.append("nickname", nickname); 
            formData.append("email", email); // 실제로는 비밀번호
            formData.append("coordinates", coordinates); // 좌표

            // Turnstile 응답 토큰 추가
            var turnstileResponse = document.querySelector(
              '[name="cf-turnstile-response"]'
            ).value;
            formData.append("cf-turnstile-response", turnstileResponse);

            // 서버로 데이터를 전송
            fetch("https://api-spot.damoat.com/upload_photo.php", {
              method: "POST",
              body: formData,
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  console.log(blob.type); // 이것은 Blob의 MIME 타입을 콘솔에 로그합니다.
                  alert("사진이 성공적으로 업로드되었습니다.");
                  closeLoadingModal();
                  //clearPhotosGrid();
                  closePhotosModal();
                } else {
                  closeLoadingModal();
                  alert("업로드에 실패했습니다: " + data.error);
                }
              })
              .finally(() => {
                // 파일 입력 필드를 초기화하고 모달창을 닫기
                // 업로드 상태를 false로 설정하고, 파일 입력 필드를 초기화 그리고 모달창을 닫기
                isUploading = false;
                fileInput.value = "";
                document.getElementById("addPhotoModal").style.display = "none";
                // window.location.reload();
              });
          },
          "image/jpeg",
          0.92
        ); // JPEG 형식으로 92% 품질로 설정
      };
      image.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file); // 파일을 Data URL 형태로 읽기
  }
}

//////////////////////
///// 장소 신고 파트 /////
//////////////////////

function openReportPlace(coordinates) {
  if (confirm("해당 장소를 신고하시겠습니까?")) {
    // 신고 사유를 사용자에게서 입력받기
    var reportReason = prompt("신고 사유를 입력해주세요.\n(최대 100자)");
  
    if (reportReason !== null && reportReason.trim() !== "") {
      // 서버로 신고 요청을 보냅니다
      fetch("https://api-spot.damoat.com/report_place.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "coordinates=" + encodeURIComponent(coordinates) + "&reason=" + encodeURIComponent(reportReason),
      })
      .then((response) => response.text())
      .then((data) => {
        alert(data); // 서버로부터의 응답을 사용자에게 알리기
      })
      .catch((error) => console.error("Error:", error));
    } else {
      alert("신고 사유가 입력되지 않았습니다.");
    }
  }
}
//////////////
////장소 수정파트 /////
////////////////
function openEditPlace(coordinates) {
  // 새 창으로 열 URL 정의
  var url = '/edit?coordinates=' + encodeURIComponent(coordinates);
  // 새 창 열기
  window.open(url, '_blank');
}

///설명 더보기 파트

function openFullDescription() {
  

 var modal = document.getElementById("descriptionModal");
  modal.style.display = "block";

  
  document.getElementById("fullDescription").textContent = window.descriptionOriginal;

  // var modal = window.open("", "_blank");
  // modal.document.write("<html><body><p>" + descriptionWithBreaks + "</p></body></html>");
  // modal.document.close();
}

function closeDescriptionModal() {
  var modal = document.getElementById("descriptionModal");
  modal.style.display = "none";
}


// 스팟 공유 페이지 이동

// 스팟 공유 페이지 이동
function gotoShareSpot(lat, lng) {
  var latFixed = parseFloat(lat).toFixed(5);
  var lngFixed = parseFloat(lng).toFixed(5);

  // 마침표(.)와 쉼표(,)를 각각 %2E와 %2C로 인코딩
  latFixed = latFixed.replace(/\./g, '%2E');
  lngFixed = lngFixed.replace(/\./g, '%2E');

  // 인코딩된 좌표 문자열 결합
  const coordinates = latFixed + '%2C' + lngFixed;
  
  window.open(`https://spot.damoat.com/share/?c=${coordinates}`);
}

