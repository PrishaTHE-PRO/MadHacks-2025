# Ripple 🌊  
**Your network in motion.**

Ripple is a web app that helps recruiters and recruitees turn fleeting event encounters into lasting, meaningful connections—without the clutter of flyers, business cards, or lost resumes.

---

## Inspiration

For all of us, the best part of hackathons isn’t just building cool projects—it’s the people. We love meeting teams from different schools, backgrounds, and skill sets, and turning quick introductions into genuine connections. But we noticed that a lot of those connections fade once the event ends, and stacks of flyers, business cards, and resumes end up forgotten.

We wanted to create something that makes both our projects and our interactions more lasting and impactful. Ripple grew out of that idea: a way to carry the energy, diversity, and serendipity of hackathon conversations forward—beyond the venue, beyond the weekend, and into real ongoing networks.

---

## What it does

Ripple is a web app that helps recruiters and recruitees make meaningful, lasting connections at events.

- Users create rich, shareable profiles with bios, links, resumes, photos, and video intros.
- Attendees can create or join events using a simple event code.
- A **Nearby** view helps you discover other participants at the same event in real time.
- You can save contacts, star important ones, and add notes tied to a specific event.
- An **Event Contacts** page organizes everyone you met at each event so you remember who they are, where you met, and what you talked about.
- A **Map view** lets users browse nearby events by location.

All of this replaces physical flyers and business cards with a reusable digital-first networking experience that’s more convenient, more eco-friendly, and more personal.

---

## How we built it

We used **JavaScript**, **TypeScript**, **HTML**, and **CSS** on the frontend, built primarily with **React** and **Vite**. The UI is styled with **MUI (Material UI)** for fast, responsive components.

On the backend, we used **Firebase** as a Backend-as-a-Service to handle:

- Authentication and user accounts  
- Firestore for events, profiles, and saved interactions  
- Storage for profile photos, resumes, and media links  

To power real-time proximity networking, we built a **Node.js/Express proximity server** using:

- **Socket.IO** to manage real-time “nearby” presence for each event  
  - Each event maps to a Socket.IO room  
  - Users join/leave rooms as they enter or exit the Nearby page  
- **CORS** configuration to safely allow our Vite dev server and deployed frontend to talk to the proximity backend from different origins

Together, the React frontend, Firebase backend, and Socket.IO proximity server create an end-to-end system where you can discover nearby attendees, view their profiles, and save those encounters into your personal event contact list.

---

## Challenges we ran into

None of us had any experience with Firebase, Socket.IO, or CORS when we started, so there was a steep learning curve. We spent a lot of time just understanding how to structure data in Firestore, how to persist contacts and interactions per event, and how to wire authentication into our routing and profile pages.

On the networking side, getting the proximity server working reliably was especially challenging. We had to debug Socket.IO room behavior, handle multiple devices on the same network, and configure CORS correctly so that the frontend and backend would talk to each other without throwing errors. We also learned a lot about the small UX details required to make the app feel smooth and accessible across different screen sizes and devices—things like card layouts, navigation flow, and making information scannable under time pressure at real events.

---

## Accomplishments that we're proud of

We’re proud that we were able to take Ripple from just a loose idea about “better networking” to a working end-to-end system in such a short time. We built a responsive React interface where users can create events, build rich profiles, and save contacts with notes and favorites—all tied together with Firebase for authentication, storage, and persistence.

On top of that, we’re especially proud of getting the real-time proximity piece working: wiring up a Node.js/Express proximity server with Socket.IO and CORS so nearby users at the same event can actually discover each other in real time and save those encounters as meaningful connections instead of fleeting hallway chats. Seeing all of these pieces—frontend, backend, and networking—talk to each other smoothly felt like a big milestone for us.

---

## What we learned

We learned a lot about what it really means to make “networking” feel natural and personal in a technical product. On the technical side, we deepened our understanding of real-time networking using Socket.IO, handling CORS properly across different origins, and dealing with the quirks of local networks and multiple devices during development. We also gained experience structuring data in Firebase so that events, users, and interactions stay clean and queryable as the app grows.

On the human side, we learned how different recruiters and recruitees think about first impressions, follow-ups, and context—things like notes, roles, and event-based grouping actually matter for whether a connection lasts. Ripple pushed us to think beyond “just build a feature” and toward designing an experience that supports real relationships.

---

## What's next for Ripple

Next, we want to take Ripple beyond a hackathon prototype and move closer to something people could actually use at real events. That includes hardening the proximity server, improving device discovery, and exploring more robust approaches (like integrating Wi-Fi/BLE-based signals where possible) while still making everything secure and privacy-conscious.

On the product side, we’d love to add smarter features: better ways to surface important contacts after an event, reminders to follow up, and richer profile sharing for both recruiters and students. We also see Ripple expanding beyond hackathons—to career fairs, campus recruiting events, and conferences—so that **“your network in motion”** becomes part of everyday professional life, not just a weekend project.

---

## Features

- 🌐 Rich shareable profiles with bios, links, media, and video intros  
- 📍 Event creation & joining via simple event codes  
- 🧭 **Nearby** real-time view of other attendees at the same event  
- ⭐ Save contacts, star favorites, and write event-specific notes  
- 📒 Event Contacts page to recall who you met and where  
- 🗺️ Map view of nearby events  
- ☁️ Persistent data powered by Firebase  

---

## Tech Stack

**Frontend**
- React + TypeScript  
- Vite  
- MUI (Material UI)  

**Backend / Services**
- Firebase Authentication  
- Firebase Firestore  
- Firebase Storage  

**Proximity Server**
- Node.js + Express  
- Socket.IO  
- CORS  

---

## Getting Started (dev)

> This is a high-level guide; tweak paths/names to match your repo structure.

### Prerequisites

- Node.js (LTS)  
- npm / pnpm / yarn  
- A Firebase project (with Web app, Auth, Firestore, and Storage enabled)

### 1. Clone the repo

```bash
git clone https://github.com/<your-org-or-username>/ripple.git
cd ripple
```

### 2. Frontend setup
Inside your frontend folder (for example ./ or ./frontend):
```bash
npm install
```
Create a .env (or .env.local) with your Firebase config:
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_PROXIMITY_SERVER_URL=...
```
Run the dev server:
```bash
npm run dev
```

### 3. Proximity server setup (Socket.IO)

Inside your proximity server folder (for example ./proximity-server):
```bash
npm install
```
Create a simple .env (or config) with CORS allowed origins:
```bash
PORT=4000
CORS_ORIGIN=http://localhost:5173
```
Run the server:
```bash
npm start
```

Now open the frontend dev URL (usually http://localhost:5173) and you should be able to:

Sign up / log in

Create or join events

Open the Nearby view (with multiple devices/browsers) and see presence updates in real time

View and save profiles + contacts per event

## Project Status

Ripple was built as a hackathon project and is still a prototype.
We’re excited to keep iterating on it, especially around real-time networking, discovery, and event workflows.
