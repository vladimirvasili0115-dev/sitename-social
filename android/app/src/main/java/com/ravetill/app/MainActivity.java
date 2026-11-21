package com.ravetill.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedDispatcher;

import java.util.ArrayList;
import java.util.List;

/**
 * Ravetill as a real Android app: the site (ravetill.com) runs in a WebView, and the app adds what a browser
 * cannot do — during a call the sound can go to the earpiece and the screen turns off at the ear (see CallBridge).
 */
public class MainActivity extends Activity {
    private static final String HOME = "https://ravetill.com/";
    private static final int REQ_MEDIA = 1;
    private static final int REQ_FILE = 2;
    private static final int REQ_NOTIFY = 3;

    private WebView web;
    private CallBridge bridge;
    private PermissionRequest pendingMedia;
    private ValueCallback<Uri[]> pendingFiles;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        // A WebView ignores its own padding, so it sits in a frame and the frame keeps clear of the system bars.
        android.widget.FrameLayout frame = new android.widget.FrameLayout(this);
        frame.setBackgroundColor(Color.BLACK);
        frame.addView(web, new android.widget.FrameLayout.LayoutParams(android.widget.FrameLayout.LayoutParams.MATCH_PARENT, android.widget.FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(frame);
        keepClearOfSystemBars(frame);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setSupportMultipleWindows(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        // The site recognises the app by this word (also by window.RavetillNative).
        s.setUserAgentString(s.getUserAgentString() + " RavetillApp/1");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true);

        bridge = new CallBridge(this);
        web.addJavascriptInterface(bridge, "RavetillNative");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (isOurs(url)) return false;
                openOutside(url);
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> askMedia(request));
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (pendingFiles != null) pendingFiles.onReceiveValue(null);
                pendingFiles = callback;
                try {
                    startActivityForResult(params.createIntent(), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    pendingFiles = null;
                    return false;
                }
                return true;
            }
        });
        web.setDownloadListener((url, userAgent, disposition, mime, length) -> openOutside(Uri.parse(url)));

        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::goBack);
        }

        setUpNotifications();

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(startUrl(getIntent()));
    }

    private static boolean isOurs(Uri url) {
        String host = url.getHost();
        return "https".equals(url.getScheme()) && host != null && (host.equals("ravetill.com") || host.endsWith(".ravetill.com"));
    }

    private String startUrl(Intent intent) {
        Uri data = intent != null ? intent.getData() : null;
        return data != null && isOurs(data) ? data.toString() : HOME;
    }

    private void openOutside(Uri url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, url).addCategory(Intent.CATEGORY_BROWSABLE));
        } catch (ActivityNotFoundException ignored) {
            // nothing can open it
        }
    }

    // With Android 15+ the app draws under the status and navigation bars: keep the page clear of them.
    // The keyboard does not shrink the page (so the Butulka table keeps its size); like in Chrome, the page only
    // slides up as far as needed for the field being typed in to sit just above the keyboard.
    // (Android 15+ no longer does this sliding by itself for an app that draws under the bars.)
    private int keyboard = 0;
    private int slideAsk = 0;

    private void keepClearOfSystemBars(View view) {
        if (Build.VERSION.SDK_INT < 30) return;
        getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        view.setOnApplyWindowInsetsListener((v, insets) -> {
            android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            int ime = insets.getInsets(WindowInsets.Type.ime()).bottom;
            if (ime != keyboard) {
                keyboard = ime;
                slideForKeyboard(v);
            }
            return WindowInsets.CONSUMED;
        });
    }

    private void slideForKeyboard(View frame) {
        int ask = ++slideAsk;
        if (keyboard <= 0) {
            web.setTranslationY(0);
            return;
        }
        // Where the field being typed in ends (in page pixels); -1 when nothing is focused.
        web.evaluateJavascript("(function(){var e=document.activeElement;if(!e||e===document.body||e===document.documentElement)return -1;return e.getBoundingClientRect().bottom;})()", value -> {
            if (ask != slideAsk || keyboard <= 0) return;
            float bottom;
            try {
                bottom = Float.parseFloat(value);
            } catch (NumberFormatException e) {
                return;
            }
            if (bottom < 0) return;
            float density = getResources().getDisplayMetrics().density;
            // The page area still visible above the keyboard, measured from the top of the page.
            int visible = frame.getHeight() - keyboard - frame.getPaddingTop();
            float need = bottom * density + 8 * density - visible;
            web.setTranslationY(-Math.max(0, Math.min(need, keyboard)));
        });
    }

    // ---- notifications (Firebase): ask once on Android 13+, and keep this phone's address for the site ----
    private void setUpNotifications() {
        PushService.makeChannel(this);
        if (Build.VERSION.SDK_INT >= 33 && !has(Manifest.permission.POST_NOTIFICATIONS)) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFY);
        }
        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                .addOnSuccessListener(token -> { if (token != null) PushService.saveToken(this, token); });
        } catch (RuntimeException ignored) {
            // Firebase not available on this phone: the app works without notifications
        }
    }

    // ---- microphone and camera for calls ----
    private void askMedia(PermissionRequest request) {
        List<String> need = new ArrayList<>();
        for (String res : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res) && !has(Manifest.permission.RECORD_AUDIO)) need.add(Manifest.permission.RECORD_AUDIO);
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res) && !has(Manifest.permission.CAMERA)) need.add(Manifest.permission.CAMERA);
        }
        if (need.isEmpty() || Build.VERSION.SDK_INT < 23) {
            grantAllowed(request);
            return;
        }
        if (pendingMedia != null) pendingMedia.deny();
        pendingMedia = request;
        requestPermissions(need.toArray(new String[0]), REQ_MEDIA);
    }

    private boolean has(String permission) {
        return Build.VERSION.SDK_INT < 23 || checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED;
    }

    // Gives the page only what Android allowed (and only to ravetill.com).
    private void grantAllowed(PermissionRequest request) {
        Uri origin = request.getOrigin();
        if (origin == null || !isOurs(origin)) {
            request.deny();
            return;
        }
        List<String> ok = new ArrayList<>();
        for (String res : request.getResources()) {
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res) && has(Manifest.permission.RECORD_AUDIO)) ok.add(res);
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res) && has(Manifest.permission.CAMERA)) ok.add(res);
        }
        if (ok.isEmpty()) request.deny();
        else request.grant(ok.toArray(new String[0]));
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == REQ_MEDIA && pendingMedia != null) {
            PermissionRequest request = pendingMedia;
            pendingMedia = null;
            grantAllowed(request);
        }
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == REQ_FILE && pendingFiles != null) {
            pendingFiles.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            pendingFiles = null;
        }
    }

    // ---- back button: back in the site first, then leave the app ----
    private void goBack() {
        if (web != null && web.canGoBack()) web.goBack();
        else moveTaskToBack(true);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        goBack();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        Uri data = intent.getData();
        if (data != null && isOurs(data)) web.loadUrl(data.toString());
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    // The page is not paused when the app goes to the background, so a call keeps going.
    @Override
    protected void onDestroy() {
        if (bridge != null) bridge.release();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
