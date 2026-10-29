package br.com.joyfliper;

import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.badlogic.gdx.backends.android.AndroidApplication;
import com.badlogic.gdx.backends.android.AndroidApplicationConfiguration;

import java.io.PrintWriter;
import java.io.StringWriter;

public final class AndroidLauncher extends AndroidApplication {
    private static final String PREFS = "joyfliper_diagnostics";
    private static final String LAST_CRASH = "last_crash";

    @Override protected void onCreate(Bundle savedInstanceState) {
        installCrashRecorder();
        super.onCreate(savedInstanceState);

        AndroidApplicationConfiguration config = new AndroidApplicationConfiguration();
        config.useImmersiveMode = true;
        initialize(new JoyfliperGame(), config);
        showPreviousCrashIfAny();
    }

    private void installCrashRecorder() {
        final Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, error) -> {
            try {
                StringWriter details = new StringWriter();
                error.printStackTrace(new PrintWriter(details));
                String report = "Thread: " + thread.getName() + "\n" + details;
                getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                    .putString(LAST_CRASH, report).commit();
                Log.e("JoyfliperCrash", report);
            } catch (Throwable ignored) {
                Log.e("JoyfliperCrash", "Unable to persist crash report", ignored);
            } finally {
                if (previous != null) previous.uncaughtException(thread, error);
                else android.os.Process.killProcess(android.os.Process.myPid());
            }
        });
    }

    private void showPreviousCrashIfAny() {
        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        String report = prefs.getString(LAST_CRASH, null);
        if (report == null) return;
        prefs.edit().remove(LAST_CRASH).apply();
        new Handler(Looper.getMainLooper()).post(() -> new AlertDialog.Builder(this)
            .setTitle("Joyfliper - erro anterior")
            .setMessage(report.length() > 3500 ? report.substring(0, 3500) : report)
            .setPositiveButton("Fechar", (dialog, which) -> dialog.dismiss())
            .show());
    }
}
