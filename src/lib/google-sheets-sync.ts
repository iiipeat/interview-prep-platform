import { GoogleSheetsService } from './google-sheets';
import { supabaseAdmin } from './supabase';

class GoogleSheetsSyncService {
  private googleSheets: GoogleSheetsService;
  private isSyncing: boolean = false;

  constructor() {
    this.googleSheets = new GoogleSheetsService();
  }

  /**
   * Sync a single user to Google Sheets (update or append)
   */
  async syncUser(userId: string, userData?: any) {
    try {
      // Skip if already syncing to prevent race conditions
      if (this.isSyncing) {
        console.log('Sync already in progress, queueing...');
        setTimeout(() => this.syncUser(userId, userData), 2000);
        return;
      }

      this.isSyncing = true;

      // If userData not provided, fetch from database
      if (!userData) {
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select(`
            id,
            email,
            full_name,
            created_at,
            last_login_at,
            user_subscriptions (
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
            prompt_usage (
              prompt_count,
              prompt_limit,
              usage_date
            ),
            practice_sessions (
              id
            )
          `)
          .eq('id', userId)
          .single();

        if (error || !user) {
          console.error('Failed to fetch user for sync:', error);
          return;
        }
        
        userData = user;
      }

      // Format user data for Google Sheets
      const formattedUser = this.formatUserData(userData);

      // Append to Google Sheets
      await this.googleSheets.appendUserData(formattedUser);
      
      console.log(`User ${userId} synced to Google Sheets`);
    } catch (error) {
      console.error('Error syncing user to Google Sheets:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync all users to Google Sheets (full sync)
   */
  async syncAllUsers() {
    try {
      if (this.isSyncing) {
        console.log('Sync already in progress');
        return;
      }

      this.isSyncing = true;

      // Fetch all users
      const { data: users, error } = await supabaseAdmin
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

      if (error) {
        console.error('Failed to fetch users for sync:', error);
        return;
      }

      // Format all users
      const formattedUsers = (users || []).map(user => this.formatUserData(user));

      // Setup headers and update all data
      await this.googleSheets.setupHeaders();
      await this.googleSheets.updateUserData(formattedUsers);

      console.log(`Synced ${formattedUsers.length} users to Google Sheets`);
      
      return {
        success: true,
        userssynced: formattedUsers.length,
        spreadsheetUrl: await this.googleSheets.getSpreadsheetUrl()
      };
    } catch (error) {
      console.error('Error syncing all users to Google Sheets:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Format user data for Google Sheets
   */
  private formatUserData(user: any) {
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
  }

  /**
   * Update user's last login and sync to sheet
   */
  async updateUserLogin(userId: string, email?: string) {
    try {
      // Update last login time in database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (!error && user) {
        // Sync to Google Sheets
        await this.syncUser(userId, user);
      }
      
      console.log(`Updated login time for user ${email || userId}`);
    } catch (error) {
      console.error('Error updating user login:', error);
    }
  }
}

// Export singleton instance
export const googleSheetsSync = new GoogleSheetsSyncService();