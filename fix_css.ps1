$file = 'c:\Antigravity Work\crypto-mc-calc\styles\cards.css'
$content = [System.IO.File]::ReadAllText($file)

# Insert grid-auto-rows after grid-template-columns
$content = $content.Replace(
    "    grid-template-columns: 1fr 1fr;`r`n    gap: 8px;",
    "    grid-template-columns: 1fr 1fr;`r`n    grid-auto-rows: 52px;`r`n    gap: 8px;"
)

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host 'grid-auto-rows added'
