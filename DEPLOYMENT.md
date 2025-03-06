# TimeSheet App Deployment Guide

This guide will walk you through the process of deploying the TimeSheet app for production use within your company, including setting up the necessary infrastructure, configuring the database, and setting up user authentication.

## Prerequisites

- A Supabase account (for database and authentication)
- A deployment platform (Vercel, Netlify, etc.)
- Node.js and npm installed locally

## Step 1: Prepare Your Supabase Project

### 1.1 Setup Supabase Tables and Permissions

1. Log in to your [Supabase Dashboard](https://app.supabase.io/)
2. Open your project (or create a new one)
3. Go to the SQL Editor and execute the following SQL scripts in order:
   - Run `schema/open_permissions.sql` to configure Row Level Security (RLS)
   - Run `schema/migrate_users.sql` to set up the users table and user sync

### 1.2 Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Configure the following settings:
   - Under **Site URL**, enter your production URL (e.g., `https://timesheet.yourcompany.com`)
   - Under **Redirect URLs**, add your production URL + `/api/auth/callback` (e.g., `https://timesheet.yourcompany.com/api/auth/callback`)
3. Go to **Authentication** → **Providers**
   - Enable Email provider (and any other providers you want to use)
   - If using email, configure email templates under **Email Templates**

### 1.3 Get Your API Keys

1. Go to **Settings** → **API**
2. Take note of your **Project URL** and **anon public** API key
   - You'll need these for your environment variables

## Step 2: Set Up Environment Variables

Create a `.env.production` file in your project root with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Replace the values with your actual Supabase project URL and anon key.

## Step 3: Build the Application for Production

Run the following commands in your project directory:

```bash
# Install dependencies
npm install

# Build the production version
npm run build
```

This will create an optimized build of your application in the `.next` directory.

## Step 4: Deploy to Hosting Platform

### Option 1: Deploy to Vercel (Recommended)

Vercel is the easiest platform for deploying Next.js applications:

1. Create an account at [Vercel](https://vercel.com)
2. Install the Vercel CLI: `npm install -g vercel`
3. Run `vercel` in your project directory and follow the prompts
4. Set your environment variables in the Vercel dashboard

Alternatively, you can connect your GitHub repository to Vercel for automatic deployments.

### Option 2: Deploy to Netlify

1. Create an account at [Netlify](https://www.netlify.com/)
2. Run `npm run build` locally
3. Drag and drop the `.next` directory to Netlify, or set up GitHub integration
4. Configure the environment variables in the Netlify dashboard

### Option 3: Self-Hosting

If you prefer to host the application on your own server:

1. Install Node.js on your server
2. Transfer your project files
3. Run the following commands:
   ```bash
   npm install
   npm run build
   npm run start
   ```
4. Use a process manager like PM2 to keep the application running

## Step 5: User Management

### 5.1 Setting Up the First Admin User

1. After deploying, visit your application URL
2. Sign up using the normal sign-up process
3. In your Supabase dashboard, go to **Authentication** → **Users**
4. Verify that your user is created

### 5.2 Inviting Company Users

There are two ways to invite users to your TimeSheet app:

**Option 1: Self-registration**
- Share your application URL with employees
- They can sign up themselves

**Option 2: Admin-created accounts**
1. In your Supabase dashboard, go to **Authentication** → **Users**
2. Click "Invite user" and enter their email
3. The user will receive an email with instructions to set their password

## Step 6: Company-Specific Customization

To customize the TimeSheet app for your company:

1. Update the branding by editing the following files:
   - `app/layout.tsx` - Change the app title
   - `public/logo.svg` - Replace with your company logo
   - `app/globals.css` - Customize the color scheme

2. Configure email templates in Supabase:
   - Go to **Authentication** → **Email Templates**
   - Customize the templates with your company name and branding

## Troubleshooting

### Database Connection Issues

- Check your environment variables
- Verify that your IP is allowed in Supabase's database settings
- Make sure your RLS policies are correctly configured

### Authentication Problems

- Ensure your redirect URLs are correctly set in Supabase
- Check that you're using the correct Supabase URL and API key
- Verify that your users have the right permissions

### Deployment Failures

- Verify that you've installed all dependencies
- Check the build logs for any errors
- Make sure your Node.js version is compatible with Next.js 14

## Security Considerations

1. **Environment Variables**: Never commit your `.env` files to version control
2. **API Keys**: Use the anon key for client-side code; service role keys should only be used in server-side code
3. **Row Level Security**: Configure RLS policies to protect your data
4. **HTTPS**: Ensure your deployed application uses HTTPS

## Backups and Maintenance

- Set up regular database backups in Supabase
- Plan for regular updates to dependencies
- Monitor application performance and errors

## Need Help?

If you encounter issues deploying the TimeSheet app:

- Check the [Next.js documentation](https://nextjs.org/docs)
- Refer to the [Supabase documentation](https://supabase.io/docs)
- Consult the deployment platform's help resources 