#Requires -Version 5.1
<#
  DC ARCHIVE IDENTIFIER  v1.0
  Works out what badly-named archives actually are, by reading their contents.

  The problem it solves: marketplace and drive downloads arrive as free.zip,
  free (2).zip, files (3).zip, drive-download-2026...zip, or a bare GUID. Those
  are different products sharing a useless filename - not duplicates. A zip still
  carries its real top-level folder name inside it, and usually a readme or
  licence, so its identity is readable without extracting anything.

  SAFETY
    - REPORT ONLY by default. -Rename is required to change any filename.
    - Reads archive entry TABLES. Never extracts, never writes into an archive.
    - Renames only; never moves, never deletes, never overwrites. A name clash
      gets a short content-hash suffix.
    - Writes undo.ps1 restoring every original filename.
    - Validates paths and tool availability before any mutation.

  USAGE
    .\identify_archives.ps1                 # report what everything really is
    .\identify_archives.ps1 -Rename         # apply the proposed names
    .\identify_archives.ps1 -AllArchives    # inspect every archive, not just vague ones

  UNVERIFIED: authored without PowerShell available. Not parsed, not run.
  The default path only reads, and writes only its own report.
#>
[CmdletBinding()]
param(
  [string[]] $Roots = @((Join-Path $env:USERPROFILE 'Downloads'),
                        (Join-Path $env:USERPROFILE 'DC-EVOD')),
  [string]   $ReportDir = (Join-Path $env:USERPROFILE 'AUTOMATON BUILDS\ARCHIVE_IDENT'),
  [switch]   $Rename,
  [switch]   $AllArchives
)

$ErrorActionPreference = 'Continue'

# names that tell you nothing about the contents
$vaguePatterns = @(
  '^free',  '^download', '^files?\b', '^archive', '^new\b', '^untitled',
  '^asset', '^drive-download', '^export', '^\d+$', '^copy of',
  '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-',      # GUID
  '^[0-9a-f]{16,}$'                              # bare hash
)
$modelExt = @('.obj','.fbx','.glb','.gltf','.ply','.stl','.blend','.ztl','.zpr','.zbp')
$imgExt   = @('.png','.jpg','.jpeg','.webp','.tga','.psd','.tif','.exr')

# --- validate before anything ------------------------------------------------
$live = @()
foreach ($r in $Roots) {
  if (Test-Path -LiteralPath $r) { $live += $r }
  else { Write-Host "skipping missing root: $r" -ForegroundColor Yellow }
}
if ($live.Count -eq 0) {
  Write-Host "ABORT: none of the given roots exist. Pass real paths with -Roots." -ForegroundColor Red
  exit 1
}
try { Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop }
catch {
  Write-Host "ABORT: cannot load System.IO.Compression.FileSystem - no way to read zips." -ForegroundColor Red
  exit 1
}
# 7-Zip is optional; without it .7z/.rar can only be reported, not inspected
$sevenZip = $null
foreach ($c in @('7z', 'C:\Program Files\7-Zip\7z.exe', 'C:\Program Files (x86)\7-Zip\7z.exe')) {
  $r = Get-Command $c -ErrorAction SilentlyContinue
  if ($r) { $sevenZip = $r.Source; break }
  if (Test-Path -LiteralPath $c) { $sevenZip = $c; break }
}
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

Write-Host "`nDC ARCHIVE IDENTIFIER v1.0" -ForegroundColor Cyan
Write-Host ("mode  : {0}" -f $(if ($Rename) { 'RENAME - filenames will change' } else { 'REPORT ONLY - nothing will change' })) -ForegroundColor $(if ($Rename) { 'Yellow' } else { 'Green' })
Write-Host ("7-Zip : {0}" -f $(if ($sevenZip) { $sevenZip } else { 'not found - .7z/.rar will be listed but not inspected' }))
foreach ($r in $live) { Write-Host "root  : $r" }

