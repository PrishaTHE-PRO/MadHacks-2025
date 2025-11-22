import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getProximitySocket() {
    if (!socket) {
        socket = io(import.meta.env.VITE_PROXIMITY_URL, {
            transports: ["websocket"],
        });
    }
    return socket;
}
