# MTalk
> "The Ultimate Manhwa & Manhua Social Hub"

MTalk is the ultimate social tracking, discussion, and community platform exclusively for manhwa and manhua fans. It combines the best elements of platforms like **ComicK.io** (reviews, karma), **MyAnimeList** (tracking), **Asura Scans** (updates), **Discord** (global chat), and **Instagram** (social feed) into ONE beautiful app.

*Note: MTalk is STRICTLY NOT a reader app. It does not host chapters.*

## 🚀 Tech Stack
- **Backend**: Node.js (ESM), Express, MongoDB (Mongoose), JWT Auth, Socket.io, bcryptjs
- **Public APIs**: AniList GraphQL API

## ⚙️ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI string

### 2. Environment Variables Setup
You need to set up the environment variables for both the client and server.

 **Server**: Navigate to `server/` and create a `.env` file based on `server/.env.example`:
   ```bash
   cp server/.env.example server/.env
   ```

### 3. Install Dependencies & Run

**Backend (Port 5005):**
```bash
cd server
npm install
npm run dev
```

## 🎨 Aesthetic Requirements
The core design language is built around **ComicK.io**'s dark mode mapping:
- **Base**: Extreme dark mode `#0f0f0f`
- **Material**: Glassmorphism (`backdrop-blur` UI cards)
- **Accents**: Neon Cyan (`#00f5ff`) and Magenta (`#ff00aa`) drop shadows
- **Transitions**: Smooth state variations via `Framer Motion` and Tailwind utilities
