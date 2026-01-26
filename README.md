# EBDV 2026 - Educational Management System

A comprehensive Next.js application for student management, jury evaluation, and real-time monitoring for EBDV 2026 educational event.

## 🚀 Features

- 🎯 **Student Inscription Management** - Real-time student registration monitoring
- 👥 **Multi-Role Staff Authentication** - Personal credentials + general access
- 🏛️ **Jury Evaluation System** - Classroom-based scoring with results
- 📊 **Live Dashboard** - Search, filter, and real-time updates
- 🔄 **Real-time Sync** - Supabase-powered live data synchronization
- 📱 **Mobile Responsive** - Works seamlessly on all devices

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + Shadcn/ui
- **Real-time**: Supabase subscriptions
- **Authentication**: Custom credential system

## 📋 Access Credentials

### Staff Access
- **Personal**: Use DNI + password combination
- **General**: Password `ebdv2026`

### Jury Members
- **Ana Maria Sanchez** - DNI: `12345678`
- **Carlos Rodriguez** - DNI: `87654321`
- **Margarita Lopez** - DNI: `11223344`

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## 🌐 Deployment

### Vercel Deployment

1. **Environment Variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Build Settings**:
   - Framework Preset: Next.js
   - Root Directory: (root)
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
   - Output Directory: `.next`

3. Reference the `VERCEL_DEPLOY.md` file for complete setup instructions.

## 📁 Project Structure

```
├── app/                    # Next.js app router
│   ├── staff/             # Staff management pages
│   │   ├── admin/         # Admin dashboard
│   │   ├── jurados/       # Jury evaluation
│   │   └── maestros/      # Teacher access
│   ├── classrooms/        # Public classroom view
│   └── inscribir/         # Student registration
├── lib/                   # Utility functions
├── components/            # Reusable components
└── hooks/                 # Custom React hooks
```

## 🔄 Real-time Features

- **Live Student Updates**: Automatic data refresh without page reload
- **Instant Score Updates**: Jury scores appear immediately
- **Status Tracking**: Real-time attendance and validation status

## 📊 Key Pages

### `/staff/admin/inscripciones`
- Real-time student monitoring
- Search by name, parent, phone
- Filter by date and classroom
- Inline editing capabilities

### `/staff/jurados/[juradoId]/[salon]/evaluar`
- Jury evaluation interface
- Student scoring system
- Real-time result calculation

### `/staff/admin`
- Staff dashboard with statistics
- Quick access to all management tools

## 🧪 Testing

The application includes environment validation:
```bash
npm run build  # Validates all components and types
```

## 📈 Performance

- ✅ **Optimized Build**: 4s compilation time
- ✅ **54 Static Pages**: Pre-rendered for instant loading
- ✅ **TypeScript**: Full type safety
- ✅ **Responsive**: Mobile-first design

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Test with `npm run build` before committing
4. Update documentation as needed

## 📝 License

This project is part of EBDV 2026 educational initiative.