let ws = new WebSocket("ws://localhost:8080/websocket");
ws.onmessage = (event) => {
    if (event.data === "reload") {
        ws.close()
        location.reload();
    }
}