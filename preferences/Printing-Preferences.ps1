#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Dell 1320c Printing Preferences - settings window for the Windows driver.

.DESCRIPTION
  WinForms dialog mirroring the official driver's Printing Preferences:
  paper size/source, resolution, color mode, and copies. Choices are saved
  to %ProgramData%\Dell1320\defaults.cfg, which dell1320c_winprint.exe
  (and the port-monitor print path) uses for any option not given on the
  command line. Explicit CLI flags always win over saved preferences.

  Must run in STA mode (normal for powershell.exe / PowerShell ISE).
#>

#Requires -Version 5.1
if ([Threading.Thread]::CurrentThread.GetApartmentState() -ne 'SingleThreadedApartment') {
    Write-Warning 'Restarting in STA mode for WinForms...'
    & "$PSHOME\powershell.exe" -STA -File $PSCommandPath @args
    exit $LASTEXITCODE
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$DefaultsDir  = Join-Path $env:ProgramData 'Dell1320'
$DefaultsFile = Join-Path $DefaultsDir 'defaults.cfg'

$FactoryDefaults = [ordered]@{
    paper  = 'A4'
    tray   = '1'
    color  = 'color'
    dpi    = '600'
    copies = '1'
}

function Read-Defaults {
    $values = [ordered]@{}
    foreach ($k in $FactoryDefaults.Keys) { $values[$k] = $FactoryDefaults[$k] }
    if (Test-Path $DefaultsFile) {
        foreach ($line in (Get-Content $DefaultsFile)) {
            if ($line -match '^\s*([^=\s]+)\s*=\s*(.+?)\s*$') {
                if ($values.Contains($Matches[1])) { $values[$Matches[1]] = $Matches[2] }
            }
        }
    }
    return $values
}

function Write-Defaults($values) {
    New-Item -ItemType Directory -Force -Path $DefaultsDir | Out-Null
    $lines = foreach ($k in $FactoryDefaults.Keys) { "$k=$($values[$k])" }
    Set-Content -Path $DefaultsFile -Value $lines -Encoding Ascii
}

$vals = Read-Defaults

$Form = New-Object Forms.Form
$Form.Text = 'Dell 1320c Printing Preferences'
$Form.Size = New-Object Drawing.Size(470, 380)
$Form.FormBorderStyle = 'FixedDialog'
$Form.MaximizeBox = $false
$Form.MinimizeBox = $false
$Form.StartPosition = 'CenterScreen'

function Add-Label($parent, $text, $x, $y, $w = 130) {
    $l = New-Object Forms.Label
    $l.Text = $text; $l.Location = New-Object Drawing.Point($x, $y)
    $l.Size = New-Object Drawing.Size($w, 23); $l.TextAlign = 'MiddleLeft'
    $parent.Controls.Add($l); return $l
}
function Add-Combo($parent, $x, $y, $w, $items, $selected) {
    $c = New-Object Forms.ComboBox
    $c.Location = New-Object Drawing.Point($x, $y)
    $c.Size = New-Object Drawing.Size($w, 23)
    $c.DropDownStyle = 'DropDownList'
    foreach ($it in $items) { [void]$c.Items.Add($it) }
    $c.SelectedItem = $selected
    if ($null -eq $c.SelectedItem) { $c.SelectedIndex = 0 }
    $parent.Controls.Add($c); return $c
}

# --- Paper group ---------------------------------------------------------
$gPaper = New-Object Forms.GroupBox
$gPaper.Text = 'Paper'; $gPaper.Location = New-Object Drawing.Point(12, 12)
$gPaper.Size = New-Object Drawing.Size(430, 120)
$Form.Controls.Add($gPaper)

Add-Label $gPaper 'Paper &Size:' 16 26 | Out-Null
$comboSize = Add-Combo $gPaper 150 24 250 @('Letter (8.5 x 11")', 'A4 (210 x 297 mm)',
    'Legal (8.5 x 14")', 'Executive (7.25 x 10.5")', 'B5 (182 x 257 mm)',
    'Folio (8.5 x 13")') $null
$sizeMap = @{'Letter (8.5 x 11")' = 'Letter'; 'A4 (210 x 297 mm)' = 'A4';
    'Legal (8.5 x 14")' = 'Legal'; 'Executive (7.25 x 10.5")' = 'Executive';
    'B5 (182 x 257 mm)' = 'B5'; 'Folio (8.5 x 13")' = 'Folio'}
$revMap = @{}; foreach ($k in $sizeMap.Keys) { $revMap[$sizeMap[$k]] = $k }
if ($revMap.Contains($vals['paper'])) { $comboSize.SelectedItem = $revMap[$vals['paper']] }

Add-Label $gPaper 'Paper So&urce:' 16 58 | Out-Null
$comboTray = Add-Combo $gPaper 150 56 250 @('Automatically Select', 'Tray 1 (Standard)',
    'Tray 2 (Optional)', 'Bypass Tray') $null
$trayMap = @{'Automatically Select' = 'auto'; 'Tray 1 (Standard)' = '1';
    'Tray 2 (Optional)' = '2'; 'Bypass Tray' = 'bypass'}
$revTray = @{}; foreach ($k in $trayMap.Keys) { $revTray[$trayMap[$k]] = $k }
if ($revTray.Contains($vals['tray'])) { $comboTray.SelectedItem = $revTray[$vals['tray']] }

Add-Label $gPaper '&Copies:' 16 88 | Out-Null
$numCopies = New-Object Forms.NumericUpDown
$numCopies.Location = New-Object Drawing.Point(150, 88)
$numCopies.Size = New-Object Drawing.Size(80, 23)
$numCopies.Minimum = 1; $numCopies.Maximum = 999
$n = 1; [void][int]::TryParse($vals['copies'], [ref]$n)
$numCopies.Value = [Math]::Min(999, [Math]::Max(1, $n))
$gPaper.Controls.Add($numCopies)

# --- Quality group --------------------------------------------------------
$gQual = New-Object Forms.GroupBox
$gQual.Text = 'Print Quality'; $gQual.Location = New-Object Drawing.Point(12, 142)
$gQual.Size = New-Object Drawing.Size(430, 120)
$Form.Controls.Add($gQual)

Add-Label $gQual '&Resolution:' 16 28 | Out-Null
$comboDpi = Add-Combo $gQual 150 26 250 @('600 dpi (High Quality)', '300 dpi (High Speed)') $null
$comboDpi.SelectedItem = if ($vals['dpi'] -eq '300') { '300 dpi (High Speed)' } else { '600 dpi (High Quality)' }

Add-Label $gQual 'Color &Mode:' 16 62 | Out-Null
$radioColor = New-Object Forms.RadioButton
$radioColor.Text = 'Color'; $radioColor.Location = New-Object Drawing.Point(150, 62)
$radioColor.Size = New-Object Drawing.Size(100, 23)
$radioMono = New-Object Forms.RadioButton
$radioMono.Text = 'Black && White'; $radioMono.Location = New-Object Drawing.Point(260, 62)
$radioMono.Size = New-Object Drawing.Size(140, 23)
if ($vals['color'] -eq 'mono') { $radioMono.Checked = $true } else { $radioColor.Checked = $true }
$gQual.Controls.Add($radioColor); $gQual.Controls.Add($radioMono)

$note = New-Object Forms.Label
$note.Text = 'Saved to %ProgramData%\Dell1320\defaults.cfg. Applies to jobs that do not set these options.'
$note.Location = New-Object Drawing.Point(12, 272); $note.Size = New-Object Drawing.Size(430, 30)
$Form.Controls.Add($note)

# --- Buttons ---------------------------------------------------------------
$btnOK = New-Object Forms.Button
$btnOK.Text = 'OK'; $btnOK.DialogResult = 'OK'
$btnOK.Location = New-Object Drawing.Point(200, 308); $btnOK.Size = New-Object Drawing.Size(80, 26)
$btnCancel = New-Object Forms.Button
$btnCancel.Text = 'Cancel'; $btnCancel.DialogResult = 'Cancel'
$btnCancel.Location = New-Object Drawing.Point(286, 308); $btnCancel.Size = New-Object Drawing.Size(80, 26)
$btnDefaults = New-Object Forms.Button
$btnDefaults.Text = 'Restore Defaults'
$btnDefaults.Location = New-Object Drawing.Point(12, 308); $btnDefaults.Size = New-Object Drawing.Size(120, 26)
$btnDefaults.Add_Click({
    $comboSize.SelectedItem = $revMap['A4']
    $comboTray.SelectedItem = $revTray['1']
    $comboDpi.SelectedItem = '600 dpi (High Quality)'
    $radioColor.Checked = $true
    $numCopies.Value = 1
})
$Form.Controls.Add($btnOK); $Form.Controls.Add($btnCancel); $Form.Controls.Add($btnDefaults)
$Form.AcceptButton = $btnOK; $Form.CancelButton = $btnCancel

if ($Form.ShowDialog() -eq 'OK') {
    $out = [ordered]@{
        paper  = $sizeMap[$comboSize.SelectedItem.ToString()]
        tray   = $trayMap[$comboTray.SelectedItem.ToString()]
        color  = if ($radioMono.Checked) { 'mono' } else { 'color' }
        dpi    = if ($comboDpi.SelectedItem.ToString().StartsWith('300')) { '300' } else { '600' }
        copies = "$($numCopies.Value)"
    }
    Write-Defaults $out
    Write-Host "Preferences saved to $DefaultsFile"
}
