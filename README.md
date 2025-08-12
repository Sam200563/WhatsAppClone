# WhatsApp Clone

A simple **WhatsApp Web UI clone** built with **React**, styled with **Tailwind CSS**, and powered by a mock API for demonstration.  
It supports chat listing, message view, date separators, emoji picker, and a mobile-friendly layout.

---

## 🚀 Live Demo

- **Frontend (React + Vite)**: [https://your-frontend.netlify.app](https://whats-app-cloneweb.netlify.app/)
- **Backend (Node + Express)**: [https://your-backend.onrender.com](https://whatsappclone-d6xj.onrender.com)
  
---

## 🚀 Features

- **Sidebar Chat List** – Displays contacts sorted by latest message.
- **Search Contacts** – Search and filter chats instantly.
- **Chat View** – Shows messages with proper alignment.
- **Date Separators** – Displays "Today", "Yesterday", or date.
- **Message Status** – Sent, Delivered, Read indicators.
- **Emoji Picker** – Add emojis to messages.
- **Responsive Design** – Mobile & Desktop friendly.
- **Static Last Seen** – Placeholder for user presence.
- **Patterned Chat Background** – Similar to WhatsApp.

---

## 🛠️ Tech Stack

- **React** – UI framework.
- **Tailwind CSS** – Styling.
- **lucide-react** – Icons.
- **emoji-picker-react** – Emoji picker component.

---

## 📦 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/yourusername/whatsapp-clone.git
cd whatsapp-clone
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Start the development server
```bash
npm run dev
```

### 4️⃣ Build for production
```bash
npm run build
```

---

## 📁 Project Structure

```
src/
│── api.js           # Mock API for fetching conversations/messages
│── App.jsx          # Main application
│── index.css        # Tailwind styles
│── main.jsx         # Entry point
│── whatsapp-bg.jpg  # Chat background
```

---

## 📱 Mobile View

- Mobile layout automatically hides the sidebar and shows only active chat.
- Back button allows switching between chats and messages.

---

## 🎯 Deployment

This project can be deployed to  **Netlify** or any static hosting.

Example:
```bash
npm run build
Netlify deploy
```

---
