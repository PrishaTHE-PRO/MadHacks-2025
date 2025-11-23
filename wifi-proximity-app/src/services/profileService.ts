// src/services/profileService.ts
import { db, storage } from "../firebase";
import {
    doc,
    setDoc,
    getDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    collection,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function saveProfile(uid: string, profile: any) {
    const refDoc = doc(db, "profiles", uid);
    await setDoc(
        refDoc,
        {
            ...profile,
            userId: uid,
            updatedAt: serverTimestamp(),
            createdAt: profile.createdAt || serverTimestamp(),
        },
        { merge: true }
    );
}

export async function getProfileByUid(uid: string) {
    const refDoc = doc(db, "profiles", uid);
    const snap = await getDoc(refDoc);
    return snap.exists() ? snap.data() : null;
}

export async function getProfileBySlug(slug: string) {
    const q = query(collection(db, "profiles"), where("slug", "==", slug));
    const snaps = await getDocs(q);
    if (snaps.empty) return null;
    return snaps.docs[0].data();
}

/**
 * Helper that treats its argument as either a slug or a UID.
 * First tries slug, then falls back to document id.
 */
export async function getProfileByIdOrSlug(idOrSlug: string) {
    const bySlug = await getProfileBySlug(idOrSlug);
    if (bySlug) return bySlug;

    const byUid = await getProfileByUid(idOrSlug);
    return byUid;
}

export async function uploadPhoto(uid: string, file: File) {
    const r = ref(storage, `profilePhotos/${uid}`);
    await uploadBytes(r, file);
    return getDownloadURL(r);
}

export async function uploadResume(uid: string, file: File) {
    const r = ref(storage, `resumes/${uid}`);
    await uploadBytes(r, file);
    return getDownloadURL(r);
}
