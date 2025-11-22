const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: { origin: "*" },
});

io.on("connection", (socket) => {
    socket.on("presence", (data) => {
        // data: { eventCode, deviceId, profileSlug, timestamp }
        socket.join(data.eventCode);
        socket.to(data.eventCode).emit("presence", data);
    });

    socket.on("shareProfile", ({ toDeviceId, profileSlug }) => {
        io.emit("incomingProfile", { toDeviceId, profileSlug });
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log("Proximity server running on", PORT);
});
