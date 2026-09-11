package com.wakialarm.alarm

import android.app.*
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.*
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import org.json.JSONObject
import java.util.Locale

class AlarmService : Service() {
    private val handler = Handler(Looper.getMainLooper())
    private var player: MediaPlayer? = null
    private var speech: TextToSpeech? = null
    private var alarm: JSONObject? = null
    private var listening = false
    private var wakeLock: PowerManager.WakeLock? = null
    private val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build()
    private val resume = Runnable { listening = false; ring() }
    override fun onBind(intent: Intent?) = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action != null) {
            if (intent.getStringExtra("id") != alarm?.optString("id")) return START_NOT_STICKY
            when (intent.action) {
                "stop" -> { AlarmStore(this).setActive(null); stopSelf() }
                "snooze" -> try { AlarmStore(this).snooze(alarm!!.getString("id")); stopSelf() } catch (_: Exception) { ring() }
                "listen" -> { listening = true; silence(); handler.postDelayed(resume, 12000) }
                "resume" -> { listening = false; handler.removeCallbacks(resume); ring() }
            }
            return START_REDELIVER_INTENT
        }
        val json = intent?.getStringExtra("alarm") ?: return START_NOT_STICKY
        silence()
        handler.removeCallbacksAndMessages(null)
        alarm = JSONObject(json)
        listening = false
        AlarmStore(this).setActive(alarm)
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(NotificationChannel("waki_ringing", "Ringing alarms", NotificationManager.IMPORTANCE_HIGH).apply {
                setSound(null, null)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            })
        }
        val open = PendingIntent.getActivity(this, 1, Intent(this, AlarmActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, "waki_ringing") else Notification.Builder(this)
        builder.setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(alarm!!.optString("label", "Wake up"))
            .setContentText("Time to wake up").setCategory(Notification.CATEGORY_ALARM).setOngoing(true)
            .setVisibility(Notification.VISIBILITY_PUBLIC).setContentIntent(open).setFullScreenIntent(open, true)
            .addAction(Notification.Action.Builder(null, "Stop", action("stop")).build())
        if (alarm!!.optBoolean("snoozeEnabled")) builder.addAction(Notification.Action.Builder(null, "Snooze", action("snooze")).build())
        startForeground(4701, builder.build())
        wakeLock?.let { if (it.isHeld) it.release() }
        wakeLock = getSystemService(PowerManager::class.java).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Waki:alarm").apply { acquire(10 * 60 * 1000L) }
        ring()
        handler.postDelayed({ speakGreeting() }, 2500)
        // Bound unattended playback; the next recurring occurrence remains scheduled.
        handler.postDelayed({ AlarmStore(this).setActive(null); stopSelf() }, 10 * 60 * 1000L)
        return START_REDELIVER_INTENT
    }

    private fun action(name: String): PendingIntent = PendingIntent.getService(this, name.hashCode(),
        Intent(this, AlarmService::class.java).setAction(name).putExtra("id", alarm!!.getString("id")), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    private fun ring() {
        if (alarm == null || listening) return
        if (player?.isPlaying == true) return
        player?.release()
        player = null
        try {
            player = MediaPlayer().apply {
                setAudioAttributes(attributes)
                setDataSource(this@AlarmService, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM) ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                isLooping = true
                prepare()
                start()
            }
        } catch (_: Exception) { player?.release(); player = null }
    }

    private fun speakGreeting() {
        if (listening || alarm == null) return
        speech?.shutdown()
        speech = TextToSpeech(this) { status ->
            if (status != TextToSpeech.SUCCESS || alarm == null || listening) return@TextToSpeech
            speech?.setAudioAttributes(attributes)
            speech?.language = Locale.getDefault()
            speech?.setSpeechRate(when (alarm?.optString("wakeUpStyle")) { "gentle" -> 0.85f; "assertive" -> 1.1f; else -> 1f })
            speech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(id: String?) {}
                override fun onDone(id: String?) { handler.post { ring() } }
                @Deprecated("Deprecated in Java") override fun onError(id: String?) { handler.post { ring() } }
            })
            player?.pause()
            val time = java.text.DateFormat.getTimeInstance(java.text.DateFormat.SHORT).format(java.util.Date())
            val message = alarm?.optString("message").orEmpty().ifBlank { "Good morning. Time to wake up." }
            if (speech?.speak("It's $time. $message", TextToSpeech.QUEUE_FLUSH, null, "wake") == TextToSpeech.ERROR) ring()
            handler.postDelayed(resume, 30000)
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
}