# --- identify ----------------------------------------------------------------
function Get-ZipIdentity($path) {
  $out = [ordered]@{ TopFolder=''; Entries=0; Models=0; Images=0; Readme=''; Sample='' }
  try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
    try {
      $tops = @{}
      foreach ($e in $zip.Entries) {
        $out.Entries++
        $parts = $e.FullName -split '/'
        if ($parts.Count -gt 1 -and $parts[0]) { $tops[$parts[0]] = 1 }
        $x = [System.IO.Path]::GetExtension($e.FullName).ToLower()
        if ($modelExt -contains $x) { $out.Models++ ; if (-not $out.Sample) { $out.Sample = $e.Name } }
        elseif ($imgExt -contains $x) { $out.Images++ }
        if (-not $out.Readme -and $e.Name -match '(?i)^(readme|licen[cs]e|credits|about)') { $out.Readme = $e.Name }
      }
      # a single top-level folder is the strongest identity clue there is
      $keys = @($tops.Keys)
      if ($keys.Count -eq 1) { $out.TopFolder = $keys[0] }
      elseif ($keys.Count -gt 1) { $out.TopFolder = "($($keys.Count) top-level folders)" }
    } finally { $zip.Dispose() }
  } catch { $out.TopFolder = 'UNREADABLE (encrypted or corrupt)' }
  return $out
}

$rows = New-Object System.Collections.ArrayList
foreach ($root in $live) {
  Get-ChildItem -LiteralPath $root -Recurse -File -Force -ErrorAction SilentlyContinue |
  Where-Object { $_.Extension.ToLower() -in @('.zip','.7z','.rar') } |
  ForEach-Object {
    $base = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    $isVague = $false
    foreach ($p in $vaguePatterns) { if ($base -match $p) { $isVague = $true; break } }
    if (-not ($isVague -or $AllArchives)) { return }

    Write-Host ("    reading {0} ({1} MB)" -f $_.Name, [int]($_.Length/1MB)) -ForegroundColor DarkGray

    $id = $null
    if ($_.Extension.ToLower() -eq '.zip') { $id = Get-ZipIdentity $_.FullName }
    else {
      $id = [ordered]@{ TopFolder='NOT INSPECTED'; Entries=0; Models=0; Images=0; Readme=''; Sample='' }
      if ($sevenZip) {
        try {
          $listing = & $sevenZip l -ba -slt "$($_.FullName)" 2>$null
          $paths = @($listing | Where-Object { $_ -like 'Path = *' } | ForEach-Object { $_.Substring(7) })
          $id.Entries = $paths.Count
          $tops = @{}
          foreach ($p in $paths) {
            $seg = ($p -split '[\\/]')[0]
            if ($seg -and $p -match '[\\/]') { $tops[$seg] = 1 }
            $x = [System.IO.Path]::GetExtension($p).ToLower()
            if ($modelExt -contains $x) { $id.Models++ } elseif ($imgExt -contains $x) { $id.Images++ }
          }
          $k = @($tops.Keys)
          $id.TopFolder = if ($k.Count -eq 1) { $k[0] } elseif ($k.Count -gt 1) { "($($k.Count) top-level folders)" } else { '' }
        } catch { $id.TopFolder = 'UNREADABLE via 7-Zip' }
      }
    }

    # propose a name from the strongest available clue
    $proposed = ''
    if ($id.TopFolder -and $id.TopFolder -notmatch '^\(|^NOT |^UNREADABLE') {
      $proposed = ($id.TopFolder -replace '[^\w\-. ]','_').Trim()
    }
    if ($proposed -and $proposed -ne $base) { $proposed = "$proposed$($_.Extension)" } else { $proposed = '' }

    [void]$rows.Add([pscustomobject]@{
      Name      = $_.Name
      SizeMB    = [math]::Round($_.Length / 1MB, 2)
      TopFolder = $id.TopFolder
      Entries   = $id.Entries
      Models    = $id.Models
      Images    = $id.Images
      Readme    = $id.Readme
      Sample    = $id.Sample
      Proposed  = $proposed
      Folder    = $_.DirectoryName
      Full      = $_.FullName
    })
  }
}

