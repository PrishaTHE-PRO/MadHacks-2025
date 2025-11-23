// src/services/proximityService.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getProximitySocket() {
    if (!socket) {
        socket = io(import.meta.env.VITE_PROXIMITY_URL, {
            // allow both polling and websockets
            transports: ["websocket", "polling"],
        });
    }
    return socket;
}

