# Voice AI - Working Version
# Speaks to Ollama directly, no broken intermediaries

$OllamaPort = 11434

# Check Ollama
try {
    Invoke-RestMethod "http://localhost:$OllamaPort/api/tags" -TimeoutSec 3 | Out-Null
} catch {
    Write-Host "ERROR: Start Ollama first: ollama serve" -ForegroundColor Red
    exit 1
}

# Install voice if needed
try {
    python -c "import speech_recognition" 2>&1 | Out-Null
} catch {
    Write-Host "Installing voice..." -ForegroundColor Yellow
    python -m pip install SpeechRecognition pyaudio --quiet
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  VOICE AI READY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Speak now (loud and clear)" -ForegroundColor Green
Write-Host "Or type your message" -ForegroundColor Gray
Write-Host "Say 'exit' or type /exit to quit" -ForegroundColor Gray
Write-Host ""

$voiceMode = $true

while ($true) {
    $msg = $null
    
    if ($voiceMode) {
        Write-Host "Listening... " -ForegroundColor Yellow -NoNewline
        
        # Voice capture
        $out = "$env:TEMP\v.txt"
        @'
import speech_recognition as sr
try:
    r = sr.Recognizer()
    r.energy_threshold = 400
    r.dynamic_energy_threshold = True
    with sr.Microphone() as source:
        print("[adjusting mic]")
        r.adjust_for_ambient_noise(source, duration=1)
        print("[listening]")
        audio = r.listen(source, timeout=8, phrase_time_limit=10)
    print("[recognizing]")
    text = r.recognize_google(audio)
    print(text)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
'@ | Out-File "$env:TEMP\v.py" -Encoding UTF8
        
        $p = Start-Process python -ArgumentList "$env:TEMP\v.py" -PassThru -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError "$env:TEMP\v.err"
        
        # Wait with feedback
        for ($i = 0; $i -lt 20 -and -not $p.HasExited; $i++) {
            Write-Host "." -NoNewline -ForegroundColor Yellow
            Start-Sleep -Milliseconds 500
        }
        
        if (-not $p.HasExited) { Stop-Process $p.Id -Force }
        
        # Get result
        $heard = $null
        if (Test-Path $out) {
            $content = Get-Content $out -Raw
            if ($content -and $content.Trim()) {
                $heard = $content.Trim()
            }
        }
        
        Write-Host ""
        
        if ($heard -and $heard -notlike "Error:*" -and $heard -notlike "[*]") {
            Write-Host "You: $heard" -ForegroundColor White
            $msg = $heard
        } else {
            Write-Host "(didn't hear - try again or type /text)" -ForegroundColor Gray
            continue
        }
    } else {
        Write-Host "You: " -ForegroundColor Cyan -NoNewline
        $msg = Read-Host
    }
    
    # Handle commands
    if ($msg -eq "/exit" -or $msg -eq "exit" -or $msg -eq "quit") { break }
    if ($msg -eq "/text") { $voiceMode = $false; Write-Host "Text mode" -ForegroundColor Yellow; continue }
    if ($msg -eq "/voice") { $voiceMode = $true; Write-Host "Voice mode - SPEAK NOW" -ForegroundColor Green; continue }
    if ([string]::IsNullOrWhiteSpace($msg)) { continue }
    
    # Get AI response
    Write-Host "Thinking..." -ForegroundColor Magenta -NoNewline
    
    try {
        $body = @{
            model = "llama3.1:8b"
            messages = @(
                @{ role = "system"; content = "You are a helpful AI assistant." }
                @{ role = "user"; content = $msg }
            )
            stream = $false
        } | ConvertTo-Json
        
        $resp = Invoke-RestMethod "http://localhost:$OllamaPort/api/chat" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 60
        Write-Host "`r                 `r" -NoNewline
        Write-Host "AI: $($resp.message.content)" -ForegroundColor White
    } catch {
        Write-Host "`r                 `r" -NoNewline
        Write-Host "Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Goodbye!" -ForegroundColor Green
