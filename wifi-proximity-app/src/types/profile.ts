export type UserRole = "recruiter" | "recruitee";

export interface UserProfile {
    userId: string;
    role: UserRole;
    slug: string;          // used in URL: /p/:slug
    name: string;
    shortBio: string;
    photoUrl?: string;
    resumeUrl?: string;
    linkedin?: string;
    website?: string;
    videoIntroUrl?: string;
    hobbies?: string[];
    affiliation?: string;
}