Write-Host "`n--- WHAT THESE ACTUALLY ARE ---" -ForegroundColor Cyan
Write-Host ("vague / inspected archives : {0}" -f $rows.Count)
$rows | Sort-Object -Property @{e={[double]$_.SizeMB}} -Descending |
  Select-Object -First 30 Name,SizeMB,TopFolder,Models,Images |
  Format-Table -AutoSize
$named = @($rows | Where-Object { $_.Proposed }).Count
Write-Host ("identifiable from contents : {0} of {1}" -f $named, $rows.Count)

$csv = Join-Path $ReportDir 'identity.csv'
$rows | Sort-Object Name | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8

$style = @'
<style>
body{background:#0b0a10;color:#d9d6e0;font:14px/1.5 "Segoe UI",sans-serif;padding:24px}
h1{color:#8F69E9;font-size:20px}
table{border-collapse:collapse;width:100%;margin-top:8px}
th{background:#2F3138;color:#fff;text-align:left;padding:6px 8px;position:sticky;top:0}
td{border-bottom:1px solid #2F3138;padding:5px 8px;vertical-align:top}
tr:hover td{background:#17151f}
</style>
'@
$html = Join-Path $ReportDir 'identity.html'
$rows | Sort-Object Name | ConvertTo-Html -Property Name,SizeMB,TopFolder,Entries,Models,Images,Readme,Sample,Proposed,Folder `
  -Title 'Archive Identity' -Head $style `
  -PreContent "<h1>ARCHIVE IDENTITY</h1><p>$(Get-Date -Format 'yyyy-MM-dd HH:mm') &middot; $($rows.Count) archives inspected &middot; $named identifiable from contents</p><p>TopFolder is the folder name inside the archive - the strongest clue to what a file called free.zip really is.</p>" |
  Out-File -LiteralPath $html -Encoding UTF8

Write-Host "`nreport: $html" -ForegroundColor Green
Write-Host "csv   : $csv" -ForegroundColor Green

if (-not $Rename) {
  Write-Host "`nREPORT ONLY - NOTHING RENAMED. Read it, then re-run with -Rename." -ForegroundColor Yellow
  return
}

# --- rename ------------------------------------------------------------------
$done = 0; $skipped = 0
$undo = New-Object System.Collections.ArrayList
[void]$undo.Add('# Undo for DC ARCHIVE IDENTIFIER - restores every original filename.')
foreach ($r in $rows) {
  if (-not $r.Proposed) { $skipped++; continue }
  $target = Join-Path $r.Folder $r.Proposed
  if (Test-Path -LiteralPath $target) {
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($r.Proposed)
    $ext  = [System.IO.Path]::GetExtension($r.Proposed)
    $h = (Get-FileHash -LiteralPath $r.Full -Algorithm SHA256).Hash.Substring(0,8)
    $target = Join-Path $r.Folder ("{0}__{1}{2}" -f $stem, $h, $ext)
  }
  if (Test-Path -LiteralPath $target) { $skipped++; continue }
  try {
    Rename-Item -LiteralPath $r.Full -NewName (Split-Path -Leaf $target) -ErrorAction Stop
    [void]$undo.Add(('Rename-Item -LiteralPath "{0}" -NewName "{1}"' -f $target, $r.Name))
    $done++
  } catch {
    Write-Host ("  FAILED: {0} -- {1}" -f $r.Name, $_.Exception.Message) -ForegroundColor Red
    $skipped++
  }
}
$undoPath = Join-Path $ReportDir 'undo.ps1'
$undo -join "`r`n" | Out-File -LiteralPath $undoPath -Encoding UTF8

Write-Host "`n--- RENAME RECEIPT ---" -ForegroundColor Cyan
Write-Host ("renamed            : {0}" -f $done)
Write-Host ("left alone         : {0}" -f $skipped)
Write-Host ("undo script        : {0}" -f $undoPath)
Write-Host "Files were RENAMED in place. Nothing was moved or deleted." -ForegroundColor Green
