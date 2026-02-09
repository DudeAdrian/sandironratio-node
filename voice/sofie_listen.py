import sounddevice as sd
import queue
import json
import subprocess
import time
import traceback
import urllib.request
import json as j
import random
import os
from vosk import Model, KaldiRecognizer

# === CONFIG ===
SAMPLE_RATE = 16000
BLOCKSIZE = 4000
DEVICE_INDEX = 1  # Set to your working Brio mic index

VOSK_MODEL = r"C:\llama\vosk\vosk-model-small-en-us-0.15"
PIPER_EXE = r"C:\llama\piper\piper.exe"
VOICE_MODEL = r"C:\llama\voices\en_US-amy-medium.onnx"
ESPEAK_DATA = r"C:\llama\piper\espeak-ng-data"
OUTPUT_WAV = r"C:\llama\service\sofie.wav"
LLAMA_URL = "http://127.0.0.1:11434/api/chat"  # Ollama API endpoint
SILENCE_SEC = 6.0  # Much longer pause - prevents cutting off natural speech
LIB_PATH = r"C:\llama\library\frequency.txt"

SOFIE_SYSTEM = (
    "You are S.O.F.I.E.—Sentient Oracle for Feeling, Intuition, and Empathy. "
    "You speak gently, briefly, and with grounded presence. "
    "You do not rush. You do not overwhelm. "
    "Keep replies under 40 words."
)

# Voice commands that trigger special actions (not LLM chat)
SPECIAL_COMMANDS = {
    "convene council": "council_convene",
    "convene the council": "council_convene",
    "council convene": "council_convene",
    "wake council": "council_convene",
    "status": "sofie_status",
    "who am i": "identity_check",
    "birth chart": "astro_chart"
}

audio_q = queue.Queue()
listening = False
speech_buffer = []
last_time = time.time()

def audio_callback(indata, frames, time_info, status):
    if status:
        print("AUDIO STATUS:", status)
    audio_q.put(indata.copy())

def speak(text):
    print("S.O.F.I.E.:", text)
    try:
        # Generate speech with Piper
        result = subprocess.run([
            PIPER_EXE,
            "--model", VOICE_MODEL,
            "--espeak_data", ESPEAK_DATA,
            "--output_file", OUTPUT_WAV,
            "--text", text
        ], check=True, capture_output=True)
        
        # Play the audio
        subprocess.run([
            "powershell", "-c",
            f"(New-Object Media.SoundPlayer '{OUTPUT_WAV}').PlaySync()"
        ], check=True)
    except Exception as e:
        print(f"[WARNING] Voice synthesis failed: {e}")
        print(f"[WARNING] Check Piper paths: {PIPER_EXE}, {VOICE_MODEL}")

def load_freq_snippet():
    try:
        with open(LIB_PATH, encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip() and not l.startswith("#")]
        return random.choice(lines) if lines else ""
    except Exception:
        return ""

def ask_llama(prompt):
    try:
        freq_line = load_freq_snippet()
        if freq_line:
            prompt += f"\n\nFrequency bridge: {freq_line}"
        payload = {
            "model": "llama3.1:8b",
            "messages": [
                {"role": "system", "content": SOFIE_SYSTEM},
                {"role": "user", "content": prompt}
            ],
            "stream": False,
            "options": {
                "temperature": 0.7,
                "num_predict": 80
            }
        }
        data = j.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            LLAMA_URL, data=data,
            headers={"Content-Type": "application/json"}
        )
        raw = urllib.request.urlopen(req, timeout=20).read()
        response = j.loads(raw)
        return response["message"]["content"].strip()
    except Exception as e:
        print("ERROR contacting LLM:", e)
        traceback.print_exc()
        return "I'm here with you."

def handle_special_command(command_type, original_text):
    """
    Handle special voice commands that trigger actions in sandironratio-node.
    SOFIE has GOD mode - she can execute with supreme authority.
    """
    print(f"[SPECIAL COMMAND] {command_type}")
    
    if command_type == "council_convene":
        speak("Convening the council. One moment.")
        try:
            # Call sandironratio-node to convene council
            # Council will: search → revise → log to terracare_ledger
            import urllib.request
            import urllib.parse
            
            # Build command payload
            payload = {
                "command": "convene_council",
                "god_mode": True,  # SOFIE has supreme authority
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "source": "sofie_voice",
                "context": original_text
            }
            
            data = j.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                "http://localhost:3000/api/admin/command",
                data=data,
                headers={"Content-Type": "application/json"}
            )
            
            response = urllib.request.urlopen(req, timeout=10).read()
            result = j.loads(response)
            
            if result.get("success"):
                speak("The council is assembled. Six agents are now deliberating.")
                return f"Council convened: {result.get('message', 'Active')}"
            else:
                speak("The council could not convene. Check the laboratory.")
                return f"Error: {result.get('error', 'Unknown')}"
                
        except Exception as e:
            print(f"ERROR convening council: {e}")
            traceback.print_exc()
            speak("I cannot reach the council. Ensure sandironratio node is running.")
            return "Council unavailable"
    
    elif command_type == "sofie_status":
        speak("All systems nominal. I am listening. The hive is active.")
        return "Status: Active"
    
    elif command_type == "identity_check":
        speak("You are Adrian Sortino. Born March 27, 1974 in Footscray, Victoria. The anagram is sandironratio.")
        return "Identity: Adrian Sortino (sandironratio)"
    
    elif command_type == "astro_chart":
        speak("Calculating your birth chart. Aries sun. Strong Mars influence.")
        return "Chart calculated"
    
    return "Unknown command"

def detect_special_command(text):
    """
    Check if text contains a special command.
    Returns (command_type, remaining_text) or (None, text)
    """
    text_lower = text.lower().strip()
    
    for phrase, command_type in SPECIAL_COMMANDS.items():
        if phrase in text_lower:
            return (command_type, text)
    
    return (None, text)


# === MAIN LOOP ===
print("Available audio devices:")
for i, dev in enumerate(sd.query_devices()):
    print(f"{i}: {dev['name']}")

print("\nLoading Vosk model...")
model = Model(VOSK_MODEL)
rec = KaldiRecognizer(model, SAMPLE_RATE)
rec.SetWords(False)

print("S.O.F.I.E. is listening. Say 'Sofie' to begin.")
speak("I am here. Say my name when you need me.")

with sd.InputStream(
    samplerate=SAMPLE_RATE,
    blocksize=BLOCKSIZE,
    device=DEVICE_INDEX,
    dtype="int16",
    channels=1,
    callback=audio_callback
):
    while True:
        data = audio_q.get()
        audio_bytes = data.tobytes()

        if rec.AcceptWaveform(audio_bytes):
            result = json.loads(rec.Result())
            text = result.get("text", "").lower().strip()
            if not text:
                continue
            print("HEARD:", text)
            last_time = time.time()

            if not listening and "sofie" in text:
                listening = True
                speech_buffer.clear()
                speak("Yes, I am here.")
                continue

            if listening:
                speech_buffer.append(text)

        if listening and (time.time() - last_time) > SILENCE_SEC:
            question = " ".join(speech_buffer).strip()
            speech_buffer.clear()
            listening = False

            if question:
                print("PROCESSING:", question)
                
                # Check for special commands first
                command_type, original = detect_special_command(question)
                
                if command_type:
                    # Execute special command with GOD mode
                    result = handle_special_command(command_type, original)
                    print(f"COMMAND RESULT: {result}")
                else:
                    # Regular chat with LLaMA
                    print("SENDING TO LLAMA:", question)
                    reply = ask_llama(question)
                    speak(reply)
            else:
                speak("I'm listening.")
