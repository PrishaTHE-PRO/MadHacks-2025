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

// Generate a URL-friendly slug from a name
function generateSlugFromName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
}

// Check if a slug is already in use
async function isSlugTaken(slug: string, currentUid: string): Promise<boolean> {
    const q = query(collection(db, "profiles"), where("slug", "==", slug));
    const snaps = await getDocs(q);

    // Allow the current user to keep their own slug
    return snaps.docs.some(doc => doc.id !== currentUid);
}

// Generate a unique slug, adding numbers if needed
async function generateUniqueSlug(name: string, uid: string): Promise<string> {
    const baseSlug = generateSlugFromName(name);

    if (!baseSlug) {
        // Fallback if name produces empty slug
        return `user-${uid.slice(0, 8)}`;
    }

    let slug = baseSlug;
    let counter = 2;

    while (await isSlugTaken(slug, uid)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

export async function saveProfile(uid: string, profile: any) {
    const refDoc = doc(db, "profiles", uid);

    // Auto-generate slug from name if not provided
    let slug = profile.slug;
    if (!slug && profile.name) {
        slug = await generateUniqueSlug(profile.name, uid);
    }

    await setDoc(
        refDoc,
        {
            ...profile,
            slug,
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
