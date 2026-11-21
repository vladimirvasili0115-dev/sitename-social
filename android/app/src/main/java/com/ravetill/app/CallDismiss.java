package com.ravetill.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** "Rədd et" on a ringing call: the phone stops ringing (the caller sees "no answer" when its 45 seconds end). */
public class CallDismiss extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String tag = intent.getStringExtra("tag");
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager != null && tag != null) manager.cancel(tag, PushService.CALL_ID);
    }
}
