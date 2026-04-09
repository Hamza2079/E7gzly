# E7gzly — Appointment Booking System

> A modern medical appointment booking platform built with Next.js, Supabase, and TailwindCSS.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | TailwindCSS 4 |
| **UI Library** | shadcn/ui *(planned)* |
| **Backend** | Supabase (Auth, Database, Storage, Realtime) |
| **Database** | PostgreSQL |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |
| **Dates** | date-fns |
| **Deployment** | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A [Supabase](https://supabase.com) project

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd e7gzly

# Install dependencies
npm install

# Install additional packages
npm install @supabase/supabase-js react-hook-form zod @hookform/resolvers lucide-react date-fns clsx tailwind-merge

# Copy environment variables
cp .env.example .env.local
# → Fill in your Supabase URL, anon key, and service role key

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
e7gzly/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── (auth)/                   # Auth route group (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── doctors/                  # Provider listing & profiles
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── booking/page.tsx          # Appointment booking flow
│   ├── dashboard/                # Patient/Provider dashboard
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── admin/page.tsx            # Admin dashboard
├── components/                   # Reusable React components
│   ├── layout/                   # Navbar, Footer, Sidebar
│   ├── providers/                # DoctorCard, ProviderFilters
│   ├── booking/                  # BookingCalendar, TimeSlotGrid
│   ├── appointments/             # AppointmentCard
│   └── dashboard/                # StatsCard
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── useProviders.ts
│   ├── useAppointments.ts
│   └── useAvailability.ts
├── lib/                          # Core libraries
│   ├── supabase/                 # Supabase client (client + server)
│   ├── utils.ts                  # cn() class merge utility
│   └── validations/              # Zod schemas
├── services/                     # API service functions
│   ├── authService.ts
│   ├── providerService.ts
│   ├── appointmentService.ts
│   └── notificationService.ts
├── types/                        # TypeScript type definitions
│   ├── database.types.ts         # Supabase-generated DB types
│   ├── index.ts                  # Domain types
│   └── api.types.ts              # API response types
├── utils/                        # Pure utility functions
│   ├── formatDate.ts
│   ├── formatCurrency.ts
│   └── constants.ts
├── middleware.ts                  # Route protection middleware
├── .env.example                  # Environment variable template
└── package.json
```

## Key Features

- 🔍 **Doctor Discovery** — Search & filter by specialty, city, rating, price
- 📅 **Booking Calendar** — Interactive date & time slot selection
- 👤 **Role-Based Dashboards** — Patient, Provider, and Admin views
- 🔐 **Authentication** — Email/password & Google OAuth via Supabase Auth
- 📊 **Admin Panel** — User management, provider verification, analytics
- 🔔 **Notifications** — In-app notification system
- 📱 **Responsive** — Mobile-first responsive design

## Development

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | Application URL (`http://localhost:3000` for dev) |

## License

Private — All rights reserved.
