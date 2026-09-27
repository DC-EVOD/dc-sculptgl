#Requires -Version 5.1
<#
  DC DOWNLOADS TIDY  v1.2
  Files the loose files at the root of Downloads into David's existing numbered
  category folders. Category list was READ from his disk on 2026-09-26, not invented.
  Routing rules corrected against a real dry run over 892 files the same day.

  SAFETY
    - DRY RUN BY DEFAULT. Writes a plan and moves nothing. -Execute performs moves.
    - Operates ONLY on files sitting directly in the Downloads root. No -Recurse,
      so it cannot reach inside the organised folders and cannot disturb them.
    - Moves NO FOLDERS. Several top-level folders are live projects
      (CHITIN_Brush_Forge/src, AF_Materials_Forge/build, the VFX_Maker tool installs)
      and moving them can break tools that reference their own paths.
    - NEVER overwrites. A name clash with different content gets " (2)", " (3)"...
      A name clash with IDENTICAL content (SHA256) is left alone and reported.
    - Unroutable files are LEFT WHERE THEY ARE and listed. No junk-drawer folder.
    - Skips in-progress downloads (.crdownload, .part, .tmp).
    - Writes undo.ps1 next to the report, which moves everything back.

  USAGE
    .\tidy_downloads.ps1                 # plan only, moves nothing
    .\tidy_downloads.ps1 -Execute        # do it

  UNVERIFIED: authored without PowerShell available. Not parsed, not run.
  The dry run is read-only apart from its own report folder.
#>
[CmdletBinding()]
param(
  [string] $Downloads = (Join-Path $env:USERPROFILE 'Downloads'),
  [string] $ReportDir = (Join-Path $env:USERPROFILE 'AUTOMATON BUILDS\DOWNLOADS_TIDY'),
  [switch] $Execute
)

$ErrorActionPreference = 'Continue'

# --- routing table: extension -> category folder, relative to Downloads ------
# '' means deliberately unrouted: leave the file alone.
$byExt = @{
  '.png'='09 Images'; '.jpg'='09 Images'; '.jpeg'='09 Images'; '.webp'='09 Images'
  '.gif'='09 Images'; '.bmp'='09 Images'; '.tif'='09 Images'; '.tiff'='09 Images'
  '.psd'='09 Images'; '.svg'='09 Images'; '.tga'='09 Images'; '.exr'='09 Images'

  '.kra'='02 Krita\Artwork'; '.kra~'='02 Krita\Artwork'; '.kpp'='02 Krita\Brushes'

  '.mp3'='07 Audio'; '.wav'='07 Audio'; '.m4a'='07 Audio'; '.flac'='07 Audio'
  '.ogg'='07 Audio'; '.aif'='07 Audio'; '.aiff'='07 Audio'

  '.mp4'='10 Video'; '.mov'='10 Video'; '.webm'='10 Video'; '.avi'='10 Video'; '.mkv'='10 Video'

  '.pdf'='08 Docs & Ascent-Fall\PDFs'
  '.skill'='08 Docs & Ascent-Fall\Handoffs, Skills & Receipts'
  '.docx'='08 Docs & Ascent-Fall'; '.doc'='08 Docs & Ascent-Fall'
  '.md'='08 Docs & Ascent-Fall'; '.txt'='08 Docs & Ascent-Fall'; '.rtf'='08 Docs & Ascent-Fall'

  '.obj'='03 3D Models & Assets'; '.fbx'='03 3D Models & Assets'
  '.glb'='03 3D Models & Assets'; '.gltf'='03 3D Models & Assets'
  '.ply'='03 3D Models & Assets'; '.stl'='03 3D Models & Assets'
  '.dae'='03 3D Models & Assets'; '.mtl'='03 3D Models & Assets'

  '.blend'='01 Blender\Blend files'; '.blend1'='01 Blender\Blend files'

  '.ztl'='04 ZBrush\ZTL_file'; '.zpr'='04 ZBrush'; '.zbp'='04 ZBrush'; '.zbrush'='04 ZBrush'

  '.py'='11 Code & Web Tools'; '.ps1'='11 Code & Web Tools'; '.psm1'='11 Code & Web Tools'
  '.html'='11 Code & Web Tools'; '.js'='11 Code & Web Tools'; '.css'='11 Code & Web Tools'
  '.sh'='11 Code & Web Tools'; '.bat'='11 Code & Web Tools'

  '.exe'='12 Installers'; '.msi'='12 Installers'
  '.unitypackage'='06 Unity'

  # 16-bit raw heightmaps (World Machine / UE landscape). Found loose: 2 x 28 MB.
  '.r16'='05 Procedural'; '.raw'='05 Procedural'
  # SculptGL scene file - from David's own dc-sculptgl fork. Found loose: drohj.mask.sgl
  '.sgl'='03 3D Models & Assets'

  '.ttf'=''; '.otf'=''; '.woff'=''; '.woff2'=''   # no font category exists - leave
}
$skipExt  = @('.crdownload','.part','.tmp')
$modelExt = @('.obj','.fbx','.glb','.gltf','.ply','.stl')
$imgExt   = @('.png','.jpg','.jpeg','.webp','.tga','.psd','.tif','.exr')
$audExt   = @('.mp3','.wav','.m4a','.flac','.ogg')
$vidExt   = @('.mp4','.mov','.webm','.avi','.mkv','.gif')
$zbExt    = @('.zbp','.ztl','.zpr')
$kritaExt = @('.kpp','.bundle','.abr')

