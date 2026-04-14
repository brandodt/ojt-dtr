# OJT Daily Time Record System

A web-based Daily Time Record (DTR) system for On-the-Job Training (OJT) students of **Cavite State University – Imus Campus**. Students can log their time in/out, track progress toward required hours, and generate a printable DTR form with supervisor attestation.

---

## Features

- **Student Authentication** — Secure login with Student ID and password
- **Time Clock** — Real-time digital clock display
- **Time In / Time Out** — Clock in and out with automatic hours computation
- **Attendance Tracking** — View all attendance records with rendered hours and progress visualization
- **Absence Marking** — Mark days as absent (excluded from DTR calculations and printing)
- **Smart Date Filtering** — Excludes weekends and Philippine holidays from working day calculations
- **Printable DTR Form** — Generate formatted Daily Time Record with university letterhead, logos, and supervisor attestation section
- **Print Settings** — Configure supervisor name, academic year, and semester (persisted locally)
- **Dark Mode** — Toggle between light and dark themes
- **Responsive Design** — Works on desktop and tablet devices
- **Smooth Animations** — GSAP-powered entrance animations and transitions

---

## Tech Stack

| Layer              | Technology                                                           |
| ------------------ | -------------------------------------------------------------------- |
| Frontend Framework | [React 19](https://react.dev/)                                       |
| Build Tool         | [Vite 7](https://vitejs.dev/)                                        |
| Styling            | [Tailwind CSS v4](https://tailwindcss.com/)                          |
| Backend / Database | [Supabase](https://supabase.com/) (PostgreSQL + Auth)                |
| Animations         | [GSAP 3](https://gsap.com/) + [@gsap/react](https://gsap.com/react/) |
| Motion             | [Motion](https://motion.dev/)                                        |
| Icons              | [lucide-react](https://lucide.dev/)                                  |
| Linting            | [ESLint 9](https://eslint.org/)                                      |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Supabase](https://supabase.com/) account (free tier works)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/brandodt/ojt-dtr.git
   cd ojt-dtr
   npm install
   ```

2. **Set up environment variables**
   
   Create a `.env.local` file in the project root:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   Get these values from your Supabase project dashboard: Settings → API → Project URL and anon key.

3. **Initialize the database**
   
   Run the SQL schema in your Supabase SQL editor:
   - Open Supabase Dashboard → SQL Editor
   - Create a new query and paste contents from `supabase_schema.sql`
   - Execute the query
   
   This creates the required tables: `profiles`, `attendance`, and sets up authentication.

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Available Commands

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start Vite dev server with hot reload        |
| `npm run build`   | Create optimized production build in `/dist` |
| `npm run preview` | Serve the production build locally            |
| `npm run lint`    | Run ESLint on all JavaScript/JSX files       |

---

## Project Structure

For detailed architecture, component descriptions, and development guidelines, see [CLAUDE.md](./CLAUDE.md).

**Key directories:**
- `src/components/` — React components (auth, dashboard, utilities)
- `src/context/` — React Context providers (auth, toast notifications)
- `src/lib/` — Supabase client and utility hooks
- `src/` — Entry point, main styles, global configuration

---

## Environment Variables

| Variable                 | Required | Description                                    |
| ------------------------ | -------- | ---------------------------------------------- |
| `VITE_SUPABASE_URL`      | Yes      | Your Supabase project URL                      |
| `VITE_SUPABASE_ANON_KEY` | Yes      | Your Supabase anonymous (public) API key       |

Both values are found in your Supabase project dashboard under Settings → API.

---

## Database Schema

The following tables are created when you run `supabase_schema.sql`:

**profiles**
- `id` — User ID (UUID)
- `full_name` — Student's full name
- `student_id` — University student ID
- `program` — Academic program (e.g., "BS Computer Engineering")
- `course_code` — Course code (e.g., "OJT")
- `total_required_hours` — Total OJT hours requirement

**attendance**
- `id` — Record ID (UUID)
- `user_id` — Reference to user
- `date` — ISO date (YYYY-MM-DD)
- `time_in` — Clock-in time (HH:MM format)
- `time_out` — Clock-out time (HH:MM format)
- `is_absent` — Boolean flag for absence

---

## Troubleshooting

**"Supabase configuration missing" message on load**
- Ensure `.env.local` exists with valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check that the values don't have quotes around them

**Database errors when creating records**
- Verify that `supabase_schema.sql` was executed in Supabase SQL editor
- Check that the `attendance` and `profiles` tables exist in Supabase (Dashboard → SQL Editor → Run the schema again)
- Ensure Row-Level Security (RLS) policies are in place (set up in `supabase_schema.sql`)

**Real-time updates not showing**
- Check browser console for errors (F12 → Console tab)
- Verify Supabase real-time subscriptions are enabled (Dashboard → Replication)
- Try refreshing the page

**Build or lint errors**
- Run `npm install` to ensure all dependencies are up-to-date
- Check `npm run lint` output for specific ESLint violations
- Most ESLint issues can auto-fix with `npm run lint -- --fix`

---

## License

For academic and institutional use only — **Cavite State University Imus Campus OJT Program**.
