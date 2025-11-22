import { db } from "@/firebase";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";

export async function saveInteraction(params: {
    ownerUserId: string;
    otherUserId: string;
    eventCode: string;
    note?: string;
}) {
    await addDoc(collection(db, "interactions"), {
        ...params,
        createdAt: serverTimestamp(),
    });
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