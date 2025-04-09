function wsConnect() {
    if (ws) return;
    ws = new WebSocket("ws://localhost:8080/websocket");

    ws.onopen = () => {
        clearTimeout(ws_timeout_id);
        console.log("WebSocket connected");
    }

    ws.onmessage = (event) => {
        if (event.data === "reload") {
            ws.close()
            location.reload();
        }
    };

    ws.onclose = () => {
        ws = null;
        ws_timeout_id = setTimeout(() => wsConnect(), 1000);
    };
}

let ws = null;
let ws_timeout_id = null;
wsConnect();