# --- content sniffing --------------------------------------------------------
function Get-JsonDest($path, $name) {
  # AI / chat EXPORT ARCHIVES are .json but they are archives, not code. Measured
  # 2026-09-26: chatgpt-files-part07.json 209 MB, af-claude-binaries-part03 94 MB.
  # 65 such files carried ~4 GB and were being filed as source code.
  if ($name -match '(?i)^(chatgpt|chat-|claude|af-claude|conversations|openai)|-r?part\d+\.json$') {
    return '08 Docs & Ascent-Fall\Research archives'
  }
  # ComfyUI workflows are node graphs. Read a fixed BYTE window, not N lines: a
  # minified JSON is ONE line, so -TotalCount 80 read entire 200 MB files and was
  # what made the first run appear to hang.
  try {
    $fs = [System.IO.File]::OpenRead($path)
    try {
      $buf = New-Object byte[] 8192
      $n = $fs.Read($buf, 0, $buf.Length)
      $head = [System.Text.Encoding]::UTF8.GetString($buf, 0, $n)
    } finally { $fs.Dispose() }
    if ($head -match '"class_type"|"last_node_id"|ComfyUI|"nodes"\s*:') {
      return '03 3D Models & Assets\ComfyUI workflows'
    }
  } catch { }
  return '11 Code & Web Tools'
}

function Get-ZipDest($path, $name) {
  # NAME rules first, for packs whose contents do not identify them. Each of these
  # was left unrouted by the contents-only version on 2026-09-26.
  if ($name -match '(?i)receipt|proof|handoff')        { return '08 Docs & Ascent-Fall\Handoffs, Skills & Receipts' }
  if ($name -match '(?i)pack[_ -]?manager|installer')  { return '12 Installers' }
  if ($name -match '(?i)imm|zbrush|ztl|zbp')           { return '04 ZBrush' }
  if ($name -match '(?i)brush')                        { return '02 Krita\Brushes' }

  # then route by what is actually inside it
  try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
    try {
      $c = @{ model=0; img=0; aud=0; vid=0; zb=0; krita=0; blend=0; unity=0 }
      foreach ($e in $zip.Entries) {
        $x = [System.IO.Path]::GetExtension($e.FullName).ToLower()
        if     ($modelExt -contains $x) { $c.model++ }
        elseif ($zbExt    -contains $x) { $c.zb++ }
        elseif ($kritaExt -contains $x) { $c.krita++ }
        elseif ($imgExt   -contains $x) { $c.img++ }
        elseif ($audExt   -contains $x) { $c.aud++ }
        elseif ($vidExt   -contains $x) { $c.vid++ }
        elseif ($x -eq '.blend')        { $c.blend++ }
        elseif ($x -eq '.unitypackage') { $c.unity++ }
      }
    } finally { $zip.Dispose() }
    # brushes and models win over loose images, since asset packs contain both
    if ($c.zb    -gt 0)                        { return '04 ZBrush' }
    if ($c.krita -gt 0)                        { return '02 Krita\Brushes' }
    if ($c.blend -gt 0)                        { return '01 Blender\Blend files' }
    if ($c.unity -gt 0)                        { return '06 Unity' }
    if ($c.model -gt 0)                        { return '03 3D Models & Assets' }
    if ($c.aud -gt $c.img -and $c.aud -gt $c.vid) { return '07 Audio' }
    if ($c.vid   -gt $c.img)                   { return '10 Video' }
    if ($c.img   -gt 0)                        { return '09 Images' }
  } catch { return '' }

  # last resort name hints. A "turnaround" pack is renders of a model.
  if ($name -match '(?i)turnaround|render|rodin') { return '03 3D Models & Assets' }
  return ''
}

