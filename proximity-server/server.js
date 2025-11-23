const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: { origin: "*" },
});

io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("presence", (data) => {
        // data: { eventCode, deviceId, profileSlug, timestamp }
        socket.join(data.eventCode);
        socket.to(data.eventCode).emit("presence", data);
    });

    socket.on("shareProfile", ({ toDeviceId, profileSlug }) => {
        io.emit("incomingProfile", { toDeviceId, profileSlug });
    });

    // Handle ping for latency measurement
    socket.on("ping", (data) => {
        // data: { targetDeviceId, deviceId }
        // Broadcast to all clients to find the target
        io.emit("ping", data);
    });

    // Handle pong response
    socket.on("pong", (data) => {
        // data: { fromDeviceId, toDeviceId }
        // Send pong back to the requester
        io.emit("pong", data);
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log("Proximity server running on", PORT);
});
