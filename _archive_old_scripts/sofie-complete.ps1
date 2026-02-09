# SOFIE COMPLETE - Voice AI with TTS Response
# Wake word: "Sofie" or "Hey Sofie", then speak

$OllamaPort = 11434

# Check Ollama
try {
    Invoke-RestMethod "http://localhost:$OllamaPort/api/tags" -TimeoutSec 3 | Out-Null
} catch {
    Write-Host "ERROR: Start Ollama: ollama serve" -ForegroundColor Red
    exit 1
}

# Setup voice
try {
    python -c "import speech_recognition" 2>&1 | Out-Null
} catch {
    python -m pip install SpeechRecognition pyaudio --quiet
}

# TTS Function - Female voice
function Speak($text) {
    try {
        Add-Type -AssemblyName System.Speech
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
        # Select female voice
        $voices = $synth.GetInstalledVoices()
        $femaleVoice = $voices | Where-Object { $_.VoiceInfo.Gender -eq "Female" } | Select-Object -First 1
        if ($femaleVoice) {
            $synth.SelectVoice($femaleVoice.VoiceInfo.Name)
        }
        $synth.Speak($text)
    } catch {
        # Fallback
        try {
            $synth = New-Object -ComObject SAPI.SpVoice
            $synth.Speak($text) | Out-Null
        } catch {}
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  SOFIE - VOICE AI" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Say 'Sofie' or 'Hey Sofie' to wake me" -ForegroundColor Green
Write-Host "Then speak your message" -ForegroundColor Green
Write-Host "Or type /text to type instead" -ForegroundColor Gray
Write-Host "Say/Type 'exit' to quit" -ForegroundColor Gray
Write-Host ""

# Greeting
Speak "Hello, I am Sofie. Say my name to speak with me."

$voiceMode = $true
$lastInteraction = Get-Date

while ($true) {
    $msg = $null
    
    if ($voiceMode) {
        Write-Host "[Listening for wake word...]" -ForegroundColor DarkGray
        
        # Listen with wake word detection - longer phrase limit
        $out = "$env:TEMP\sofie_v.txt"
        @'
import speech_recognition as sr
import sys

try:
    r = sr.Recognizer()
    r.energy_threshold = 250
    r.pause_threshold = 2.0  # Longer pause allowed between words
    
    with sr.Microphone() as source:
        r.adjust_for_ambient_noise(source, duration=0.5)
        # Listen for longer - 30 seconds max phrase
        audio = r.listen(source, timeout=10, phrase_time_limit=30)
    
    text = r.recognize_google(audio).lower()
    
    # Check for wake word
    if "sofie" in text or "sophie" in text:
        # Remove wake word, keep command
        command = text.replace("sofie", "").replace("sophie", "").replace("hey", "").strip()
        if command:
            print(f"CMD:{command}")
        else:
            print("WAKE:ready")
    else:
        print(f"HEARD:{text}")
        
except sr.WaitTimeoutError:
    pass
except:
    pass
'@ | Out-File "$env:TEMP\sofie_v.py" -Encoding UTF8
        
        $p = Start-Process python -ArgumentList "$env:TEMP\sofie_v.py" -PassThru -WindowStyle Hidden -RedirectStandardOutput $out
        
        # Show waiting - wait up to 35 seconds (longer than phrase limit)
        $dots = 0
        while (-not $p.HasExited -and $dots -lt 70) {
            Write-Host "." -NoNewline -ForegroundColor Yellow
            Start-Sleep -Milliseconds 500
            $dots++
        }
        
        if (-not $p.HasExited) { Stop-Process $p.Id -Force }
        Write-Host ""
        
        # Parse result
        $heard = $null
        if (Test-Path $out) {
            $content = Get-Content $out -Raw
            if ($content) {
                $content = $content.Trim()
                if ($content -like "CMD:*") {
                    $heard = $content.Substring(4)
                    Write-Host "Sofie detected command: $heard" -ForegroundColor Green
                } elseif ($content -like "WAKE:*") {
                    Write-Host "Wake word detected - Sofie is listening" -ForegroundColor Green
                    Speak "Yes, I am here. What do you need?"
                    continue
                } elseif ($content -like "HEARD:*") {
                    $heard = $content.Substring(6)
                    Write-Host "You said: $heard" -ForegroundColor Gray
                    # Process even without wake word for now
                }
            }
        }
        
        if ($heard) {
            $msg = $heard
        } else {
            continue
        }
    } else {
        Write-Host "You: " -ForegroundColor Cyan -NoNewline
        $msg = Read-Host
    }
    
    # Commands
    if ($msg -match "^exit" -or $msg -eq "/exit") { 
        Speak "Goodbye"
        break 
    }
    if ($msg -eq "/text") { 
        $voiceMode = $false 
        Write-Host "Text mode active" -ForegroundColor Yellow 
        continue 
    }
    if ($msg -eq "/voice") { 
        $voiceMode = $true 
        Write-Host "Voice mode active - Say Sofie to wake" -ForegroundColor Green 
        Speak "Voice mode on. Say my name."
        continue 
    }
    if ([string]::IsNullOrWhiteSpace($msg)) { continue }
    
    # Get response
    Write-Host "Sofie is thinking..." -ForegroundColor Magenta -NoNewline
    
    try {
        $body = @{
            model = "llama3.1:8b"
            messages = @(
                @{ role = "system"; content = "You are Sofie, a helpful AI assistant. You can only chat and answer questions. You cannot search the internet, access GitHub, execute commands, or perform real-world actions. Be honest about your limitations. Keep responses concise." }
                @{ role = "user"; content = $msg }
            )
            stream = $false
        } | ConvertTo-Json
        
        $resp = Invoke-RestMethod "http://localhost:$OllamaPort/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
        $responseText = $resp.message.content
        
        Write-Host "`r                       `r" -NoNewline
        Write-Host "Sofie: $responseText" -ForegroundColor White
        
        # SPEAK the response
        Speak $responseText
        
    } catch {
        Write-Host "`r                       `r" -NoNewline
        Write-Host "Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Goodbye!" -ForegroundColor Green
