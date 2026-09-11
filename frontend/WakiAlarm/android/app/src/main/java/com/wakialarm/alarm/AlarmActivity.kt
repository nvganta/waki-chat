package com.wakialarm.alarm

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.*
import android.speech.*
import android.view.Gravity
import android.view.WindowManager
import android.widget.*

class AlarmActivity : Activity(), RecognitionListener {
    override fun onNewIntent(intent: Intent) { super.onNewIntent(intent); setIntent(intent); recreate() }
    private var recognizer: SpeechRecognizer? = null
    private var id = ""
    private lateinit var status: TextView
    private val handler = Handler(Looper.getMainLooper())
    private var listening = false
    private val poll = object : Runnable {
        override fun run() {
            if (AlarmStore(this@AlarmActivity).active()?.optString("id") != id) finish()
            else handler.postDelayed(this, 500)
        }
    }

    override fun onCreate(state: Bundle?) {
        super.onCreate(state)
        if (Build.VERSION.SDK_INT >= 27) { setShowWhenLocked(true); setTurnScreenOn(true) }
        else window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        val alarm = AlarmStore(this).active() ?: run { finish(); return }
        id = alarm.getString("id")
        val layout = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = Gravity.CENTER; setPadding(36, 60, 36, 60); setBackgroundColor(Color.rgb(26, 26, 46)) }
        fun text(value: String, size: Float) = TextView(this).apply { text = value; textSize = size; setTextColor(Color.WHITE); gravity = Gravity.CENTER; setPadding(0, 20, 0, 20) }
        fun button(label: String, action: () -> Unit) { layout.addView(Button(this).apply { text = label; setOnClickListener { action() } }, LinearLayout.LayoutParams(-1, -2)) }
        layout.addView(text(java.text.DateFormat.getTimeInstance(java.text.DateFormat.SHORT).format(java.util.Date()), 42f))
        layout.addView(text(alarm.optString("label", "Wake up"), 26f))
        status = text("Good morning", 18f)
        layout.addView(status)
        button("Stop alarm") { send("stop"); finish() }
        if (alarm.optBoolean("snoozeEnabled")) button("Snooze ${alarm.optInt("snoozeDuration", 10)} minutes") { snooze() }
        button("Speak a command") { listen() }
        setContentView(layout)
        handler.post(poll)
    }

    private fun send(action: String) { startService(Intent(this, AlarmService::class.java).setAction(action).putExtra("id", id)) }
    private fun snooze() {
        if (!AlarmStore(this).allowed()) { status.text = "Snooze needs Alarms & reminders permission. Use Stop for now."; return }
        if (AlarmStore(this).active()?.optBoolean("snoozeEnabled") != true) { status.text = "Snooze is disabled for this alarm."; return }
        send("snooze")
        // The service clears the active alarm only after successfully scheduling snooze.
    }
    private fun listen() {
        if (listening) return
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 81); return
        }
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { status.text = "Speech recognition is unavailable. Use the buttons."; return }
        send("listen")
        listening = true
        status.text = "Listening… Say ‘stop’ or ‘snooze’."
        recognizer?.destroy()
        recognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
            setRecognitionListener(this@AlarmActivity)
            startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US"))
        }
    }
    override fun onRequestPermissionsResult(code: Int, permissions: Array<out String>, results: IntArray) {
        super.onRequestPermissionsResult(code, permissions, results)
        if (code == 81 && results.firstOrNull() == PackageManager.PERMISSION_GRANTED) listen()
        else status.text = "Microphone permission was not granted. Use the buttons."
    }
    override fun onResults(results: Bundle?) {
        listening = false
        val text = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
        send("resume")
        when (AlarmRules.command(text)) {
            "stop" -> { send("stop"); finish() }
            "snooze" -> snooze()
            else -> status.text = "Not recognized. Say ‘stop’ or ‘snooze’, or use the buttons."
        }
    }
    override fun onError(error: Int) { listening = false; status.text = "Couldn't hear a command. Try again or use the buttons."; send("resume") }
    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}
    override fun onStop() { recognizer?.cancel(); listening = false; if (!isFinishing) send("resume"); super.onStop() }
    override fun onDestroy() { handler.removeCallbacksAndMessages(null); recognizer?.destroy(); super.onDestroy() }
}
