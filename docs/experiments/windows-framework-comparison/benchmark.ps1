$ErrorActionPreference='Stop'
$taskRoot=$PSScriptRoot
$taskCandidates=@{
    electron=(Join-Path $taskRoot '../../work/portable/ModularWorkstation-win32-x64/ModularWorkstation.exe')
    tauri=(Join-Path $taskRoot 'tauri-candidate/src-tauri/target/release/tauri-candidate.exe')
}
$taskSamples=[Collections.Generic.List[object]]::new()
for($taskRun=0;$taskRun -lt 5;$taskRun++) {
    foreach($taskFramework in @('electron','tauri')) {
        $taskExecutable=[IO.Path]::GetFullPath($taskCandidates[$taskFramework])
        if(!(Test-Path -LiteralPath $taskExecutable)){throw "Missing candidate: $taskFramework"}
        $taskStart=[Diagnostics.ProcessStartInfo]::new($taskExecutable)
        $taskStart.WorkingDirectory=[IO.Path]::GetDirectoryName($taskExecutable)
        $taskStart.UseShellExecute=$false
        $taskStart.CreateNoWindow=$true
        $taskStart.Environment.Remove('WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS') | Out-Null
        $taskStart.Environment['WEBVIEW2_USER_DATA_FOLDER']=Join-Path $taskRoot 'benchmark-webview-profile'
        $taskStopwatch=[Diagnostics.Stopwatch]::StartNew()
        $taskProcess=[Diagnostics.Process]::Start($taskStart)
        try {
            do {
                $taskProcess.Refresh()
                if($taskProcess.HasExited){throw "$taskFramework exited before window creation"}
                if($taskProcess.MainWindowHandle -ne [IntPtr]::Zero){break}
                Start-Sleep -Milliseconds 50
            }while($taskStopwatch.ElapsedMilliseconds -lt 20000)
            if($taskProcess.MainWindowHandle -eq [IntPtr]::Zero){throw "$taskFramework no main window within 20s"}
            $taskWindowMs=$taskStopwatch.Elapsed.TotalMilliseconds
            Start-Sleep -Seconds 3
            $taskAll=Get-CimInstance Win32_Process
            $taskMap=@{}
            foreach($taskRecord in $taskAll){$taskMap[[int]$taskRecord.ProcessId]=$taskRecord}
            $taskIds=[Collections.Generic.HashSet[int]]::new()
            [void]$taskIds.Add($taskProcess.Id)
            do {
                $taskChanged=$false
                foreach($taskChild in $taskAll) {
                    $taskParent=$taskMap[[int]$taskChild.ParentProcessId]
                    if($taskParent -and $taskChild.CreationDate -ge $taskParent.CreationDate -and $taskIds.Contains([int]$taskChild.ParentProcessId) -and !$taskIds.Contains([int]$taskChild.ProcessId)) {
                        [void]$taskIds.Add([int]$taskChild.ProcessId);$taskChanged=$true
                    }
                }
            }while($taskChanged)
            $taskChildren=@($taskAll|Where-Object {$taskIds.Contains([int]$_.ProcessId)}|ForEach-Object {
                @{pid=$_.ProcessId;parent=$_.ParentProcessId;createdAtUtc=$_.CreationDate.ToUniversalTime().ToString('o');name=$_.Name;workingSetBytes=[long]$_.WorkingSetSize;privateBytes=[long]$_.PrivatePageCount}
            })
            $taskSample=@{framework=$taskFramework;run=$taskRun;windowDetectedMs=$taskWindowMs;processes=$taskChildren;workingSetBytes=($taskChildren.workingSetBytes|Measure-Object -Sum).Sum;privateBytes=($taskChildren.privateBytes|Measure-Object -Sum).Sum}
            $taskSamples.Add($taskSample)
            $taskSamples.ToArray()|ConvertTo-Json -Depth 7|Set-Content (Join-Path $taskRoot 'native-benchmark.json') -Encoding utf8
            [pscustomobject]@{framework=$taskFramework;run=$taskRun;windowMs=[math]::Round($taskWindowMs);workingSetMiB=[math]::Round($taskSample.workingSetBytes/1MB,1);privateMiB=[math]::Round($taskSample.privateBytes/1MB,1)}|ConvertTo-Json -Compress
        }finally {
            if(!$taskProcess.HasExited){$taskProcess.Kill();[void]$taskProcess.WaitForExit(10000)}
            $taskProcess.Dispose()
        }
    }
}
