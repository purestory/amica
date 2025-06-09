if (typeof window !== "undefined") {
  if(! window.error_handler_installed) {
    window.error_handler_logs = [];

    const handler = ((old) => ({
      get: (_, name) => {
        function passf() {
          old[name].apply(null, arguments);
        }

        function logf() {
          // ONNX 런타임 경고 메시지 필터링
          const message = arguments[0];
          if (typeof message === 'string') {
            // 'onnxruntime' 문자열을 포함하는 경고 필터링
            if (message.includes('onnxruntime') || 
                // 'CleanUnusedInitializersAndNodeArgs' 메시지 필터링 
                message.includes('CleanUnusedInitializersAndNodeArgs') ||
                // VRM 관련 경고 메시지 필터링
                message.includes('removeUnnecessaryJoints is deprecated')) {
              // 경고 메시지 무시
              return;
            }
          }
          
          // VAD 관련 에러 필터링 - getUserMedia 미지원 관련 에러
          if (name === 'error' && message === 'vad error' && 
              arguments[1] && arguments[1].message && 
              arguments[1].message.includes('getUserMedia is not implemented')) {
            // VAD getUserMedia 에러 무시
            return;
          }

          const logEntry = {
            type: name,
            ts: +new Date(),
            arguments,
          };
          window.error_handler_logs.push(logEntry);

          const logsUrl = new URL(`${window.location.protocol}//${window.location.hostname}:${window.location.port}/api/dataHandler`);
          logsUrl.searchParams.append("type", "logs");
          const apiEnabled = localStorage.getItem("chatvrm_external_api_enabled");
          if (window.location.hostname === "localhost" && apiEnabled === "true") {
            fetch(logsUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(logEntry),
            });
          }

          passf.apply(null, arguments);
        }

        switch (name) {
          case 'log':
          case 'debug':
          case 'info':
          case 'warn':
          case 'error':
            return logf;
          default:
            return passf;
        }
      }
    }))(window.console);
    window.console = new Proxy({}, handler);

    window.addEventListener("error", (e) => {
      console.error(`Error occurred: ${e.error.message} ${e.error.stack}`);
      return false;
    });

    window.addEventListener("unhandledrejection", (e) => {
      console.error(`Unhandled rejection: ${e.message}`);
      return false;
    });

    window.error_handler_installed = true;
  }
}
