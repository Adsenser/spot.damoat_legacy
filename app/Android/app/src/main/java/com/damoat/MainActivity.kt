package com.damoat

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.webkit.GeolocationPermissions
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val LOCATION_PERMISSION_REQUEST_CODE = 1
    private val FILE_CHOOSER_RESULT_CODE = 2
    private var uploadMessage: ValueCallback<Array<Uri>>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        checkLocationPermission()

        webView = findViewById(R.id.webview)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.ACCESS_FINE_LOCATION)
                    == PackageManager.PERMISSION_GRANTED) {
                    // 즉시 권한을 허용
                    callback.invoke(origin, true, false)
                } else {
                    // 권한이 없는 경우, 사용자에게 권한 요청
                    ActivityCompat.requestPermissions(this@MainActivity, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), LOCATION_PERMISSION_REQUEST_CODE)
                }
            }

            // 파일 선택 처리
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                uploadMessage?.onReceiveValue(null) // 기존의 메시지가 있으면 취소
                uploadMessage = filePathCallback

                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "image/*" // 여기서 파일 타입을 지정할 수 있습니다. 예를 들어, 이미지만 선택하려면 "image/*"를 사용합니다.
                }

                startActivityForResult(intent, FILE_CHOOSER_RESULT_CODE)
                return true // onShowFileChooser가 처리되었음을 나타냅니다.
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: android.webkit.WebResourceRequest): Boolean {
                val url = request.url.toString()
                // 'https://spot.damoat.com'으로 시작하고, 'https://spot.damoat.com/share'로 시작하지 않는 경우
                if (url.startsWith("https://spot.damoat.com") && !url.startsWith("https://spot.damoat.com/share")) {
                    return false // 내부 URL은 웹뷰에서 직접 로드
                } else {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                    startActivity(intent)
                    return true // 그 외의 URL은 기본 브라우저에서 열기
                }
            }
        }


        webView.loadUrl("https://spot.damoat.com")
    }

    private fun checkLocationPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), LOCATION_PERMISSION_REQUEST_CODE)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE && grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            // 위치 권한이 승인되면, 필요한 경우 추가 작업 수행
        } else {
            // 권한 거부 시, 사용자에게 위치 권한이 필요한 이유 설명
            showLocationPermissionDeniedDialog()
        }
    }

    private fun showLocationPermissionDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle("위치 권한 필요")
            .setMessage("이 앱에서는 위치 기능이 필요합니다. 설정에서 위치 권한을 허용해주세요.")
            .setPositiveButton("설정으로 이동") { _, _ ->
                val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", packageName, null)
                }
                startActivity(intent)
            }
            .setNegativeButton("취소", null)
            .show()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (resultCode == AppCompatActivity.RESULT_OK && data != null) {
                // 사용자가 파일을 성공적으로 선택했을 경우
                val result = WebChromeClient.FileChooserParams.parseResult(resultCode, data)
                uploadMessage?.onReceiveValue(result)
            } else {
                // 사용자가 선택을 취소했거나 실패했을 경우
                uploadMessage?.onReceiveValue(null)
            }
            uploadMessage = null // 처리 후 uploadMessage를 초기화
        }
    }


    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack() // 웹뷰 내에서 뒤로 갈 수 있으면 뒤로 감
        } else {
            super.onBackPressed() // 그렇지 않으면 기본 뒤로가기 동작 수행
        }
    }
}
