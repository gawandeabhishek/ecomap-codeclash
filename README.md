# EcoMap

**Offline-First Navigation for Everyone**

EcoMap is a modern, hackathon-ready navigation app that works seamlessly online and offline. Built with Next.js, Prisma, Clerk, and Neon.tech, it offers both free and premium plans, advanced offline caching, and a beautiful, responsive UI.

---

## 🚀 Features

- **Offline-First Navigation:** Explore, search, and navigate even without internet.
- **Vector Tiles:** Fast, modern maps using open/free sources.
- **Premium Model:**
  - Free: Basic offline, 3 saved locations, standard navigation.
  - Premium: Full offline caching, unlimited locations, voice navigation, and more.
- **Service Worker:** Caches map tiles and routes for offline use (premium users get full caching).
- **Clerk Authentication:** Secure sign-in/sign-up with social login support.
- **Razorpay Integration:** Secure payments and subscription management.
- **Modern UI:** Built with Tailwind CSS, shadcn/ui, and framer-motion.
- **Responsive & PWA Ready:** Works great on mobile and desktop.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui, framer-motion
- **Backend:** Prisma ORM, Neon.tech (Postgres)
- **Auth:** Clerk
- **Payments:** Razorpay
- **Offline:** Service Worker, localStorage

---

## ⚡ Quick Start (for Judges)

1. **Clone the repo:**
   ```bash
   git clone https://github.com/yourusername/ecomap-codeclash.git
   cd ecomap-codeclash
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Set up environment variables:**
   - Copy `.env.example` to `.env.local` and fill in:
     - `DATABASE_URL` (Neon.tech Postgres)
     - `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
     - `NEXT_PUBLIC_MAPTILER_API_KEY`
4. **Run the app locally:**
   ```bash
   npm run dev
   ```
5. **Try it out:**
   - Sign up, explore navigation, try offline mode, and test premium features!

---

## 🧩 Environment Variables

| Name                                | Description                   |
| ----------------------------------- | ----------------------------- |
| `DATABASE_URL`                      | Neon.tech Postgres connection |
| `CLERK_PUBLISHABLE_KEY`             | Clerk frontend key            |
| `CLERK_SECRET_KEY`                  | Clerk backend key             |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key (public)   |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID`       | Razorpay public key           |
| `NEXT_PUBLIC_MAPTILER_API_KEY`      | MapTiler public key           |

---

## 🌐 Deployment

- **Vercel:** One-click deploy, just set environment variables in the dashboard.
- **Production Ready:** Domain whitelisting for Clerk and Razorpay required.

---

## 🤝 Contributing

- Fork the repo and create a feature branch.
- Open a PR with a clear description.
- For hackathon: focus on UX, offline, and premium logic!

---

## 📣 Credits

- Built by EcoCoding for CodeClash 2.0.
- Powered by open-source and the amazing dev community!

---

## 📝 License

MIT
