
# 📸 Retro Photo Wall (AI-Powered)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

A nostalgic, interactive photo wall application that captures moments using a retro-styled camera interface. Powered by **Google Gemini AI**, it automatically generates witty, handwritten-style captions for every photo you take.

https://github.com/dangerwolf/Retro-Photo-Wall

https://hub.docker.com/r/dangerwolf/retro-photo-wall

## ✨ Features

- **📷 Retro Polaroid Camera**: Classic UI with realistic sound effects and animations.
- **🤖 AI Captions**: Uses Google Gemini (Flash model) to analyze photos and generate context-aware, short captions.
- **🧱 Interactive Wall**: Draggable photos that can be rearranged freely.
- **💾 Auto-Persistence**: Photos, positions, and captions are automatically saved to a local SQLite database.
- **🛡️ IP Logging**: Tracks the source IP address of each uploaded photo for security auditing.

---

## 🚀 Docker Deployment (Recommended)

The easiest way to run this application is using Docker. This ensures a consistent environment and easy data management.

### 1. Build the Image

```bash
docker build -t retro-photo-wall .
```

### 2. Run the Container

Use the following command to start the server.

**Important**: We map a local volume (`./my_data`) to ensure your photos database persists even if the container is deleted.

```bash
docker run -d \
  --name retro-wall \
  -p 3000:3000 \
  -v $(pwd)/my_data:/app/data \
  -e API_KEY="YOUR_GOOGLE_GEMINI_API_KEY" \
  retro-photo-wall
```

- Access the app at: `http://localhost:3000`
- Your database (`photos.db`) will appear in the `my_data` folder on your host machine.

---

## ⚠️ Critical: Camera Access & HTTPS

**Please Read Carefully**: Modern browsers (Safari, Chrome, Edge) **BLOCK** camera access on insecure connections (http://) unless you are on `localhost`.

- ✅ **Works**: `http://localhost:3000`
- ✅ **Works**: `http://127.0.0.1:3000`
- ✅ **Works**: `https://your-domain.com`
- ❌ **BLOCKED**: `http://192.168.1.x:3000` (Local Network IP)
- ❌ **BLOCKED**: `http://1.2.3.4:3000` (Public IP)

### How to access from another device (e.g., Mobile Phone)?

Since you cannot use the raw IP address to open the camera, use one of these workarounds:

#### Option A: SSH Tunnel (Quick Test)
Map the remote server's port to your local machine. Run this on your laptop:
```bash
# Replace with your actual server user and IP
ssh -L 3000:127.0.0.1:3000 user@your-server-ip
```
Then open `http://localhost:3000` in your browser.

#### Option B: Cloudflare Tunnel (Public Access)
Expose your local port securely via HTTPS (Free & Secure):
```bash
cloudflared tunnel --url http://localhost:3000
```

---

## 🔧 Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEY` | **Required** | Your Google Gemini API Key (Get one from AI Studio). |
| `PORT` | `3000` | The port the server listens on. |
| `DATA_DIR` | `/app/data` | Directory where `photos.db` is stored. |

---

## 🛠️ Local Development

If you want to modify the code:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set up Environment**:
   Create a `.env` file in the root directory:
   ```env
   API_KEY=your_api_key_here
   ```

3. **Build & Run**:
   Since the app relies on the backend to inject the API Key, it's best to run the full build:
   ```bash
   # Build frontend and start backend server
   npm run build
   npm start
   ```
   Then visit `http://localhost:3000`.

---

## 🏗 Tech Stack

- **Frontend**: React, TypeScript, Vite, Framer Motion (animations).
- **Backend**: Node.js, Express.
- **Database**: Better-SQLite3 (Server-less, high performance).
- **AI**: Google Generative AI SDK (`@google/generative-ai`).

---

Made with ❤️ by WOLF




----


<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1FeNvt9UcTQpiDvmjX0teEC6tRhUecGp4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
