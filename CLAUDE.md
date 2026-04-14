# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Development
- **Start dev server**: `npm run dev` — Runs Vite dev server with hot reload on http://localhost:5173
- **Build for production**: `npm run build` — Creates optimized build in `/dist`
- **Preview production build**: `npm run preview` — Serves the built app locally
- **Lint code**: `npm run lint` — Runs ESLint on all JS/JSX files, checks for react-hooks violations

### Environment Setup
- Create `.env.local` file in project root with:
  ```
  VITE_SUPABASE_URL=your_supabase_project_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```
- Run SQL schema from `supabase_schema.sql` in Supabase SQL editor to set up database

---

## Architecture

### High-Level Structure

**App Flow:**
1. `App.jsx` — Root component. Checks Supabase config (SetupScreen if missing), then wraps with ToastProvider → AuthProvider
2. `AuthContext` — Manages user session, profile data, sign up/in/out. Real-time auth state via `onAuthStateChange`
3. Logged-in users see `Dashboard.jsx`, unauthenticated users see Login/Register

**Authentication Design:**
- Email constructed as `{studentId}@cvsu.ojt` internally (email hidden from UI)
- User metadata stored in Supabase auth `user.user_metadata` during signup
- Profile data fetched from `profiles` table and cached in context
- Dark mode preference persisted to localStorage

### Key Components

**Dashboard** (`src/components/dashboard/Dashboard.jsx`)
- Main container after login. Displays student info card, print DTR settings (editable, persisted to localStorage), Clock, TimeInOut, DTRTable
- GSAP animations on entry (header slides down, cards fade in with stagger)
- Dark mode toggle with rotating animation

**DTRTable** (`src/components/dashboard/DTRTable.jsx`)
- Fetches attendance records from Supabase `attendance` table in real-time
- Calculates rendered hours: `(time_out_hours - time_in_hours) - 1 hour lunch break`
- Filters working days (excludes weekends + Philippine holidays + marked absences)
- Progress calculation: `rendered_hours / total_required_hours * 100`
- Inline editing/deletion of records
- Prints DTR with `printDTR()` function (passes supervisor, academic year, semester)

**TimeInOut** (`src/components/dashboard/TimeInOut.jsx`)
- Toggle between time-in and time-out
- Records to Supabase `attendance` table
- Prevents recording when already clocked in (for time_in) or not clocked in (for time_out)

**Clock** (`src/components/dashboard/Clock.jsx`)
- Real-time digital clock display
- Updates every second, formatted as HH:MM:SS AM/PM

**Calendar** (`src/components/dashboard/Calendar.jsx`)
- Component for displaying and selecting attendance dates
- Integrates with TimeInOut and DTRTable for date-based record management

**Contexts:**
- `AuthContext` — Session state, profile, auth methods. Provides `useAuth()` hook
- `ToastContext` — Toast notifications (success/error/info). Provides `useToast()` hook with `showToast(type, text, duration)`

### Component Organization

```
src/
├── components/
│   ├── auth/
│   │   ├── Login.jsx          — Student ID + password form
│   │   └── Register.jsx       — New student signup form
│   ├── dashboard/
│   │   ├── Dashboard.jsx      — Main layout after login
│   │   ├── DTRTable.jsx       — Attendance records table
│   │   ├── TimeInOut.jsx      — Clock in/out buttons
│   │   ├── Clock.jsx          — Real-time clock display
│   │   └── PrintDTR.js        — Print formatting logic
│   ├── Counter.jsx            — Display animated counter (used in DTRTable)
│   └── SplitText.jsx          — Text split animation component
├── context/
│   ├── AuthContext.jsx        — User auth state & methods
│   └── ToastContext.jsx       — Toast notification system
├── lib/
│   ├── supabase.js            — Supabase client (created from env vars)
│   └── useDarkMode.js         — Dark mode hook (reads/writes localStorage & document.documentElement class)
├── App.jsx                    — Root component
├── main.jsx                   — Entry point
├── App.css                    — Global styles
└── index.css                  — Root styles (imports Tailwind)
```

