import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';
import { googleSheets } from '../../../../../lib/google-sheets';
import { 
  successResponse, 
  errorResponse,
  unauthorizedResponse,
} from '../../../../../lib/api-helpers';

// Simple admin check - you should enhance this with proper authentication
function isAdmin(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token');
  return adminToken === process.env.ADMIN_SECRET_TOKEN;
}

export async function GET(request: NextRequest) {
  // Check admin authorization
  if (!isAdmin(request)) {
    return unauthorizedResponse();
  }

  try {
    // Fetch all users with their subscription data
    if (!supabaseAdmin) {
      return errorResponse('Database not configured', 500);
    }
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        created_at,
        last_login_at,
        user_subscriptions!left (
          status,
          trial_start_date,
          trial_end_date,
          current_period_start,
          current_period_end,
          stripe_customer_id,
          subscription_plans (
            name,
            price_weekly,
            price_monthly
          )
        ),
        prompt_usage!left (
          prompt_count,
          prompt_limit,
          usage_date
        ),
        practice_sessions!left (
          id
        )
      `)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return errorResponse('Failed to fetch user data', 500);
    }

    // Format data for Google Sheets
    const formattedUsers = users?.map(user => {
      const subscription = user.user_subscriptions?.[0];
      const todayUsage = user.prompt_usage?.find(
        (usage: any) => usage.usage_date === new Date().toISOString().split('T')[0]
      );
      
      let subscriptionStatus = 'No Subscription';
      let planType = 'None';
      let paymentStatus = 'N/A';
      
      if (subscription) {
        if (subscription.status === 'trial') {
          const trialEndDate = new Date(subscription.trial_end_date);
          if (trialEndDate > new Date()) {
            subscriptionStatus = 'Active Trial';
            planType = 'Free Trial';
          } else {
            subscriptionStatus = 'Trial Expired';
            planType = 'Free Trial (Expired)';
          }
        } else if (subscription.status === 'active') {
          subscriptionStatus = 'Active Subscription';
          if (subscription.subscription_plans?.price_weekly) {
            planType = 'Weekly ($' + (subscription.subscription_plans.price_weekly / 100) + '/week)';
          } else if (subscription.subscription_plans?.price_monthly) {
            planType = 'Monthly ($' + (subscription.subscription_plans.price_monthly / 100) + '/month)';
          }
          paymentStatus = 'Active';
        } else if (subscription.status === 'cancelled') {
          subscriptionStatus = 'Cancelled';
          planType = 'Cancelled';
          paymentStatus = 'Cancelled';
        } else if (subscription.status === 'past_due') {
          subscriptionStatus = 'Past Due';
          paymentStatus = 'Past Due';
        }
      }

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name || 'Not Provided',
        subscription_status: subscriptionStatus,
        plan_type: planType,
        subscription_started: subscription?.trial_start_date || subscription?.current_period_start || '',
        trial_end_date: subscription?.trial_end_date || '',
        current_period_end: subscription?.current_period_end || '',
        total_sessions: user.practice_sessions?.length || 0,
        questions_today: todayUsage?.prompt_count || 0,
        daily_limit: todayUsage?.prompt_limit || 20,
        created_at: user.created_at,
        last_login: user.last_login_at || user.created_at,
        payment_status: paymentStatus,
        stripe_customer_id: subscription?.stripe_customer_id || '',
      };
    }) || [];

    // Update Google Sheets
    await googleSheets.setupHeaders();
    const updatedCount = await googleSheets.updateUserData(formattedUsers);
    const spreadsheetUrl = await googleSheets.getSpreadsheetUrl();

    return successResponse({
      message: 'User data exported successfully',
      usersExported: updatedCount,
      totalUsers: formattedUsers.length,
      spreadsheetUrl,
      exportedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return errorResponse(error.message || 'Failed to export user data', 500);
  }
}

export async function POST(request: NextRequest) {
  // Check admin authorization
  if (!isAdmin(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'setup') {
      // Setup initial spreadsheet with headers
      await googleSheets.setupHeaders();
      const spreadsheetUrl = await googleSheets.getSpreadsheetUrl();
      
      return successResponse({
        message: 'Google Sheet setup completed',
        spreadsheetUrl,
      });
    }

    if (action === 'sync') {
      // Same as GET - full sync
      return GET(request);
    }

    return errorResponse('Invalid action', 400);
  } catch (error: any) {
    console.error('Export POST error:', error);
    return errorResponse(error.message || 'Failed to process request', 500);
  }
}

export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
    },
  });
};