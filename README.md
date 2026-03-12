# OJT Daily Time Record System

A web-based Daily Time Record (DTR) system for On-the-Job Training (OJT) students of **Cavite State University – Imus Campus**. Students can log their time in/out, track rendered hours, and generate a printable DTR form.

---

## Features

- **Student Authentication** — Register and log in using your Student ID
- **Time In / Time Out** — Clock in and out with automatic hours computation
- **DTR Table** — View all attendance records with rendered hours and progress tracking
- **Absent Marking** — Mark days as absent (excluded from printed DTR)
- **Printable DTR** — Generate a formatted, print-ready Daily Time Record with university header, logos, and supervisor attestation
- **Dark Mode** — Toggle between light and dark themes
- **Configurable Print Settings** — Set supervisor name, academic year, and semester (persisted in localStorage)
- **Animated UI** — Smooth entrance animations powered by GSAP

---

## Tech Stack

| Layer              | Technology                                                           |
| ------------------ | -------------------------------------------------------------------- |
| Frontend Framework | [React 19](https://react.dev/)                                       |
| Build Tool         | [Vite 7](https://vitejs.dev/)                                        |
| Styling            | [Tailwind CSS v4](https://tailwindcss.com/)                          |
| Backend / Database | [Supabase](https://supabase.com/) (PostgreSQL + Auth)                |
| Animations         | [GSAP 3](https://gsap.com/) + [@gsap/react](https://gsap.com/react/) |
| Motion             | [Motion (Framer Motion)](https://motion.dev/)                        |
| Icons              | [react-feather](https://github.com/feathericons/react-feather)       |
| Linting            | [ESLint 9](https://eslint.org/)                                      |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Supabase](https://supabase.com/) project (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/brandodt/ojt-dtr.git
cd ojt-dtr

# 2. Install dependencies
npm install

# 3. Configure environment variables
#    Create a .env file in the project root:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 4. Set up the database
#    Run the SQL schema found in supabase_schema.sql
#    in your Supabase SQL editor.

# 5. Start the development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## Environment Variables

| Variable                 | Description                            |
| ------------------------ | -------------------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL              |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key |

---

## License

For academic and institutional use only — Cavite State University Imus Campus OJT Program.
