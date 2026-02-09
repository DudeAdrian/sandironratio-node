# DEPRECATED - Use start-sofie-interface.ps1 instead
# This script is a command parser, not a real AI interface

Write-Host "========================================" -ForegroundColor Red
Write-Host "  DEPRECATED SCRIPT" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "This script was a fake command parser." -ForegroundColor Yellow
Write-Host ""
Write-Host "Use the REAL interface instead:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  .\start-sofie-interface.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "The new script:" -ForegroundColor Gray
Write-Host "  - Actually talks to Sofie's AI" -ForegroundColor Gray
Write-Host "  - Sends your messages to the LLM" -ForegroundColor Gray
Write-Host "  - Returns real AI responses" -ForegroundColor Gray
Write-Host "  - Supports voice input" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Launch the real interface now? (Y/n)"
if ($choice -ne "n") {
    & "\start-sofie-interface.ps1"
}
