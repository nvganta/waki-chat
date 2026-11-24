package com.wakialarm.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import com.wakialarm.R
import org.json.JSONObject
import java.util.Locale

/** Plays the alarm sound, speaks the greeting, and handles Stop, Snooze and listening pauses. */
class AlarmService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private var player: MediaPlayer? = null
    private var speech: TextToSpeech? = null
    private var alarm: JSONObject? = null
    private var listening = false
    private var wakeLock: PowerManager.WakeLock? = null
    private val toneAttributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()
    private val speechAttributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .build()
    private val resume = Runnable { listening = false; ring() }

    override fun onBind(intent: Intent?) = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action != null) return handleAction(action, intent.getStringExtra("id"))
        val json = intent?.getStringExtra("alarm") ?: return START_NOT_STICKY
        start(JSONObject(json))
        return START_REDELIVER_INTENT
    }

    private fun handleAction(action: String, id: String?): Int {
        val current = alarm
        if (current == null) {
            // The process died while ringing; a notification button still has to clear the alarm.
            val store = AlarmStore(this)
            if (action == "stop" && store.active()?.optString("id") == id) store.setActive(null)
            stopSelf()
            return START_NOT_STICKY
        }
        if (id != current.optString("id")) return START_NOT_STICKY
        when (action) {
            "stop" -> {
                AlarmStore(this).setActive(null)
                stopSelf()
            }
            "snooze" -> try {
                AlarmStore(this).snooze(current.getString("id"))
                stopSelf()
            } catch (error: Exception) {
                Log.w(TAG, "Snooze failed; still ringing", error)
                ring()
            }
            "listen" -> {
                listening = true
                silence()
                handler.postDelayed(resume, 12_000)
            }
            "resume" -> {
                listening = false
                handler.removeCallbacks(resume)
                ring()
            }
        }
        return START_REDELIVER_INTENT
    }

    private fun start(next: JSONObject) {
        silence()
        handler.removeCallbacksAndMessages(null)
        alarm = next
        listening = false
        AlarmStore(this).setActive(next)
        startForeground(NOTIFICATION_ID, notification(next))
        wakeLock?.let { if (it.isHeld) it.release() }
        wakeLock = getSystemService(PowerManager::class.java)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Waki:alarm")
            .apply { acquire(RING_LIMIT_MS) }
        ring()
        handler.postDelayed({ speakGreeting() }, 2_500)
        // Bound unattended playback; the next recurring occurrence remains scheduled.
        handler.postDelayed({
            AlarmStore(this).setActive(null)
            stopSelf()
        }, RING_LIMIT_MS)
    }

    private fun notification(alarm: JSONObject): Notification {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) {
            val channel = NotificationChannel(CHANNEL, "Ringing alarms", NotificationManager.IMPORTANCE_HIGH).apply {
                setSound(null, null)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            manager.createNotificationChannel(channel)
        }
        val screen = Intent(this, AlarmActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val open = PendingIntent.getActivity(
            this,
            1,
            screen,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, CHANNEL) else Notification.Builder(this)
        builder.setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(alarm.optString("label", "Wake up"))
            .setContentText("Time to wake up")
            .setCategory(Notification.CATEGORY_ALARM)
            .setOngoing(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setContentIntent(open)
            .setFullScreenIntent(open, true)
            .addAction(Notification.Action.Builder(null, "Stop", action("stop", alarm)).build())
        if (alarm.optBoolean("snoozeEnabled")) {
            builder.addAction(Notification.Action.Builder(null, "Snooze", action("snooze", alarm)).build())
        }
        return builder.build()
    }

    private fun action(name: String, alarm: JSONObject): PendingIntent {
        val intent = Intent(this, AlarmService::class.java).setAction(name).putExtra("id", alarm.getString("id"))
        return PendingIntent.getService(
            this,
            name.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun ring() {
        if (alarm == null || listening || player?.isPlaying == true) return
        player?.release()
        player = null
        val systemSound = RingtoneManager.getActualDefaultRingtoneUri(this, RingtoneManager.TYPE_ALARM)
        play(AlarmRules.sounds(systemSound?.toString()))
    }

    /** Tries each sound in order; a source that fails to load or errors mid-play falls through. */
    private fun play(sounds: List<AlarmSound>) {
        val sound = sounds.firstOrNull()
        if (sound == null) {
            Log.e(TAG, "No alarm sound could play")
            return
        }
        val candidate = MediaPlayer()
        try {
            candidate.setAudioAttributes(toneAttributes)
            when (sound) {
                is AlarmSound.System -> candidate.setDataSource(this, Uri.parse(sound.uri))
                AlarmSound.Bundled -> resources.openRawResourceFd(R.raw.alarm_fallback).use {
                    candidate.setDataSource(it.fileDescriptor, it.startOffset, it.length)
                }
            }
            candidate.isLooping = true
            candidate.setOnErrorListener { failed, _, _ ->
                failed.release()
                if (player === failed) player = null
                play(sounds.drop(1))
                true
            }
            candidate.prepare()
            candidate.start()
            player = candidate
            Log.i(TAG, "Playing ${if (sound is AlarmSound.Bundled) "bundled tone" else "system alarm sound"}")
        } catch (error: Exception) {
            Log.w(TAG, "Alarm sound failed: $sound", error)
            candidate.release()
            play(sounds.drop(1))
        }
    }

    private fun speakGreeting() {
        if (listening || alarm == null) return
        speech?.shutdown()
        speech = TextToSpeech(this) { status ->
            // Without TTS (for example before the first unlock) the alarm simply keeps ringing.
            if (status != TextToSpeech.SUCCESS || alarm == null || listening) return@TextToSpeech
            val voice = speech ?: return@TextToSpeech
            voice.setAudioAttributes(speechAttributes)
            voice.language = Locale.getDefault()
            voice.setSpeechRate(
                when (alarm?.optString("wakeUpStyle")) {
                    "gentle" -> 0.85f
                    "assertive" -> 1.1f
                    else -> 1f
                },
            )
            voice.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(id: String?) {}
                override fun onDone(id: String?) { handler.post { ring() } }
                @Deprecated("Deprecated in Java")
                override fun onError(id: String?) { handler.post { ring() } }
            })
            player?.pause()
            val time = java.text.DateFormat.getTimeInstance(java.text.DateFormat.SHORT).format(java.util.Date())
            val message = alarm?.optString("message").orEmpty().ifBlank { "Good morning. Time to wake up." }
            if (voice.speak("It's $time. $message", TextToSpeech.QUEUE_FLUSH, null, "wake") == TextToSpeech.ERROR) {
                ring()
            }
            handler.postDelayed(resume, 30_000)
        }
    }

    private fun silence() {
        handler.removeCallbacks(resume)
        speech?.stop()
        player?.release()
        player = null
    }

    override fun onDestroy() {
        alarm = null
        silence()
        speech?.shutdown()
        handler.removeCallbacksAndMessages(null)
        wakeLock?.let { if (it.isHeld) it.release() }
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    companion object {
        private const val TAG = "WakiAlarm"
        private const val CHANNEL = "waki_ringing"
        private const val NOTIFICATION_ID = 4701
        private const val RING_LIMIT_MS = 10 * 60 * 1000L
    }
}
