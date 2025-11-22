import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProximitySocket } from "../services/proximityService";
import { AuthContext } from "../context/AuthContext";
import { getProfileByUid } from "../services/profileService";

export function NearbyPage() {
  const { eventCode } = useParams();
  const { user } = useContext(AuthContext);
  const [deviceId] = useState(() => crypto.randomUUID());
  const [myProfileSlug, setMyProfileSlug] = useState<string>("");
  const [others, setOthers] = useState<
    { deviceId: string; profileSlug: string }[]
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      getProfileByUid(user.uid).then((profile) => {
        if (profile?.slug) {
          setMyProfileSlug(profile.slug);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (!eventCode) return;
    const socket = getProximitySocket();

    const sendPresence = () => {
      socket.emit("presence", {
        eventCode,
        deviceId,
        profileSlug: myProfileSlug,
        timestamp: Date.now(),
      });
    };

    sendPresence();
    const interval = setInterval(sendPresence, 1500);

    socket.on("presence", (data: any) => {
      if (data.deviceId === deviceId) return;
      setOthers((prev) =>
        prev.some((o) => o.deviceId === data.deviceId)
          ? prev
          : [...prev, { deviceId: data.deviceId, profileSlug: data.profileSlug }]
      );
    });

    socket.on("incomingProfile", (data: any) => {
      if (data.toDeviceId === deviceId) {
        navigate(`/p/${data.profileSlug}`);
      }
    });

    return () => {
      clearInterval(interval);
      socket.off("presence");
      socket.off("incomingProfile");
    };
  }, [deviceId, eventCode, myProfileSlug, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <h1 className="text-xl font-semibold mb-2">
        Nearby people at {eventCode}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        Anyone on the same WiFi with this page open will appear here.
      </p>

      {others.length === 0 && (
        <p className="text-sm text-gray-400">Waiting for other devices…</p>
      )}

      <div className="w-full max-w-md space-y-3 mt-4">
        {others.map((o) => (
          <div
            key={o.deviceId}
            className="flex items-center justify-between border rounded-xl p-3"
          >
            <div>
              <p className="text-sm font-medium">Someone nearby</p>
              <p className="text-xs text-gray-500">
                Tap to send them your profile
              </p>
            </div>
            <button
              className="px-3 py-1 rounded-full text-xs font-semibold bg-black text-white"
              onClick={() =>
                getProximitySocket().emit("shareProfile", {
                  toDeviceId: o.deviceId,
                  profileSlug: myProfileSlug,
                })
              }
            >
              Share
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
