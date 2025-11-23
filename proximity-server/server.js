// server.js
const { createServer } = require("http");
const { Server } = require("socket.io");

// Create bare HTTP server just for socket.io
const httpServer = createServer();

// Allow your Vite dev server / deployed frontend to connect
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Map deviceId -> socket.id so we can direct messages
const deviceIdToSocketId = new Map();

io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // ---------------- presence broadcasting ----------------
    socket.on("presence", (data) => {
        // data: { eventCode, deviceId, profileSlug, userId, timestamp }
        const { eventCode, deviceId } = data || {};
        if (!eventCode) return;

        // join room for that event
        socket.join(eventCode);

        // remember which deviceId this socket belongs to
        if (deviceId) {
            socket.data.deviceId = deviceId;
            deviceIdToSocketId.set(deviceId, socket.id);
        }

        // send presence to *other* clients in the same event
        socket.to(eventCode).emit("presence", data);
    });

    // ---------------- profile sharing ----------------
    socket.on("shareProfile", ({ toDeviceId, profileSlug }) => {
        if (!toDeviceId || !profileSlug) return;

        const targetSocketId = deviceIdToSocketId.get(toDeviceId);

        if (targetSocketId) {
            // direct to that device only
            io.to(targetSocketId).emit("incomingProfile", {
                toDeviceId,
                profileSlug,
            });
        } else {
            // fallback: broadcast if we don't know the device
            io.emit("incomingProfile", { toDeviceId, profileSlug });
        }
    });

    // ---------------- latency ping/pong relay ----------------
    // Your client calls: socket.emit("latencyPing", { targetDeviceId, deviceId })
    socket.on("latencyPing", ({ targetDeviceId, deviceId }) => {
        if (!targetDeviceId || !deviceId) return;

        const targetSocketId = deviceIdToSocketId.get(targetDeviceId);
        if (!targetSocketId) return;

        // Forward a ping to the target client so it can answer with latencyPong
        io.to(targetSocketId).emit("latencyPing", {
            fromDeviceId: deviceId,       // who started the ping
            toDeviceId: targetDeviceId,   // who should respond
        });
    });

    // The *other* client answers with: socket.emit("latencyPong", { fromDeviceId, toDeviceId })
    socket.on("latencyPong", ({ fromDeviceId, toDeviceId }) => {
        if (!fromDeviceId || !toDeviceId) return;

        // toDeviceId = original initiator; send the pong back there
        const initiatorSocketId = deviceIdToSocketId.get(toDeviceId);
        if (!initiatorSocketId) return;

        io.to(initiatorSocketId).emit("latencyPong", {
            fromDeviceId,  // who responded
            toDeviceId,    // original initiator
        });
    });

    // ---------------- disconnect cleanup ----------------
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);

        const deviceId = socket.data.deviceId;
        if (deviceId && deviceIdToSocketId.get(deviceId) === socket.id) {
            deviceIdToSocketId.delete(deviceId);
        }
    });
});

// Listen on 0.0.0.0 so phones / other devices on same Wi-Fi can connect
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, "0.0.0.0", () => {
    console.log("Proximity server running on", PORT);
});
