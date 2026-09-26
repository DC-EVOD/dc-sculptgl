#Requires -Version 5.1
<#
  DC KITBASH MUSTER  v1.1
  Scans your user folder for 3D assets, inventories them, then sorts them into
  %USERPROFILE%\DC-EVOD\{OBJ,FBX,GLB}\

  SAFETY
    - Default run is READ-ONLY: writes an inventory report and copies nothing.
    - Never scans Program Files / ProgramData / Windows (hard refusal).
    - Classifies every hit: LOOSE (free-floating) / PROJECT (inside a live
      Unity/UE/git/VS project) / CACHE (AppData, Temp, Recycle Bin, engine caches).
      Only LOOSE is gathered unless you pass -IncludeProjects. CACHE never is.
    - COPIES by default. -Move moves instead, and refuses to move PROJECT files.

  USAGE
    .\muster.ps1                      # inventory only, writes no assets
    .\muster.ps1 -Gather              # copy LOOSE assets into DC-EVOD\{OBJ,FBX,GLB}
    .\muster.ps1 -Gather -Move        # move them instead of copying
    .\muster.ps1 -Gather -IncludeProjects   # also take assets inside projects (copy only)

  UNVERIFIED: authored in a Linux container with no PowerShell available, so it has
  not been parsed or run. The default mode is read-only, which bounds a first run.
#>
[CmdletBinding()]
param(
  [string[]] $Roots = @("$env:USERPROFILE"),
  [string]   $Out   = (Join-Path $env:USERPROFILE 'DC-EVOD'),
  [switch]   $Gather,
  [switch]   $Move,
  [switch]   $IncludeProjects,
  [int]      $MinKB = 4,
  [int]      $MaxAssetCopyMB = 512
)

$ErrorActionPreference = 'Continue'
$modelExt   = @('.obj','.fbx','.glb','.gltf')
$archiveExt = @('.zip','.7z','.rar')
$imageExt   = @('.png','.jpg','.jpeg','.tga','.tif','.tiff','.bmp','.dds','.exr','.psd')
# .gltf lands in GLB alongside its binary sibling
$bucketOf   = @{ '.obj'='OBJ'; '.fbx'='FBX'; '.glb'='GLB'; '.gltf'='GLB' }

