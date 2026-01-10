Here is the updated **Product Requirement Document (PRD)** for **Catetin**.

I have retained the **Renaissance/Greek Aesthetic** ("The Divine") but adapted the branding and language specifications to fit the Indonesian market. The contrast between the modern name "Catetin" and the classical visual style creates a unique "Modern Classic" identity.

---

# Product Requirement Document (PRD)

**Project Name:** Catetin
**Aesthetic:** Renaissance / Classical / Ethereal (Greek Angelic)
**Language:** **Bahasa Indonesia** (Primary)
**Platform:** Web Application (Desktop/Tablet optimized)
**Status:** Draft v2.1 (Indonesian Localization)

## 1. Executive Summary

**Catetin** is a journaling interface that transforms the act of writing into a creation of art. It rejects the messy "sticky note" culture in favor of a "Grand Archive."

**The Core Loop:**

1. **Refleksi (Reflection):** The user writes in Indonesian, guided by an AI Muse (*Sang Pujangga*).
2. **Persembahan (Offering):** The depth of the user's thoughts is converted into resources (Marble & Light).
3. **Mahakarya (Masterpiece):** These resources are used to slowly "sculpt" or "reveal" a classical piece of art (e.g., a statue appearing from stone, or a Renaissance painting being restored).

## 2. Target Audience (Indonesia Context)

* **Gen Z/Millennials:** Who are tired of "hustle culture" and crave "Healing" or mindfulness in a sophisticated way.
* **The "Sastra" Crowd:** Users who appreciate beautiful Indonesian language and aesthetics, but want something approachable, not pretentious.
* **Visual-First Users:** People who want their diary to look like a museum, not a spreadsheet.

## 3. User Flow (The "Ritual")

1. **Masuk (The Approach):** User logs in. The UI is minimal, dark mode, with classical typography.
2. **Renungan (Invocation):** User clicks "Mulai Menulis" (Start Writing).
3. **Sesi Tanya Jawab (The Dialectic):**
* **Turn 1:** **Sang Pujangga** (AI) asks a warm, thoughtful question in natural Indonesian.
    * *Example:* "Hari ini gimana? Ada yang lagi dipikirin?" (How's today? Anything on your mind?)


* **User Input:** User types their story in Indonesian.
* **Turn 2 (Pendalaman):** The AI gently digs deeper based on what the user shared.
    * *Example:* "Kesepian ya? Itu yang 'nggak ada orang' atau yang 'ada orang tapi tetep ngerasa sendirian'?" (Loneliness huh? The 'no one's around' kind or the 'people are here but I still feel alone' kind?)


* **Turn 3 (Konklusi):** User answers. The AI closes with a simple, genuine reflection.
    * *Example:* "Noted. Kadang sepi itu cara kita dengerin diri sendiri. Nggak harus langsung 'diperbaiki'."

4. **Penciptaan (Reward):**
* Golden light fills the screen.
* **Outcome:** In the user's "Galeri," a new detail is added to their current artwork (e.g., the wings of an angel become visible).

## 4. Functional Requirements (MVP)

### 4.1. The AI "Pujangga" Engine (Localization Spec)

* **Persona:** *Sang Pujangga* (The Poet). A wise, timeless figure.
* **Language Model Config:**
    * **Strict Indonesian:** The AI must **never** output English unless explicitly asked to translate.
    * **Tone:** *Santai tapi bermakna* (Casual but meaningful). Think of a wise friend who's easy to talk to - warm, thoughtful, but not preachy. It should avoid:
      * **Overly formal/poetic language** - no "Di tengah riuh rendah dunia" vibes
      * **Gen-Z slang** - no "kuy," "goks," "jujurly," "slay"
      * **Corporate speak** - no "mari kita explore journey-mu"
    * **The sweet spot:** Natural Indonesian like you'd text a close friend who happens to be wise. Conversational, genuine, sometimes playful.


* **Logic:**
* Detects key emotional keywords (*Kelelahan*, *Harapan*, *Cinta*, *Ambisi*).
* Matches keywords to classical philosophical quotes translated into Indonesian.



### 4.2. Gamification & Progression (The "Galeri")

* **Visual Style:**
* **Typography:** Elegant Serifs (e.g., *Cinzel* for headers, *Lora* or *Merriweather* for body text).
* **UI Labels:** Minimalist Indonesian.
* *Home*  **Beranda**
* *Log*  **Arsip**
* *Stats*  **Jejak**




* **Resource System:**
* **Tinta Emas (Golden Ink):** Earned by word count. Used to increase the "clarity" of the generated artwork.
* **Marmer (Marble):** Earned by daily streaks. Used to unlock new "Canvases" (new statues/paintings to reveal).



### 4.3. Risalah Mingguan (Weekly Review)

* **Trigger:** Sunday (Minggu).
* **Function:** AI summarizes the week's emotional arc.
* **Output:** A "Surat Masa Lalu" (Letter from the Past).
    * *Example:* "Minggu ini kamu banyak mikirin masa depan ya. Wajar sih, tapi jangan lupa napas dulu..."



## 5. Technical Requirements

### 5.1. Backend
* **Framework:** Go with Echo web framework
* **Database:** PostgreSQL
* **ORM/Query:** SQLC for type-safe database queries
* **Authentication:** Clerk JWT validation
* **Architecture:** Layered (handlers → services → db)

### 5.2. Frontend
* **Framework:** React 19 with TypeScript
* **Routing:** TanStack Router (file-based routing)
* **State Management:** TanStack Query for server state
* **Styling:** Tailwind CSS
* **Animation:** Framer Motion (critical for the "ethereal" feel)
* **Authentication:** Clerk

### 5.3. Localization & AI
* **Localization (i18n):** Hardcoded to **id-ID** (Indonesian) for MVP to ensure the vibe is consistent.
* **AI Integration:**
    * System Prompt must explicitly state: `You are Sang Pujangga - a thoughtful friend who's easy to talk to. Speak in natural, conversational Indonesian. Be warm and genuine, not preachy or poetic. Ask questions like a curious friend, not a philosopher. Keep it real.`



## 6. Future Roadmap

| Phase | Feature | Description |
| --- | --- | --- |
| **V1.5** | **Pena Klasik** | Custom fonts that look like handwriting (Script styles). |
| **V2.0** | **Perpustakaan** | Unlock quotes from Indonesian legends (Chairil Anwar, Kartini) alongside Greek philosophers. |
| **V2.5** | **Mode Hening** | "Silent Mode" with lo-fi classical music or rain sounds (*suara hujan*) for focus. |

---

## 7. Next Steps for You

With the language locked to Indonesian and the name set to "Catetin," the System Prompt becomes the most critical technical piece.

**Would you like me to:**

1. **Draft the "Sang Pujangga" System Prompt:** I will write the actual prompt you feed to OpenAI/Gemini to ensure it speaks perfect, poetic Indonesian.
2. **Design the Database Schema:** Define how we store the "Art Progression" (0% to 100% revealed) alongside the text entries.
3. **Create a UI Component Spec:** Describe exactly how the "Renaissance Card" looks using Tailwind classes (colors, shadows, fonts).
