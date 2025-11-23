// src/services/eventService.ts
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

/* -----------------------------------------------------
   INTERACTIONS  (contacts saved when meeting someone)
------------------------------------------------------ */

/**
 * Save or update an interaction when a user views another user's profile.
 * This writes a single stable doc:
 *   interactions/{ownerUserId}_{eventCode}_{otherUserId}
 */
export async function saveInteraction(params: {
  ownerUserId: string;
  otherUserId: string; // MUST be the UID
  eventCode: string;
  note?: string;
}) {
  const { ownerUserId, otherUserId, eventCode, note } = params;

  const interactionId = `${ownerUserId}_${eventCode}_${otherUserId}`;
  const ref = doc(db, "interactions", interactionId);

  await setDoc(
    ref,
    {
      ownerUserId,
      otherUserId,
      eventCode,
      note: note ?? "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Update fields of an existing interaction (favorite, note, etc.)
 */
export async function updateInteraction(params: {
  ownerUserId: string;
  otherUserId: string;
  eventCode: string;
  note?: string;
  favorite?: boolean;
}) {
  const { ownerUserId, otherUserId, eventCode, note, favorite } = params;

  const interactionId = `${ownerUserId}_${eventCode}_${otherUserId}`;
  const ref = doc(db, "interactions", interactionId);

  await setDoc(
    ref,
    {
      note: note ?? undefined,
      favorite: favorite ?? undefined,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Remove a contact from an event
 */
export async function deleteInteraction(params: {
  ownerUserId: string;
  otherUserId: string;
  eventCode: string;
}) {
  const { ownerUserId, otherUserId, eventCode } = params;

  const interactionId = `${ownerUserId}_${eventCode}_${otherUserId}`;
  const ref = doc(db, "interactions", interactionId);

  await deleteDoc(ref);
}

/**
 * Return all interactions for a specific event
 */
export async function getInteractionsForEvent(
  ownerUserId: string,
  eventCode: string
) {
  const q = query(
    collection(db, "interactions"),
    where("ownerUserId", "==", ownerUserId),
    where("eventCode", "==", eventCode)
  );

  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * Get all favorited contacts across ALL events
 */
export async function getFavoriteInteractions(ownerUserId: string) {
  const q = query(
    collection(db, "interactions"),
    where("ownerUserId", "==", ownerUserId),
    where("favorite", "==", true)
  );

  const snaps = await getDocs(q);
  return snaps.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/* -----------------------------------------------------
   EVENTS + MEMBERSHIPS
------------------------------------------------------ */

export type Role = "attendee" | "recruiter";

export type FirestoreEvent = {
  code: string;
  name: string;
  date: string;
  time: string;
  location: string;
  createdByUid: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  startTimestamp?: number;
};

const EVENTS_COLLECTION = "events";
const MEMBERS_COLLECTION = "eventMemberships";

/**
 * Create a new event and register membership for the creator
 */
export async function createEventInDb(args: {
  code: string;
  name: string;
  date: string;
  time: string;
  location: string;
  createdByUid: string;
  role: Role;
  imageUrl?: string;
  lat?: number | null;
  lng?: number | null;
  startTimestamp?: number | null;
}) {
  const {
    code,
    name,
    date,
    time,
    location,
    createdByUid,
    role,
    imageUrl,
    lat,
    lng,
    startTimestamp,
  } = args;

  const eventRef = doc(db, EVENTS_COLLECTION, code);

  const exists = await getDoc(eventRef);
  if (exists.exists()) throw new Error("Event code already exists.");

  // Create event
  await setDoc(eventRef, {
    code,
    name,
    date,
    time,
    location,
    createdByUid,
    imageUrl: imageUrl || null,
    lat: lat ?? null,
    lng: lng ?? null,
    startTimestamp: startTimestamp ?? null,
    createdAt: serverTimestamp(),
  });

  // Register the creator as member
  const membershipRef = doc(db, MEMBERS_COLLECTION, `${createdByUid}_${code}`);
  await setDoc(membershipRef, {
    eventCode: code,
    userId: createdByUid,
    role,
    joinedAt: serverTimestamp(),
  });
}

/**
 * Join an existing event
 */
export async function joinEventInDb(
  eventCode: string,
  uid: string,
  role: Role
): Promise<FirestoreEvent> {
  const eventRef = doc(db, EVENTS_COLLECTION, eventCode);
  const snap = await getDoc(eventRef);

  if (!snap.exists()) throw new Error("Event code does not exist.");

  const membershipRef = doc(db, MEMBERS_COLLECTION, `${uid}_${eventCode}`);
  await setDoc(
    membershipRef,
    {
      eventCode,
      userId: uid,
      role,
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return snap.data() as FirestoreEvent;
}

/**
 * Get all events a user is a member of
 */
export async function getEventsForUser(
  uid: string
): Promise<{ event: FirestoreEvent; role: Role }[]> {
  const q = query(
    collection(db, MEMBERS_COLLECTION),
    where("userId", "==", uid)
  );

  const memberships = await getDocs(q);
  const result: { event: FirestoreEvent; role: Role }[] = [];

  for (const docSnap of memberships.docs) {
    const { eventCode, role } = docSnap.data() as {
      eventCode: string;
      role: Role;
    };

    const eventRef = doc(db, EVENTS_COLLECTION, eventCode);
    const eventSnap = await getDoc(eventRef);

    if (eventSnap.exists()) {
      result.push({
        event: eventSnap.data() as FirestoreEvent,
        role,
      });
    }
  }

  return result;
}

/**
 * Delete (leave) event or delete entire event if creator
 */
export async function deleteEventForUser(eventCode: string, uid: string) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventCode);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) throw new Error("Event does not exist.");

  const event = eventSnap.data() as FirestoreEvent;
  const membershipRef = doc(db, MEMBERS_COLLECTION, `${uid}_${eventCode}`);

  if (event.createdByUid !== uid) {
    await deleteDoc(membershipRef);
    return;
  }

  await Promise.all([deleteDoc(eventRef), deleteDoc(membershipRef)]);
}

/**
 * Get ALL events for the map page
 */
export async function getEventsNearby(): Promise<FirestoreEvent[]> {
  const snaps = await getDocs(collection(db, EVENTS_COLLECTION));
  return snaps.docs.map((d) => d.data() as FirestoreEvent);
}

/**
 * Get members of event
 */
export async function getMembersForEvent(
  eventCode: string
): Promise<{ userId: string; role: Role }[]> {
  const q = query(
    collection(db, MEMBERS_COLLECTION),
    where("eventCode", "==", eventCode)
  );
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => d.data() as { userId: string; role: Role });
}
