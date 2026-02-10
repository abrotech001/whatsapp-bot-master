# WHATMEBOT - WhatsApp Instance Management Platform

A modern, full-featured WhatsApp instance management system with Supabase backend, Stripe/Paystack payments, and real-time instance pairing.

## Features

- **Multi-Instance Management**: Create and manage multiple WhatsApp instances from a single dashboard
- **Instant Pairing**: Quick QR code-based pairing system for WhatsApp numbers
- **Payment Integration**: Flexible pricing tiers with Stripe/Paystack integration
- **Admin Dashboard**: Full admin panel for user and instance management
- **Real-time Monitoring**: Track instance status, transactions, and user activity
- **User Profiles**: Secure profile management with password change functionality
- **Authentication**: Supabase Auth with email verification
- **Type Safety**: Full TypeScript implementation with proper error handling

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Functions)
- **Payments**: Paystack/Stripe integration
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Data**: TanStack Query (React Query)

## Project Structure

```
src/
├── pages/           # Route pages (Index, Dashboard, Admin, Profile, etc.)
├── components/      # Reusable UI components
│   ├── ui/         # shadcn/ui components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ErrorBoundary.tsx
├── integrations/
│   └── supabase/   # Supabase client and types
├── hooks/          # Custom React hooks
├── assets/         # Images and static files
└── App.tsx         # Main app with routing
```

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_key
```

## Getting Started

```sh
# Install dependencies
npm i

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Core Pages & Routes

- `/` - Landing page with features and CTAs
- `/login` - User authentication
- `/signup` - New account registration with OTP verification
- `/dashboard` - Main user dashboard for instance management
- `/pricing` - Pricing plans and payment initiation
- `/profile` - User profile settings and security options
- `/admin` - Admin dashboard (requires admin role)
- `/payment-callback` - Payment verification endpoint
- `/404` - 404 error page

## Key Components

### Dashboard
- Instance management with pairing and deletion
- Transaction history
- Plan information
- Admin capabilities for admin users

### Admin Panel
- User management
- Instance monitoring
- Transaction tracking
- Email broadcast system

### Error Handling
- Global ErrorBoundary for app-level error handling
- Try-catch blocks with proper error messages
- User-friendly error toasts

## Code Quality

- **Type Safety**: Full TypeScript with proper interfaces
- **Error Handling**: Comprehensive error handling and validation
- **Performance**: Code splitting and optimized builds
- **Responsive**: Mobile-first design with responsive layouts
- **Accessibility**: Semantic HTML and ARIA attributes

## How can I deploy this project?

Simply open [v0](https://v0.dev) and publish your project. Alternatively:

```sh
npm run build
# Deploy the dist/ folder to your hosting service
```

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
