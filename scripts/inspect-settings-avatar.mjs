async function run() {
  const res = await fetch('http://localhost:9222/json');
  const targets = await res.json();
  const target = targets.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      id: 1,
      method: 'Runtime.evaluate',
      params: {
        expression: `
          (() => {
            const img = document.querySelector('.card-3d img');
            const container = img ? img.parentElement : null;
            return {
              imgSrc: img?.src,
              naturalWidth: img?.naturalWidth,
              naturalHeight: img?.naturalHeight,
              complete: img?.complete,
              imgRect: img?.getBoundingClientRect(),
              containerRect: container?.getBoundingClientRect(),
              containerClass: container?.className,
              imgClass: img?.className
            };
          })()
        `,
        returnByValue: true
      }
    }));
  };

  ws.onmessage = (e) => {
    console.log(e.data);
    ws.close();
    process.exit(0);
  };
}

run().catch(console.error);
