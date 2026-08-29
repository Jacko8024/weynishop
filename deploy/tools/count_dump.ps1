$lines = Get-Content weynishop_dump_fixed.sql
$table = $null
$counts = @{}
foreach ($l in $lines) {
  if ($l -match '^COPY public\.(\w+)') { $table = $Matches[1]; continue }
  if ($l -match '^\.$') { $table = $null; continue }
  if ($table -and $l.Trim() -and $l -notmatch '^\\') {
    if (-not $counts.ContainsKey($table)) { $counts[$table] = 0 }
    $counts[$table]++
  }
}
$counts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { "{0,-24} {1}" -f $_.Key, $_.Value }
