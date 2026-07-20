param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^\d{4}-\d{2}-\d{2}$')]
  [string]$ReportDate,

  [switch]$CommitAndPush
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$reportHtml = Join-Path $repoRoot "morning_brief\$ReportDate`_us_market_brief.html"
$marketData = Join-Path $repoRoot "morning_brief\data\$ReportDate`_market_data.js"
$verifiedData = Join-Path $repoRoot "morning_brief\data\$ReportDate`_verified_market.json"
$historyCache = Join-Path $repoRoot "morning_brief\data\cache\market_history.json"
$artifacts = @($reportHtml, $marketData, $verifiedData, $historyCache)

foreach ($artifact in $artifacts) {
  if (-not (Test-Path -LiteralPath $artifact)) {
    throw "Missing daily brief artifact: $artifact"
  }
}

Push-Location $repoRoot
try {
  & node morning_brief/scripts/audit_market_cache.js "morning_brief/data/$ReportDate`_market_data.js"
  if ($LASTEXITCODE -ne 0) { throw 'Market cache audit failed.' }
  & node morning_brief/scripts/validate_market_data.js "morning_brief/data/$ReportDate`_market_data.js"
  if ($LASTEXITCODE -ne 0) { throw 'Market data validation failed.' }
  & node morning_brief/scripts/validate_html.js "morning_brief/$ReportDate`_us_market_brief.html"
  if ($LASTEXITCODE -ne 0) { throw 'HTML validation failed.' }

  if (-not $CommitAndPush) {
    Write-Output "Daily brief artifacts are valid and ready to publish: $ReportDate"
    $artifacts | ForEach-Object { Write-Output $_ }
    return
  }

  # Explicit paths preserve unrelated dashboard work in a dirty repository.
  & git add -- $artifacts
  if ($LASTEXITCODE -ne 0) { throw 'Unable to stage daily brief artifacts.' }

  $staged = @(& git diff --cached --name-only -- $artifacts)
  if ($staged.Count -eq 0) {
    Write-Output "No daily brief artifact changes to commit for $ReportDate."
    return
  }

  & git commit -m "Publish daily U.S. market brief $ReportDate with local data" -- $artifacts
  if ($LASTEXITCODE -ne 0) { throw 'Unable to commit daily brief artifacts.' }
  & git push
  if ($LASTEXITCODE -ne 0) { throw 'Unable to push the daily brief commit.' }

  Write-Output "Published $ReportDate with $($staged.Count) report and local-data artifact(s)."
}
finally {
  Pop-Location
}
