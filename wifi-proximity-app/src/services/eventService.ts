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

/* ---------- existing interaction helpers ---------- */

// eventService.ts

export async function saveInteraction(params: {
    ownerUserId: string;
    otherUserId: string;   // can be UID or slug, but must be stable
    eventCode: string;
    note?: string;
}) {
    const { ownerUserId, otherUserId, eventCode, note } = params;

    // one doc per (owner, event, otherUser)
    const interactionId = `${ownerUserId}_${eventCode}_${otherUserId}`;

    const ref = doc(db, "interactions", interactionId);

    await setDoc(
        ref,
        {
            ownerUserId,
            otherUserId,
            eventCode,
            note,
            // createdAt will be set on first write; updatedAt changes each time
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

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
    return snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------- NEW: events + memberships ---------- */

export type Role = "attendee" | "recruiter";

export type FirestoreEvent = {
    code: string;
    name: string;
    date: string;
    time: string;
    location: string;
    createdByUid: string;
    imageUrl?: string;
    // optional geo/time fields used by map UI
    lat?: number;
    lng?: number;
    startTimestamp?: number; // ms since epoch
};

const EVENTS_COLLECTION = "events";
const MEMBERS_COLLECTION = "eventMemberships";

/**
 * Create a new event document + membership for the creator.
 * Fails if the event code already exists.
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
    // optional geolocation + start timestamp
    lat?: number | null;
    lng?: number | null;
    startTimestamp?: number | null;
}): Promise<void> {
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
    const existing = await getDoc(eventRef);
    if (existing.exists()) {
        throw new Error("Event code already exists. Please try again.");
    }

    // create event
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

    // creator is also a member
    const membershipRef = doc(
        db,
        MEMBERS_COLLECTION,
        `${createdByUid}_${code}`
    );
    await setDoc(membershipRef, {
        eventCode: code,
        userId: createdByUid,
        role,
        joinedAt: serverTimestamp(),
    });
}

/**
 * Join an existing event by code.
 * Throws if event does not exist.
 */
export async function joinEventInDb(
    eventCode: string,
    uid: string,
    role: Role
): Promise<FirestoreEvent> {
    const eventRef = doc(db, EVENTS_COLLECTION, eventCode);
    const snap = await getDoc(eventRef);
    if (!snap.exists()) {
        throw new Error("That event code does not exist.");
    }

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
 * Get all events this user is a member of (created or joined) + their role.
 */
export async function getEventsForUser(
    uid: string
): Promise<{ event: FirestoreEvent; role: Role }[]> {
    const q = query(
        collection(db, MEMBERS_COLLECTION),
        where("userId", "==", uid)
    );

    const membershipSnap = await getDocs(q);
    const results: { event: FirestoreEvent; role: Role }[] = [];

    for (const m of membershipSnap.docs) {
        const data = m.data() as { eventCode: string; role: Role };
        const eventRef = doc(db, EVENTS_COLLECTION, data.eventCode);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
            results.push({
                event: eventSnap.data() as FirestoreEvent,
                role: data.role,
            });
        }
    }

    return results;
}

export async function deleteEventForUser(eventCode: string, uid: string) {
    const eventRef = doc(db, EVENTS_COLLECTION, eventCode);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
        throw new Error("Event does not exist.");
    }

    const eventData = eventSnap.data() as FirestoreEvent;

    // membership doc for this user
    const membershipRef = doc(db, MEMBERS_COLLECTION, `${uid}_${eventCode}`);

    if (eventData.createdByUid !== uid) {
        // Not the creator: just leave the event and delete *your* membership.
        await deleteDoc(membershipRef);
        return;
    }

    // Creator: delete the event doc and your own membership.
    await Promise.all([
        deleteDoc(membershipRef),
        deleteDoc(eventRef),
    ]);
}

/**
 * Return all events. The map page will filter client-side by radius.
 */
export async function getEventsNearby(): Promise<FirestoreEvent[]> {
    const snaps = await getDocs(collection(db, EVENTS_COLLECTION));
    return snaps.docs.map((d) => d.data() as FirestoreEvent);
}

/**
 * Return membership documents for an event code
 */
export async function getMembersForEvent(eventCode: string): Promise<{ userId: string; role: Role }[]> {
    const q = query(collection(db, MEMBERS_COLLECTION), where("eventCode", "==", eventCode));
    const snaps = await getDocs(q);
    return snaps.docs.map((d) => d.data() as { userId: string; role: Role });
}

/**
 * Get a single event by code
 */
export async function getEventByCode(eventCode: string): Promise<FirestoreEvent | null> {
    const eventRef = doc(db, EVENTS_COLLECTION, eventCode);
    const snap = await getDoc(eventRef);
    if (!snap.exists()) {
        return null;
    }
    return snap.data() as FirestoreEvent;
}