# --- validate before any mutation -------------------------------------------
# Required by the scriptability-check protocol. Without this, a missing or
# redirected Downloads path silently reports "0 loose files" and looks like success.
if (-not (Test-Path -LiteralPath $Downloads)) {
  Write-Host "ABORT: source folder does not exist: $Downloads" -ForegroundColor Red
  Write-Host "Pass the real path with -Downloads if yours is redirected." -ForegroundColor Yellow
  exit 1
}
$rootParent = Split-Path -Parent $ReportDir
if (-not (Test-Path -LiteralPath $rootParent)) {
  Write-Host "NOTE: creating report root $rootParent" -ForegroundColor Yellow
}

# --- build the plan ---------------------------------------------------------
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
Write-Host "`nDC DOWNLOADS TIDY v1.2" -ForegroundColor Cyan
Write-Host ("mode : {0}" -f $(if ($Execute) { 'EXECUTE - files will be MOVED' } else { 'DRY RUN - nothing will move' })) -ForegroundColor $(if ($Execute) { 'Yellow' } else { 'Green' })
Write-Host "from : $Downloads  (root only, no recursion)"

$plan = New-Object System.Collections.ArrayList
# -File with no -Recurse: root only. Cannot touch the organised folders.
$files = @(Get-ChildItem -LiteralPath $Downloads -File -ErrorAction SilentlyContinue)
Write-Host ("loose files at root : {0}" -f $files.Count)

$i = 0
foreach ($f in $files) {
  $i++
  if ($i % 50 -eq 0) { Write-Host ("    ...{0}/{1}" -f $i, $files.Count) -ForegroundColor DarkGray }
  $ext = $f.Extension.ToLower()
  # a trailing-tilde backup routes as its real type: .png~ -> .png, .gif~ -> .gif
  if ($ext -like '*~') { $ext = $ext.TrimEnd('~') }
  $dest = $null; $why = 'extension'

  if ($skipExt -contains $ext) { $dest = ''; $why = 'in-progress download' }
  elseif ($ext -eq '.json') {
    # named, because reading these is the slow part - a stall is now attributable
    Write-Host ("    json {0} ({1} MB)" -f $f.Name, [int]($f.Length/1MB)) -ForegroundColor DarkGray
    $dest = Get-JsonDest $f.FullName $f.Name; $why = 'json name/content'
  }
  elseif ($ext -eq '.zip') {
    Write-Host ("    zip  {0} ({1} MB)" -f $f.Name, [int]($f.Length/1MB)) -ForegroundColor DarkGray
    $dest = Get-ZipDest $f.FullName $f.Name; $why = 'zip name/contents'
  }
  elseif ($byExt.ContainsKey($ext)) { $dest = $byExt[$ext] }
  else { $dest = ''; $why = 'no rule for this extension' }

  [void]$plan.Add([pscustomobject]@{
    Name    = $f.Name
    Ext     = $ext
    SizeMB  = [math]::Round($f.Length / 1MB, 2)
    Dest    = $(if ($dest) { $dest } else { '(left in place)' })
    Reason  = $why
    Full    = $f.FullName
    DestAbs = $(if ($dest) { Join-Path $Downloads $dest } else { '' })
  })
}

Write-Host "`n--- PLAN BY DESTINATION ---" -ForegroundColor Cyan
$plan | Group-Object Dest | Sort-Object Count -Descending | ForEach-Object {
  $mb = [int](($_.Group | Measure-Object SizeMB -Sum).Sum)
  Write-Host ("  {0,5} files  {1,6} MB   {2}" -f $_.Count, $mb, $_.Name)
}

