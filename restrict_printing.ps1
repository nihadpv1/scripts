$printerName = "Canon iR2004/2204 V4"
$logFile = "C:\Scripts\PrintBlockLog.txt"

# Create log file if it doesn't exist
if (!(Test-Path $logFile)) {
    New-Item -ItemType File -Path $logFile -Force | Out-Null
}

function Write-Log {
    param ([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $message" | Out-File -Append -FilePath $logFile -Encoding utf8
}


function Block-PrintJob {
    param ($job)
    Remove-PrintJob -PrinterName $printerName -ID $job.ID  # ❌ Remove the job
    Write-Log "❌ Blocked: $($job.DocumentName) - $($job.TotalPages) pages - Sent by: $($job.Submitter)"
}

Write-Log "🟢 Script started - Monitoring printer: $printerName"

while ($true) {
    $printJobs = Get-PrintJob -PrinterName $printerName
    foreach ($job in $printJobs) {
        if ($job.TotalPages -gt 1) {  # Only block multi-page prints
            Block-PrintJob -job $job
        }
    }
    Start-Sleep -Milliseconds 500  # ⏳ Faster checking (0.5s instead of 1s)
}
