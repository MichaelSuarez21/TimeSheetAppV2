# TimeSheet App

A modern, user-friendly timesheet management application built with Next.js and Supabase. Track working hours across projects, generate reports, and manage your team's time effortlessly.

## Features

- 📊 **Dashboard Overview**: See your logged hours, recent entries, and active projects at a glance
- 🕒 **Time Tracking**: Log hours against projects with date, hours, and notes
- 📋 **Project Management**: Create and manage projects to organize your work
- 📈 **Reports**: Generate reports by time period and export as PDF or CSV
- 👥 **Multi-User Support**: Works for teams of any size
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🔒 **User Authentication**: Secure login with email and password

## Screenshots

*(Insert screenshots here)*

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database + Auth)
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Hooks
- **Deployment**: Vercel, Netlify, or self-hosted

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/timesheet-app.git
   cd timesheet-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables by creating a `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Set up the Supabase database:
   - Create a new Supabase project
   - Run the SQL scripts in the `schema` directory
   - For detailed instructions, see the [Database Setup README](./schema/README.md)

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

For detailed deployment instructions, please refer to the [Deployment Guide](./DEPLOYMENT.md).

## Project Structure

```
time-sheet-app/
├── app/                    # Next.js app directory
│   ├── dashboard/          # Dashboard and app pages
│   │   ├── page.tsx        # Main dashboard
│   │   ├── projects/       # Project management
│   │   ├── timesheet/      # Timesheet entries
│   │   └── reports/        # Reports generation
│   ├── api/                # API routes
│   └── (auth)/             # Authentication pages
├── components/             # Reusable components
│   ├── ui/                 # UI components (from shadcn/ui)
│   ├── layout/             # Layout components
│   ├── projects/           # Project-related components
│   └── timesheet/          # Time entry components
├── lib/                    # Utility libraries
│   └── supabase/           # Supabase client
├── schema/                 # Database schema and SQL scripts
├── public/                 # Static assets
└── types/                  # TypeScript type definitions
```

## Usage Guide

### Adding Time Entries

1. Navigate to **Dashboard** and click on "New Time Entry"
2. Select a project, enter the number of hours, select a date, and optionally add notes
3. Click "Create Time Entry" to save

### Creating Projects

1. Go to the **Projects** tab and click "New Project"
2. Enter a project name and optional description
3. Click "Create Project" to save

### Generating Reports

1. Go to the **Reports** tab
2. Select a date range and grouping option
3. View the report or export it as PDF/CSV

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any problems or have any questions, please open an issue on the GitHub repository.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