# --- refuse to scan system locations -----------------------------------------
$forbidden = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:windir, $env:ProgramData) |
             Where-Object { $_ } | ForEach-Object { $_.TrimEnd('\') }
foreach ($r in $Roots) {
  foreach ($f in $forbidden) {
    if ($r.TrimEnd('\').ToLower().StartsWith($f.ToLower())) {
      Write-Host "REFUSED: '$r' is inside a system location ($f). Not scanning." -ForegroundColor Red
      exit 1
    }
  }
}
if ($Move -and -not $Gather) {
  Write-Host "-Move does nothing without -Gather. Nothing done." -ForegroundColor Yellow
  exit 1
}

# --- zone classification ------------------------------------------------------
$cachePat = '\\AppData\\|\\\$Recycle\.Bin\\|\\Temp\\|\\node_modules\\|\\\.git\\|\\Library\\|\\Intermediate\\|\\Saved\\|\\DerivedDataCache\\|\\__pycache__\\'
$projMarkers = @('ProjectSettings','Assembly-CSharp.csproj','.git','package.json','node_modules')

$projCache = @{}
function Get-Zone([string]$filePath) {
  if ($filePath -match $cachePat) { return 'CACHE' }
  $dir = Split-Path -Parent $filePath
  while ($dir -and $dir.Length -gt 3) {
    if ($projCache.ContainsKey($dir)) { if ($projCache[$dir]) { return 'PROJECT' } }
    else {
      $isProj = $false
      foreach ($m in $projMarkers) {
        if (Test-Path -LiteralPath (Join-Path $dir $m)) { $isProj = $true; break }
      }
      if (-not $isProj) {
        if (@(Get-ChildItem -LiteralPath $dir -Filter '*.uproject' -File -Force -ErrorAction SilentlyContinue).Count -gt 0) { $isProj = $true }
        elseif (@(Get-ChildItem -LiteralPath $dir -Filter '*.sln' -File -Force -ErrorAction SilentlyContinue).Count -gt 0) { $isProj = $true }
      }
      $projCache[$dir] = $isProj
      if ($isProj) { return 'PROJECT' }
    }
    $dir = Split-Path -Parent $dir
  }
  return 'LOOSE'
}

# --- scan ---------------------------------------------------------------------
$reportDir = Join-Path $Out '_MUSTER'
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
Write-Host "`nDC KITBASH MUSTER v1.1 - scanning (read-only)..." -ForegroundColor Cyan
foreach ($r in $Roots) { Write-Host "  root: $r" }
Write-Host "  out : $Out"

# never scan our own output folder
$outLower = $Out.TrimEnd('\').ToLower()

$rows = New-Object System.Collections.ArrayList
$seen = 0
foreach ($root in $Roots) {
  if (-not (Test-Path -LiteralPath $root)) { Write-Host "  missing root: $root" -ForegroundColor Yellow; continue }
  Get-ChildItem -LiteralPath $root -Recurse -File -Force -ErrorAction SilentlyContinue |
  ForEach-Object {
    $seen++
    if ($seen % 20000 -eq 0) { Write-Host "    ...$seen files seen" -ForegroundColor DarkGray }
    $ext = $_.Extension.ToLower()
    $isModel = $modelExt -contains $ext
    $isArch  = $archiveExt -contains $ext
    if (-not ($isModel -or $isArch)) { return }
    if ($_.Length -lt ($MinKB * 1KB)) { return }
    if ($_.FullName.ToLower().StartsWith($outLower)) { return }

    $zone = Get-Zone $_.FullName
    $hash = ''
    $note = ''
    $modelsInZip = 0

    if ($isModel) {
      try { $hash = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256 -ErrorAction Stop).Hash }
      catch { $note = 'hash failed' }
    }
    elseif ($ext -eq '.zip') {
      try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
        $zip = [System.IO.Compression.ZipFile]::OpenRead($_.FullName)
        try {
          foreach ($e in $zip.Entries) {
            if ($modelExt -contains ([System.IO.Path]::GetExtension($e.FullName).ToLower())) { $modelsInZip++ }
          }
        } finally { $zip.Dispose() }
        if ($modelsInZip -eq 0) { $note = 'zip: no models' }
      } catch { $note = 'zip unreadable (encrypted/corrupt?)' }
    }
    else { $note = "$ext archive - contents not inspected" }

    [void]$rows.Add([pscustomobject]@{
      Zone        = $zone
      Kind        = if ($isModel) { 'MODEL' } else { 'ARCHIVE' }
      Bucket      = if ($isModel) { $bucketOf[$ext] } else { '' }
      Ext         = $ext
      SizeMB      = [math]::Round($_.Length / 1MB, 2)
      ModelsInZip = $modelsInZip
      Name        = $_.Name
      Folder      = $_.DirectoryName
      SHA256      = $hash
      Note        = $note
    })
  }
}

Write-Host "`n--- INVENTORY ---" -ForegroundColor Cyan
Write-Host ("files walked        : {0}" -f $seen)
Write-Host ("candidates found    : {0}" -f $rows.Count)
$rows | Group-Object Zone | Sort-Object Name | ForEach-Object {
  Write-Host ("  {0,-8} {1,6}" -f $_.Name, $_.Count)
}
$models = @($rows | Where-Object { $_.Kind -eq 'MODEL' })
$uniq   = @($models | Where-Object { $_.SHA256 } | Group-Object SHA256).Count
Write-Host ("models              : {0}  (distinct by hash: {1})" -f $models.Count, $uniq)
$models | Group-Object Bucket | Sort-Object Name | ForEach-Object {
  Write-Host ("  {0,-5} {1,6}" -f $_.Name, $_.Count)
}
$zipsWith = @($rows | Where-Object { $_.Kind -eq 'ARCHIVE' -and $_.ModelsInZip -gt 0 })
Write-Host ("zips holding models : {0}" -f $zipsWith.Count)
$looseMB = ($models | Where-Object { $_.Zone -eq 'LOOSE' } | Measure-Object SizeMB -Sum).Sum
Write-Host ("loose model MB      : {0}" -f [math]::Round($looseMB, 1))

# --- reports ------------------------------------------------------------------
$csv = Join-Path $reportDir 'inventory.csv'
$rows | Sort-Object Zone, Bucket, Name | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8

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
$pre = "<h1>DC KITBASH MUSTER</h1><p>$(Get-Date -Format 'yyyy-MM-dd HH:mm') &middot; $seen files walked &middot; $($rows.Count) candidates &middot; $($models.Count) models ($uniq distinct)</p><p><b>LOOSE</b> = free-floating, your kitbash candidates. <b>PROJECT</b> = inside a live project, not gathered unless -IncludeProjects. <b>CACHE</b> = never gathered.</p>"
$htmlPath = Join-Path $reportDir 'inventory.html'
$rows | Sort-Object Zone, Bucket, Name |
  ConvertTo-Html -Property Zone,Bucket,Kind,Ext,SizeMB,ModelsInZip,Name,Folder,Note `
    -Title 'DC Kitbash Muster' -Head $style -PreContent $pre |
  Out-File -LiteralPath $htmlPath -Encoding UTF8

Write-Host "`nreport: $htmlPath" -ForegroundColor Green
Write-Host "csv   : $csv" -ForegroundColor Green

if (-not $Gather) {
  Write-Host "`nNOTHING WAS MOVED OR COPIED. Read the report, then re-run with -Gather." -ForegroundColor Yellow
  return
}

# --- gather -------------------------------------------------------------------
$zones = @('LOOSE'); if ($IncludeProjects) { $zones += 'PROJECT' }
$verb = if ($Move) { 'MOVING' } else { 'COPYING' }
Write-Host "`n$verb into $Out\{OBJ,FBX,GLB}" -ForegroundColor Cyan
foreach ($b in @('OBJ','FBX','GLB')) { New-Item -ItemType Directory -Force -Path (Join-Path $Out $b) | Out-Null }

$done = 0; $skipped = 0; $moveRefused = 0
$groups = $models | Where-Object { $zones -contains $_.Zone -and $_.SHA256 } | Group-Object SHA256
foreach ($g in $groups) {
  $src  = $g.Group[0]
  $base = [System.IO.Path]::GetFileNameWithoutExtension($src.Name)
  $safe = ($base -replace '[^\w\-. ]','_')
  $dest = Join-Path (Join-Path $Out $src.Bucket) ("{0}__{1}" -f $safe, $src.SHA256.Substring(0,8))
  if (Test-Path -LiteralPath $dest) { $skipped++; continue }

  # a move out of a live project can break that project's references - never do it
  $doMove = $Move
  if ($Move -and $src.Zone -ne 'LOOSE') { $doMove = $false; $moveRefused++ }

  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $srcFile = Join-Path $src.Folder $src.Name
  if ($doMove) { Move-Item -LiteralPath $srcFile -Destination $dest -ErrorAction SilentlyContinue }
  else         { Copy-Item -LiteralPath $srcFile -Destination $dest -ErrorAction SilentlyContinue }
  $assetMB = $src.SizeMB

  # sidecars: same-basename siblings, .mtl, licence/readme always; loose images
  # only when the folder is small enough to plainly belong to this one model
  $sibs = @(Get-ChildItem -LiteralPath $src.Folder -File -Force -ErrorAction SilentlyContinue)
  $folderIsTidy = ($sibs.Count -le 40)
  foreach ($s in $sibs) {
    if ($s.Name -eq $src.Name) { continue }
    $take = $false
    if ([System.IO.Path]::GetFileNameWithoutExtension($s.Name) -eq $base) { $take = $true }
    elseif ($s.Extension.ToLower() -eq '.mtl') { $take = $true }
    elseif ($s.Name -match '(?i)^(licen[cs]e|readme|credits)') { $take = $true }
    elseif ($folderIsTidy -and ($imageExt -contains $s.Extension.ToLower())) { $take = $true }
    if ($take -and (($assetMB + ($s.Length / 1MB)) -lt $MaxAssetCopyMB)) {
      # sidecars are always COPIED, never moved - other files may still need them
      Copy-Item -LiteralPath $s.FullName -Destination $dest -ErrorAction SilentlyContinue
      $assetMB += ($s.Length / 1MB)
    }
  }
  foreach ($d in @('textures','tex','maps',"$base.fbm")) {
    $sub = Join-Path $src.Folder $d
    if (Test-Path -LiteralPath $sub) {
      Copy-Item -LiteralPath $sub -Destination $dest -Recurse -ErrorAction SilentlyContinue
    }
  }
  if (-not $folderIsTidy) {
    "Folder had $($sibs.Count) files; loose images were NOT taken. Source: $($src.Folder)" |
      Out-File -LiteralPath (Join-Path $dest '_SIDECARS_INCOMPLETE.txt') -Encoding UTF8
  }
  "source: $srcFile`nsha256: $($src.SHA256)`nzone  : $($src.Zone)`nduplicates found: $($g.Count)`naction: $(if($doMove){'moved'}else{'copied'})" |
    Out-File -LiteralPath (Join-Path $dest '_origin.txt') -Encoding UTF8
  $done++
}

$receipt = @"
DC KITBASH MUSTER receipt $(Get-Date -Format 'yyyy-MM-dd HH:mm')
action                 : $(if($Move){'move (LOOSE only)'}else{'copy'})
distinct models handled : $done
already present         : $skipped
move refused (PROJECT)  : $moveRefused
zips holding models     : $($zipsWith.Count)   (NOT extracted)
destination             : $Out
"@
$receipt | Out-File -LiteralPath (Join-Path $reportDir 'gather_receipt.txt') -Encoding UTF8
Write-Host "`n--- GATHER RECEIPT ---" -ForegroundColor Cyan
Write-Host $receipt
if ($moveRefused -gt 0) {
  Write-Host "$moveRefused asset(s) were COPIED not moved: they live inside a project." -ForegroundColor Yellow
}
Write-Host "Sidecars are always copied, never moved." -ForegroundColor Green