### Data Flow

**Attendance Records:**
- Structure: `{ id, user_id, date (ISO), time_in (HH:MM), time_out (HH:MM), is_absent (boolean) }`
- Real-time fetch in DTRTable via `supabase.from('attendance').on('*').subscribe()`
- CRUD operations: Create (TimeInOut), Read (DTRTable on load), Update (DTRTable edit), Delete (DTRTable delete)

**User Profile:**
- Stored in `profiles` table, fetched after login via `AuthContext.fetchProfile()`
- Fields: `id, full_name, student_id, program, course_code, total_required_hours`

**UI State Persistence:**
- Dark mode: localStorage key `theme` ('light' or 'dark'), synced to `document.documentElement.classList`
- Print settings: localStorage keys `dtr_supervisor`, `dtr_ay`, `dtr_semester`

### Styling & Theme

- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **Colors:** Green (#059669, #047857, etc.) is primary; used in headers, buttons, text accents
- **Icons:** lucide-react is used throughout for UI icons
- **Dark mode:** Class-based via `dark:` prefix (applied to `<html>` element)
- **Components:** Rounded corners (lg/xl), shadows for depth, responsive grid layouts

### Utility Functions

**In DTRTable:**
- `formatTime(t)` — Converts "HH:MM" to "H:MM AM/PM"
- `formatDate(d)` — Converts ISO date to "Mon Day" format
- `calcHours(timeIn, timeOut)` — Returns rendered hours (deducts 1hr lunch break, returns null if ≤0)
- `toISODateLocal(date)` — Converts JS Date to "YYYY-MM-DD" string
- `getPhilippineHolidaySet(year)` — Returns Set of Philippine holiday dates (fixed + special by year)
- `isWorkingDayInPH(date)` — Returns false for weekends + holidays

---

## Linting Rules

ESLint config in `eslint.config.js` enforces:
- React Hooks rules (dependencies, exhaustive-deps, etc.)
- React Refresh rules
- No unused variables (unless they start with uppercase, e.g., `_Component` or `_CONSTANT`)
- Latest ECMAScript syntax

Run `npm run lint` before committing. Most issues can be auto-fixed (though auto-fix may not resolve all).

---

## Development Notes

- **No test framework** — Manual testing or add Jest/Vitest if needed
- **Supabase client** — Initialized in `src/lib/supabase.js`, used throughout via the `supabase` export
- **Environment variables** — Loaded via Vite's `import.meta.env` (prefixed with `VITE_`)
- **GSAP animations** — Used sparingly (Dashboard entry, dark mode toggle) via `@gsap/react` hook
- **Motion library** — Used for component animations and transitions alongside GSAP
- **Real-time subscriptions** — Used in DTRTable to listen for attendance changes; clean up with `.unsubscribe()`

---

## Common Workflows

**Add a new attendance record:**
1. Call `supabase.from('attendance').insert(record)` in TimeInOut or similar component
2. DTRTable will auto-update via real-time subscription
3. Show toast notification via `useToast().showToast()`

**Modify print DTR settings:**
1. Edit inputs in Dashboard.jsx settings card
2. Save writes to localStorage and updates parent state
3. Pass to DTRTable as props (`supervisor`, `academicYear`, `semester`)

**Add dark mode styling to a component:**
1. Use Tailwind's `dark:` prefix: `className="bg-white dark:bg-gray-800"`
2. Respects the `useDarkMode()` hook which syncs to localStorage and HTML element

**Debug Supabase issues:**
1. Check `.env.local` has valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Verify SQL schema was run in Supabase SQL editor (tables: `auth.users`, `profiles`, `attendance`)
3. Supabase client is configured in `src/lib/supabase.js`; isConfigured check happens in App.jsx