$csv = Join-Path $ReportDir 'plan.csv'
$plan | Sort-Object Dest, Name | Export-Csv -LiteralPath $csv -NoTypeInformation -Encoding UTF8

$style = @'
<style>
body{background:#0b0a10;color:#d9d6e0;font:14px/1.5 "Segoe UI",sans-serif;padding:24px}
h1{color:#8F69E9;font-size:20px}
table{border-collapse:collapse;width:100%;margin-top:8px}
th{background:#2F3138;color:#fff;text-align:left;padding:6px 8px;position:sticky;top:0}
td{border-bottom:1px solid #2F3138;padding:5px 8px}
tr:hover td{background:#17151f}
</style>
'@
$unrouted = @($plan | Where-Object { $_.Dest -eq '(left in place)' }).Count
$pre = "<h1>DOWNLOADS TIDY PLAN</h1><p>$(Get-Date -Format 'yyyy-MM-dd HH:mm') &middot; $($files.Count) loose files &middot; $unrouted left in place</p><p>Files routed to a CATEGORY folder, not a subfolder, except where the extension is unambiguous. Nothing here touches the organised folders' existing contents.</p>"
$html = Join-Path $ReportDir 'plan.html'
$plan | Sort-Object Dest, Name | ConvertTo-Html -Property Dest,Name,Ext,SizeMB,Reason `
  -Title 'Downloads Tidy Plan' -Head $style -PreContent $pre | Out-File -LiteralPath $html -Encoding UTF8

Write-Host "`nplan: $html" -ForegroundColor Green
Write-Host "csv : $csv" -ForegroundColor Green

if (-not $Execute) {
  Write-Host "`nDRY RUN - NOTHING MOVED. Read the plan, then re-run with -Execute." -ForegroundColor Yellow
  return
}

# --- execute ----------------------------------------------------------------
$moved = 0; $left = 0; $dupes = 0; $renamed = 0; $failed = 0
$undo = New-Object System.Collections.ArrayList
[void]$undo.Add('# Undo for DC DOWNLOADS TIDY - moves every file back where it came from.')
[void]$undo.Add('$ErrorActionPreference = ''Continue''')

foreach ($p in $plan) {
  if (-not $p.DestAbs) { $left++; continue }
  if (-not (Test-Path -LiteralPath $p.DestAbs)) {
    New-Item -ItemType Directory -Force -Path $p.DestAbs | Out-Null
  }
  $target = Join-Path $p.DestAbs $p.Name

  if (Test-Path -LiteralPath $target) {
    # identical content already filed? leave the loose copy alone and say so
    try {
      $a = (Get-FileHash -LiteralPath $p.Full   -Algorithm SHA256).Hash
      $b = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
      if ($a -eq $b) { $dupes++; continue }
    } catch { }
    $base = [System.IO.Path]::GetFileNameWithoutExtension($p.Name)
    $n = 2
    do {
      $target = Join-Path $p.DestAbs ("{0} ({1}){2}" -f $base, $n, $p.Ext)
      $n++
    } while (Test-Path -LiteralPath $target)
    $renamed++
  }

  try {
    Move-Item -LiteralPath $p.Full -Destination $target -ErrorAction Stop
    [void]$undo.Add(('Move-Item -LiteralPath "{0}" -Destination "{1}"' -f $target, $p.Full))
    $moved++
  } catch {
    Write-Host ("  FAILED: {0} -- {1}" -f $p.Name, $_.Exception.Message) -ForegroundColor Red
    $failed++
  }
}

$undoPath = Join-Path $ReportDir 'undo.ps1'
$undo -join "`r`n" | Out-File -LiteralPath $undoPath -Encoding UTF8

$receipt = @"
DC DOWNLOADS TIDY receipt $(Get-Date -Format 'yyyy-MM-dd HH:mm')
moved                  : $moved
left in place           : $left
already filed, skipped  : $dupes
renamed to avoid clash  : $renamed
failed                  : $failed
undo script             : $undoPath
"@
$receipt | Out-File -LiteralPath (Join-Path $ReportDir 'receipt.txt') -Encoding UTF8
Write-Host "`n--- RECEIPT ---" -ForegroundColor Cyan
Write-Host $receipt
Write-Host "Run undo.ps1 to put everything back exactly where it was." -ForegroundColor Green
