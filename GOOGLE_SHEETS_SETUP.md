# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration to track all users from your interview prep website.

## Features

The Google Sheets integration tracks:
- User ID and Email
- Full Name
- Subscription Status (Trial/Active/Expired)
- Plan Type (Free Trial/Weekly/Monthly)
- Subscription Start Date
- Trial End Date
- Current Period End
- Total Practice Sessions
- Questions Asked Today
- Daily Question Limit
- Sign Up Date
- Last Login
- Payment Status
- Stripe Customer ID

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

### Step 2: Create a Service Account

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `interview-prep-sheets`
   - Description: `Service account for Interview Prep Google Sheets integration`
4. Click "Create and Continue"
5. Skip the optional roles (click "Continue")
6. Click "Done"

### Step 3: Generate Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create" - this will download a JSON file with your credentials
6. **Keep this file secure!** It contains sensitive credentials

### Step 4: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Interview Prep Users" (or any name you prefer)
4. Copy the spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
   - Copy the `SPREADSHEET_ID` part

### Step 5: Share the Sheet with Service Account

1. In your Google Sheet, click the "Share" button
2. Add the service account email (found in your JSON key file as `client_email`)
3. Give it "Editor" permissions
4. Click "Send"

### Step 6: Configure Environment Variables

1. Open the downloaded JSON key file
2. Copy the values to your `.env.local` file:

```env
# From the JSON key file
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# From the Google Sheet URL
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id

# Create a secure admin token (use a password generator)
ADMIN_SECRET_TOKEN=your-secure-random-token-here
```

**Important:** When copying the private key, make sure to:
- Keep it in quotes
- Keep all the `\n` characters
- Don't add extra line breaks

### Step 7: Access the Admin Dashboard

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/admin/users`

3. Enter your admin token (from `ADMIN_SECRET_TOKEN`)

4. Click "Setup Sheet Headers" first (only needed once)

5. Click "Export All Users" to sync user data to Google Sheets

## Usage

### Manual Export
1. Go to `/admin/users`
2. Enter your admin token
3. Click "Export All Users"
4. The sheet will be updated with the latest user data

### Viewing the Data
1. Open your Google Sheet
2. Data is automatically formatted with:
   - Blue header row
   - Alternating row colors
   - Auto-sized columns
   - Borders for easy reading

### Data Columns Explained

| Column | Description |
|--------|-------------|
| User ID | Unique identifier from database |
| Email | User's email address |
| Full Name | User's full name (if provided) |
| Subscription Status | Current status (Active Trial, Active Subscription, Expired, etc.) |
| Plan Type | Subscription plan (Free Trial, Weekly $5/week, Monthly $29/month) |
| Subscription Started | When the subscription began |
| Trial End Date | When the free trial ends |
| Current Period End | When current billing period ends |
| Total Sessions | Number of practice sessions completed |
| Questions Today | Questions asked today |
| Daily Limit | Daily question limit (20 for most plans) |
| Sign Up Date | When user created account |
| Last Login | Most recent login time |
| Payment Status | Payment status (Active, Cancelled, Past Due) |
| Customer ID | Stripe customer ID for payment tracking |

## Security Notes

1. **Never commit the `.env.local` file** - it contains sensitive credentials
2. **Keep your admin token secure** - anyone with this token can export user data
3. **Limit access** to the Google Sheet - only share with team members who need it
4. **Use strong admin tokens** - generate using a password manager

## Troubleshooting

### "Google Sheets credentials not configured"
- Make sure all environment variables are set correctly
- Restart your development server after adding environment variables

### "Failed to fetch user data"
- Check that your Supabase connection is working
- Verify the database tables exist

### "Unauthorized"
- Make sure you're using the correct admin token
- Check that the token matches `ADMIN_SECRET_TOKEN` in `.env.local`

### Sheet not updating
- Verify the service account has editor access to the sheet
- Check the spreadsheet ID is correct
- Make sure the Google Sheets API is enabled

## Advanced Usage

### Automatic Daily Sync (Optional)
You can set up a cron job or scheduled function to automatically sync data daily:

```javascript
// Example: Vercel Cron Job (vercel.json)
{
  "crons": [{
    "path": "/api/admin/users/export?action=sync",
    "schedule": "0 2 * * *"  // Daily at 2 AM
  }]
}
```

### Custom Filters
The API endpoint can be extended to support filtering:
- By subscription status
- By date range
- By activity level

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs for API errors
3. Verify all credentials are correct
4. Ensure the Google Sheet is shared with the service account