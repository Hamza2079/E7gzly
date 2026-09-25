# E7gzly (إحجزلي) — Smart Clinic Reservation & Queue Management Ecosystem

> **E7gzly** is a high-performance, real-time healthcare platform designed to bridge the gap between medical providers and patients. By digitizing the waiting room experience through "Virtual Queuing," E7gzly eliminates physical wait times, optimizes clinic workflows, and provides patients with a seamless journey from discovery to consultation.

---

## 🌟 The Vision

In many emerging markets, the healthcare experience is often hindered by inefficient scheduling and unpredictable waiting times. **E7gzly** (meaning "Reserve for me" in Arabic) was built with a clear mission: **to modernize the clinical workflow through a unified, mobile-first digital ecosystem.**

Our approach focuses on three core pillars:
1.  **Transparency**: Real-time queue tracking so patients know exactly when to arrive.
2.  **Efficiency**: Automated tools for doctors to manage patient flow with a single click.
3.  **Connectivity**: A digital bridge that maintains patient history, reviews, and favorites in one place.

---

## 🛠️ Tech Stack & Architecture

E7gzly is built using a modern "Server-First" architecture to ensure maximum security, SEO performance, and speed.

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15+ (App Router)** | Leverages React Server Components (RSC) for zero-bundle-size data fetching and instant page loads. |
| **Language** | **TypeScript** | Ensures end-to-end type safety between the database schema and the UI. |
| **Backend/DB** | **Supabase (PostgreSQL)** | Provides a robust relational foundation with built-in Auth, Realtime subscriptions, and Storage. |
| **Security** | **PostgreSQL RLS** | Row-Level Security ensures data isolation at the database level—essential for HIPAA-compliant medical data. |
| **Styling** | **Tailwind CSS 4** | Rapid UI development with a focus on modern, mobile-responsive design systems. |
| **UI Components** | **Shadcn UI + Lucide** | Accessible, consistent, and premium-feeling UI components. |
| **State Mgmt** | **Server Actions** | Simplified data mutations with native revalidation, reducing reliance on complex client-side state. |

---

## 🚀 Key Features

### 1. The Patient Experience
*   **Smart Discovery**: Filter doctors by specialty, city, price, or rating.
*   **Virtual Queuing**: Join a clinic's queue remotely and receive live updates on your position.
*   **Personal Health Ledger**: Access a history of past visits and medical feedback.
*   **Arabic Localization**: Full RTL (Right-to-Left) support for a native experience in the MENA region.

### 2. The Provider Command Center
*   **Real-time Queue Control**: Manage the waiting room with "Next Patient," "Skip," and "Cancel" actions.
*   **Business Intelligence**: Automated reports on daily revenue and patient visitation metrics.
*   **Profile Management**: Comprehensive clinic settings, including consultation fees and schedules.
*   **Patient CRM**: View patient history and manage reviews directly from the dashboard.

### 3. System Governance
*   **Role-Based Access Control (RBAC)**: Distinct permissions for Patients, Providers, and Administrators.
*   **Middleware Gatekeeping**: A centralized security layer ensuring users only access authorized routes.

---

## 🏗️ Database Design & Patterns

E7gzly utilizes a highly normalized PostgreSQL schema designed for scalability:

*   **`users`**: Centralized identity management.
*   **`providers`**: Extended profiles for medical professionals.
*   **`queues` & `queue_entries`**: A relational model for managing time-sensitive clinic sessions and tickets.
*   **`reviews`**: A feedback loop integrated with specific consultation events.

### Engineering Patterns:
-   **Service-Oriented Mutations**: All business logic is encapsulated in Server Actions, ensuring consistency and reusability.
-   **Optimistic UI Updates**: Using React's `useOptimistic` hook for immediate feedback during queue actions.
-   **Security by Design**: Every database query is governed by RLS policies, meaning the frontend cannot "accidentally" fetch another user's data.

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase Project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/e7gzly.git
    cd e7gzly
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

---

## 🎓 CS Portfolio Highlights

For those reviewing this project for technical merit, E7gzly demonstrates proficiency in:
-   **Fullstack Type Safety**: Auto-generated TypeScript types from the database schema.
-   **Performance Optimization**: Achieving high Core Web Vitals by moving data fetching to the server.
-   **Scalable Security**: Implementing complex RBAC using PostgreSQL policies and Next.js middleware.
-   **Real-time Systems**: Handling concurrent queue entries and live updates using Supabase Realtime.

---

## 📄 License

Private — All rights reserved. Built with ❤️ for the future of healthcare.
