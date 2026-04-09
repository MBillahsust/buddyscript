$ErrorActionPreference = "Continue"
$repoPath = (Get-Location).Path
Write-Output "RepoPath: $repoPath"

$stopped = @()
$stopFailed = @()
$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -match "^(node|npm|next)(\\.exe)?$" -and $_.CommandLine -and $_.CommandLine -like "*$repoPath*" }
foreach ($p in $procs) {
  try {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop
    $stopped += [pscustomobject]@{ PID = $p.ProcessId; Name = $p.Name; CommandLine = $p.CommandLine }
  } catch {
    $stopFailed += [pscustomobject]@{ PID = $p.ProcessId; Name = $p.Name; Reason = $_.Exception.Message }
  }
}

function Move-ChildrenWithMerge {
  param([string]$SourceDir,[string]$DestDir,[ref]$Moved,[ref]$Locked)
  if (-not (Test-Path -LiteralPath $SourceDir)) { return }
  New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
  $items = Get-ChildItem -LiteralPath $SourceDir -Force -ErrorAction SilentlyContinue
  foreach ($item in $items) {
    $src = $item.FullName
    $dst = Join-Path $DestDir $item.Name
    try {
      if (Test-Path -LiteralPath $dst) {
        if ($item.PSIsContainer) {
          Move-ChildrenWithMerge -SourceDir $src -DestDir $dst -Moved $Moved -Locked $Locked
          try { Remove-Item -LiteralPath $src -Force -ErrorAction Stop } catch {}
        } else {
          $Locked.Value += [pscustomobject]@{ Path = $src; Reason = "Destination file exists; skipped source file." }
        }
      } else {
        Move-Item -LiteralPath $src -Destination $dst -Force -ErrorAction Stop
        $Moved.Value += [pscustomobject]@{ From = $src; To = $dst }
      }
    } catch {
      $Locked.Value += [pscustomobject]@{ Path = $src; Reason = $_.Exception.Message }
    }
  }
}

$moved = @()
$locked = @()

$rootNext = Join-Path $repoPath ".next"
$legacyNext = Join-Path $repoPath "frontend/.next/root-legacy"
if (Test-Path -LiteralPath $rootNext) {
  Move-ChildrenWithMerge -SourceDir $rootNext -DestDir $legacyNext -Moved ([ref]$moved) -Locked ([ref]$locked)
  try { Remove-Item -LiteralPath $rootNext -Recurse -Force -ErrorAction Stop } catch { $locked += [pscustomobject]@{ Path = $rootNext; Reason = $_.Exception.Message } }
}

$mehedi = Join-Path $repoPath "MEHEDI"
$mehediLegacy = Join-Path $repoPath "other/archive/MEHEDI-legacy"
if (Test-Path -LiteralPath $mehedi) {
  Move-ChildrenWithMerge -SourceDir $mehedi -DestDir $mehediLegacy -Moved ([ref]$moved) -Locked ([ref]$locked)
  try { Remove-Item -LiteralPath $mehedi -Recurse -Force -ErrorAction Stop } catch { $locked += [pscustomobject]@{ Path = $mehedi; Reason = $_.Exception.Message } }
}

Write-Output "--- STOPPED PROCESSES ---"
if ($stopped.Count -eq 0) { Write-Output "None" } else { $stopped | Select-Object PID,Name,CommandLine | Format-Table -AutoSize | Out-String | Write-Output }
Write-Output "--- FAILED TO STOP ---"
if ($stopFailed.Count -eq 0) { Write-Output "None" } else { $stopFailed | Select-Object PID,Name,Reason | Format-Table -AutoSize | Out-String | Write-Output }
Write-Output "--- MOVED ITEMS ---"
if ($moved.Count -eq 0) { Write-Output "None" } else { $moved | Select-Object From,To | Format-Table -AutoSize | Out-String | Write-Output }
Write-Output "--- LOCKED / NOT MOVED ---"
if ($locked.Count -eq 0) { Write-Output "None" } else { $locked | Select-Object Path,Reason | Format-Table -AutoSize | Out-String | Write-Output }
