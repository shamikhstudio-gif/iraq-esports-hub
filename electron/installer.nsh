!macro customCheckAppRunning
  DetailPrint "Checking if ${PRODUCT_NAME} is running..."
  ${nsProcess::FindProcess} "${APP_EXECUTABLE_FILENAME}" $R0
  ${If} $R0 == 0
    DetailPrint "${PRODUCT_NAME} is running. Automatically closing background instance..."
    ExecWait 'taskkill /F /T /IM "${APP_EXECUTABLE_FILENAME}"'
    Sleep 1000
  ${EndIf}
  ${nsProcess::Unload}
!macroend
