package com.ravetill.app;

import android.app.Activity;
import android.content.Context;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.PowerManager;
import android.webkit.JavascriptInterface;

import java.util.List;

/**
 * What the site can ask the app during a call (window.RavetillNative in the page):
 *  callStart()          — the call began: phone-call sound mode, loudspeaker first (as before).
 *  setSpeaker(boolean)  — true = loudspeaker; false = earpiece, and the screen turns off when the phone is at the ear.
 *  callEnd()            — back to normal.
 *  pushToken(), pushAllowed() — this phone's notification address, and whether notifications are on.
 *  stopRinging()        — the site shows the incoming call itself: the call notification stops ringing.
 * deviceId(), deviceModel() — this phone's Android ID and model, so a moderator can block the device.
 */
public class CallBridge {
    private final Activity activity;
    private final AudioManager audio;
    private final PowerManager.WakeLock proximity;
    private boolean inCall = false;

    CallBridge(Activity activity) {
        this.activity = activity;
        this.audio = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);
        PowerManager power = (PowerManager) activity.getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock lock = null;
        if (power != null && power.isWakeLockLevelSupported(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK)) {
            lock = power.newWakeLock(PowerManager.PROXIMITY_SCREEN_OFF_WAKE_LOCK, "ravetill:call-ear");
            lock.setReferenceCounted(false);
        }
        this.proximity = lock;
    }

    @JavascriptInterface
    public boolean isApp() {
        return true;
    }

    /** This phone's Android ID for this app (stays the same after reinstalling; changes only on a factory reset). Used to block a device. */
    @JavascriptInterface
    public String deviceId() {
        String id = android.provider.Settings.Secure.getString(activity.getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
        return id == null ? "" : id;
    }

    /** The phone's maker and model, e.g. "samsung SM-A515F". */
    @JavascriptInterface
    public String deviceModel() {
        return (Build.MANUFACTURER + " " + Build.MODEL).trim();
    }

    /** This phone's Firebase address for notifications ("" until Firebase has given one). The site saves it on the server. */
    @JavascriptInterface
    public String pushToken() {
        return PushService.token(activity);
    }

    /** False when the player turned notifications off for the app (the site can then say so). */
    @JavascriptInterface
    public boolean pushAllowed() {
        android.app.NotificationManager manager = activity.getSystemService(android.app.NotificationManager.class);
        return manager == null || manager.areNotificationsEnabled();
    }

    /** True when the phone has a proximity sensor, so the screen can turn off at the ear. */
    @JavascriptInterface
    public boolean hasProximity() {
        return proximity != null;
    }

    /** The site shows the incoming call itself now: the notification stops ringing. */
    @JavascriptInterface
    public void stopRinging() {
        activity.runOnUiThread(() -> PushService.stopCalls(activity));
    }

    @JavascriptInterface
    public void callStart() {
        activity.runOnUiThread(() -> {
            if (audio == null) return;
            inCall = true;
            audio.setMode(AudioManager.MODE_IN_COMMUNICATION);
            route(true);
        });
    }

    @JavascriptInterface
    public void setSpeaker(boolean on) {
        activity.runOnUiThread(() -> {
            if (audio == null || !inCall) return;
            route(on);
        });
    }

    @JavascriptInterface
    public void callEnd() {
        activity.runOnUiThread(this::release);
    }

    void release() {
        inCall = false;
        if (proximity != null && proximity.isHeld()) proximity.release();
        if (audio == null) return;
        if (Build.VERSION.SDK_INT >= 31) audio.clearCommunicationDevice();
        else setSpeakerOld(false);
        audio.setMode(AudioManager.MODE_NORMAL);
    }

    private void route(boolean speaker) {
        if (Build.VERSION.SDK_INT >= 31) {
            int want = speaker ? AudioDeviceInfo.TYPE_BUILTIN_SPEAKER : AudioDeviceInfo.TYPE_BUILTIN_EARPIECE;
            List<AudioDeviceInfo> devices = audio.getAvailableCommunicationDevices();
            boolean done = false;
            for (AudioDeviceInfo device : devices) {
                if (device.getType() == want) {
                    done = audio.setCommunicationDevice(device);
                    break;
                }
            }
            if (!done && !speaker) audio.clearCommunicationDevice();
        } else {
            setSpeakerOld(speaker);
        }
        // Screen off at the ear only in earpiece mode; on loudspeaker the screen stays on.
        if (proximity != null) {
            if (!speaker && !proximity.isHeld()) proximity.acquire(4 * 60 * 60 * 1000L);
            if (speaker && proximity.isHeld()) proximity.release();
        }
    }

    @SuppressWarnings("deprecation")
    private void setSpeakerOld(boolean on) {
        audio.setSpeakerphoneOn(on);
    }
}
