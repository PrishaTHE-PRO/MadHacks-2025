// src/services/imageUploadService.ts
/**
 * Upload image using one of the configured strategies:
 * - If VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET are set, use unsigned Cloudinary upload
 * - Else if VITE_IMAGE_UPLOAD_URL is set, POST the file to that URL (expects JSON { url })
 * - Otherwise fall back to Firebase Storage (requires ../firebase export)
 */
import { storage } from "../firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadImage(file: File, userUid: string, code: string): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  const customUrl = import.meta.env.VITE_IMAGE_UPLOAD_URL as string | undefined;

  // 1) Cloudinary unsigned upload
  if (cloudName && uploadPreset) {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    // optional: add a public_id prefix
    fd.append("public_id", `event_images/${userUid}/${code}_${file.name}`);

    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) {
      throw new Error(`Cloudinary upload failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!data || !data.secure_url) throw new Error("Cloudinary response missing secure_url");
    return data.secure_url as string;
  }

  // 2) Custom upload endpoint
  if (customUrl) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("userUid", userUid);
    fd.append("code", code);
    const res = await fetch(customUrl, { method: "POST", body: fd });
    if (!res.ok) {
      throw new Error(`Image upload to ${customUrl} failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    if (!data || !data.url) throw new Error("Upload endpoint response missing url");
    return data.url as string;
  }

  // 3) Firebase Storage fallback
  try {
    const path = `event_images/${userUid}/${code}_${file.name}`;
    const sRef = storageRef(storage, path);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    return url;
  } catch (err) {
    throw new Error(`Firebase storage upload failed: ${(err as any)?.message || err}`);
  }
}

export default uploadImage;
