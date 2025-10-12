# 🌟 Divine AI – Overview

> *Faith • Creativity • Innovation • Purpose*

---

## 🎯 Mission

**Divine AI** exists to inspire and equip faith-driven creators with next-generation AI tools.  
It merges creative production, storytelling, and Scripture engagement in one unified studio — giving anyone the power to **write, speak, design, and grow** with purpose.

---

## 🏠 What’s Inside Divine AI

| Feature | Description | Screenshot |
|----------|--------------|-------------|
| 🎙️ **Podcast Studio** | Generate full episodes with multi-host scripts, ElevenLabs voices, and music beds. | `![Podcast Studio](../attached_assets/podcast-studio.png)` |
| 🖋️ **AI Writer** | Create blogs, devotionals, ad copy, and captions with Gemini. | `![AI Writer](../attached_assets/ai-writer.png)` |
| 🎨 **Image Generator** | Bring prompts to life with Hugging Face models like Stable Diffusion & Playground V2. | `![Image Generator](../attached_assets/image-gen.png)` |
| 🙏 **Bible Reader & Verse Assistant** | Read and explore Scripture in multiple versions. Ask AI for explanations and hear it narrated aloud. | `![Bible Reader](../attached_assets/bible-reader.png)` |
| 🧠 **Voice & Transcription** | Manage voice presets, transcribe audio, and auto-generate episodes from recordings. | `![Voice Tools](../attached_assets/voice-tools.png)` |
| 🎧 **Music & Mixing** | Auto-duck music beds, merge narration, and export final mixes with one click. | `![Music Mixer](../attached_assets/music-mixer.png)` |
| 📊 **Analytics Dashboard** *(coming soon)* | View listen counts, user engagement, and cost metrics across all modules. | `![Analytics](../attached_assets/analytics.png)` |

> 💡 All modules share a unified prompt system and design language for seamless creative flow.

---

## 🧩 Modular Architecture

Divine AI runs as a **monorepo**:

```
client/   → React + Vite + Tailwind frontend
server/   → Express + TS API (Gemini, ElevenLabs, Hugging Face)
shared/   → Reusable types & utilities
scripts/  → Helper tools (e.g., test-apis.mjs)
```

Each module communicates through the Express API, enabling future expansion like mobile apps or microservices.

---

## 🕊️ Bible Reader Deep Dive

The Bible Reader integrates AI and devotion:

- 📖 **Multi-translation view** (KJV, NIV, ESV, NLT)  
- 🔎 **Keyword search** across versions  
- 🧠 **AI insight** – ask Gemini to explain context or historical meaning  
- 🔊 **Read-aloud** with ElevenLabs  
- ❤️ **Favorites & Notes** saved via Supabase  
- 📆 **Verse of the Day** scheduler  

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|---------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node, Express, TypeScript |
| AI Engines | Gemini (Pro), ElevenLabs TTS, Hugging Face, Deepgram (stubbed) |
| Database | Drizzle ORM + PostgreSQL / Supabase |
| Dev Ops | Docker + Devcontainer |
| Security | Env Secrets, Rate Limiters, Auth (Planned) |

---

## 🚀 Getting Started

```bash
git clone https://github.com/diazadam/divine-ai-app
cd divine-ai-app
npm install
cp .env.example .env
npm run dev
```

Visit:
- **Frontend:** http://localhost:5173  
- **API:** http://localhost:5001  

Or with Docker:
```bash
docker compose -f docker-compose.dev.yml up --build
```

---

## 🧠 AI Endpoints Preview

| Endpoint | Purpose |
|-----------|----------|
| `/api/generate-script` | Generate podcast outline/dialogue |
| `/api/synthesize` | Convert dialogue to audio |
| `/api/build-episode` | Merge and mix segments |
| `/api/generate-content` | Produce articles & marketing copy |
| `/api/images` | Generate artwork from prompts |
| `/api/bible/explain` | Get AI commentary on a verse |

---

## 🛣️ Roadmap Highlights

- ✅ Podcast Studio v1  
- ✅ AI Writer v1  
- ✅ Image Generator v1  
- ✅ Bible Reader Beta  
- 🚧 Analytics & Team Collab  
- 🚧 Mobile App (React Native / Expo)  
- 🚧 Marketplace for Voices & Music  

---

## 👥 Community & Contributing

We welcome open-source believers, creators, and coders!  

1. Fork & clone the repo  
2. Create a branch  
3. Add your feature or fix  
4. Submit a PR  

Full guidelines: [../CONTRIBUTING.md](../CONTRIBUTING.md)

Join the **Divine AI Community** to share feedback, ideas, and resources. *(Community portal coming soon.)*

---

## 💬 Contact & Support

**Created by:** A. Diaz  
**Project:** Divine AI Studio  
**Website:** Coming soon  
**Email:** support@divineai.app *(placeholder)*  

---

## 🕊️ Scripture Inspiration

> “Whatever you do, work at it with all your heart, as working for the Lord.”  
> — Colossians 3:23

---

## 📜 License

MIT © 2025 A. Diaz – Divine AI Group
