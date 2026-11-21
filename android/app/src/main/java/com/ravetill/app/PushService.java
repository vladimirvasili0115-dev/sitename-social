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

    @Override
    public void onMessageReceived(RemoteMessage message) {
        Map<String, String> data = message.getData();
        String title = data.get("title");
        String body = data.get("body");
        if (title == null && message.getNotification() != null) {
            title = message.getNotification().getTitle();
            body = message.getNotification().getBody();
        }
        if (title == null) return;
        String url = data.get("url");
        String tag = data.get("tag");
        show(title, body == null ? "" : body, url, tag == null ? "ravetill" : tag);
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
