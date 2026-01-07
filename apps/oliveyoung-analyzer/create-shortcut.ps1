# 바탕화면에 바로가기 생성
$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$Desktop\올리브영 리뷰 분석기.lnk")
$Shortcut.TargetPath = "$PSScriptRoot\start.bat"
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "올리브영 리뷰 분석기"
$Shortcut.Save()

Write-Host "바탕화면에 '올리브영 리뷰 분석기' 바로가기가 생성되었습니다!" -ForegroundColor Green
