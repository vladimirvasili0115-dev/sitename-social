package com.ravetill.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * Notifications from the Ravetill server (Supabase function "push-send" through Firebase).
 * The server sends only data (title, body, url, tag); the app draws the notification itself, so it looks the same
 * whether the app is open, in the background or closed. Tapping it opens that page in the app.
 */
public class PushService extends FirebaseMessagingService {
    static final String CHANNEL = "ravetill";
    static final String CALL_CHANNEL = "calls";
    static final int CALL_ID = 7;
    static final String PREFS = "push";

    /** Firebase gave this phone a (new) address; the site sends it to the server the next time it is open. */
    @Override
    public void onNewToken(String token) {
        saveToken(this, token);
    }

    static void saveToken(Context context, String token) {
        context.getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString("token", token).apply();
    }

    static String token(Context context) {
        return context.getSharedPreferences(PREFS, MODE_PRIVATE).getString("token", "");
    }

    static void makeChannel(Context context) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL, context.getString(R.string.push_channel), NotificationManager.IMPORTANCE_HIGH);
        channel.enableVibration(true);
        manager.createNotificationChannel(channel);
    }

    // Incoming calls: the phone's ringtone, vibration, shown over the lock screen.
    static void makeCallChannel(Context context) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CALL_CHANNEL) != null) return;
        NotificationChannel channel = new NotificationChannel(CALL_CHANNEL, context.getString(R.string.call_channel), NotificationManager.IMPORTANCE_HIGH);
        channel.setSound(android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE),
            new android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE).setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 800, 600, 800, 600});
        channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }

    /** The site took the call over (or it ended): stop every ringing call notification. */
    static void stopCalls(Context context) {
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || Build.VERSION.SDK_INT < 23) return;
        for (android.service.notification.StatusBarNotification item : manager.getActiveNotifications()) {
            if (item.getId() == CALL_ID) manager.cancel(item.getTag(), CALL_ID);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        Map<String, String> data = message.getData();
        String title = data.get("title");
        String body = data.get("body");
        if (title == null && message.getNotification() != null) {
            title = message.getNotification().getTitle();
            body = message.getNotification().getBody();
        }
        String url = data.get("url");
        String tag = data.get("tag");
        String type = data.get("type");
        if ("call_end".equals(type)) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null && tag != null) manager.cancel(tag, CALL_ID);
            return;
        }
        if (title == null) return;
        if ("call".equals(type)) {
            ringCall(title, body == null ? "" : body, url, tag == null ? "call" : tag);
            return;
        }
        show(title, body == null ? "" : body, url, tag == null ? "ravetill" : tag);
    }

    // A call: full screen over the lock screen, the ringtone repeats until answered, declined or 45 seconds pass.
    private void ringCall(String title, String body, String answerUrl, String tag) {
        makeCallChannel(this);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;
        // Opening it (or the full screen): the app with the site's own incoming-call screen.
        Intent show = new Intent(this, MainActivity.class).setAction(Intent.ACTION_VIEW).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)
            .setData(Uri.parse("https://ravetill.com/")).putExtra(MainActivity.EXTRA_CALL, true);
        PendingIntent screen = PendingIntent.getActivity(this, ("s" + tag).hashCode(), show, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        // "Qəbul et": the site picks this call up by itself as soon as it rings there (?answer=<caller>).
        Intent answer = new Intent(this, MainActivity.class).setAction(Intent.ACTION_VIEW).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP)
            .putExtra(MainActivity.EXTRA_CALL, true).putExtra(MainActivity.EXTRA_STOP_RING, true);
        if (answerUrl != null && answerUrl.startsWith("https://")) answer.setData(Uri.parse(answerUrl));
        PendingIntent pick = PendingIntent.getActivity(this, ("a" + tag).hashCode(), answer, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent decline = new Intent(this, CallDismiss.class).putExtra("tag", tag);
        PendingIntent drop = PendingIntent.getBroadcast(this, ("d" + tag).hashCode(), decline, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        android.app.Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new android.app.Notification.Builder(this, CALL_CHANNEL) : new android.app.Notification.Builder(this);
        builder.setSmallIcon(R.drawable.ic_notify)
            .setContentTitle(title)
            .setContentText(body)
            .setCategory(android.app.Notification.CATEGORY_CALL)
            .setVisibility(android.app.Notification.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(true)
            .setContentIntent(screen)
            .setFullScreenIntent(screen, true)
            .addAction(new android.app.Notification.Action.Builder(null, getString(R.string.call_decline), drop).build())
            .addAction(new android.app.Notification.Action.Builder(null, getString(R.string.call_answer), pick).build());
        if (Build.VERSION.SDK_INT >= 26) builder.setTimeoutAfter(45000);
        if (Build.VERSION.SDK_INT < 26) {
            builder.setPriority(android.app.Notification.PRIORITY_MAX)
                .setSound(android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_RINGTONE))
                .setVibrate(new long[]{0, 800, 600, 800, 600});
        }
        android.app.Notification notification = builder.build();
        notification.flags |= android.app.Notification.FLAG_INSISTENT;
        manager.notify(tag, CALL_ID, notification);
    }

    private void show(String title, String body, String url, String tag) {
        makeChannel(this);
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;
        Intent open = new Intent(this, MainActivity.class).setAction(Intent.ACTION_VIEW).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (url != null && url.startsWith("https://")) open.setData(Uri.parse(url));
        PendingIntent tap = PendingIntent.getActivity(this, tag.hashCode(), open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        android.app.Notification.Builder builder = Build.VERSION.SDK_INT >= 26 ? new android.app.Notification.Builder(this, CHANNEL) : new android.app.Notification.Builder(this);
        builder.setSmallIcon(R.drawable.ic_notify)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new android.app.Notification.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(tap);
        if (Build.VERSION.SDK_INT < 26) builder.setPriority(android.app.Notification.PRIORITY_HIGH).setDefaults(android.app.Notification.DEFAULT_ALL);
        // The same tag replaces the older notification (e.g. several messages from one person).
        manager.notify(tag, 1, builder.build());
    }
}
