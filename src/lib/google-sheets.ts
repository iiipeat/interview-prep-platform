import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export class GoogleSheetsService {
  private sheets: any;
  private auth: any;
  private spreadsheetId: string;
  private isInitialized: boolean = false;
  private initializationError: string | null = null;

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '';
    // Don't initialize immediately - do it lazily when needed
  }

  private initializeAuth() {
    if (this.isInitialized || this.initializationError) {
      return;
    }

    try {
      const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

      if (!privateKey || !clientEmail) {
        this.initializationError = 'Google Sheets credentials not configured';
        console.log('Google Sheets credentials not configured - service will be disabled');
        return;
      }

      this.auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SCOPES,
      });

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.isInitialized = true;
    } catch (error) {
      this.initializationError = `Failed to initialize Google Sheets auth: ${error}`;
      console.error('Failed to initialize Google Sheets auth:', error);
    }
  }

  private ensureInitialized() {
    if (!this.isInitialized && !this.initializationError) {
      this.initializeAuth();
    }
    
    if (this.initializationError) {
      throw new Error(this.initializationError);
    }
  }

  async createSpreadsheet(title: string) {
    try {
      this.ensureInitialized();
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title,
          },
          sheets: [
            {
              properties: {
                title: 'Users',
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 15,
                },
              },
            },
          ],
        },
      });
      return response.data.spreadsheetId;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  async setupHeaders() {
    this.ensureInitialized();
    const headers = [
      ['User ID', 'Email', 'Full Name', 'Subscription Status', 'Plan Type', 
       'Subscription Started', 'Trial End Date', 'Current Period End', 
       'Total Sessions', 'Questions Today', 'Daily Limit', 
       'Sign Up Date', 'Last Login', 'Payment Status', 'Customer ID']
    ];

    try {
      // First, get the current sheets
      const sheetsResponse = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      const sheets = sheetsResponse.data.sheets || [];
      const firstSheet = sheets[0];
      const sheetName = firstSheet?.properties?.title || 'Sheet1';
      
      // Use the actual sheet name for the range
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:O1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: headers,
        },
      });

      // Format header row
      const sheetId = firstSheet?.properties?.sheetId || 0;
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.3, blue: 0.8 },
                    textFormat: {
                      foregroundColor: { red: 1, green: 1, blue: 1 },
                      bold: true,
                    },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error setting up headers:', error);
      throw error;
    }
  }

  async clearSheet() {
    try {
      this.ensureInitialized();
      // Get the actual sheet name
      const sheetsResponse = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheets = sheetsResponse.data.sheets || [];
      const sheetName = sheets[0]?.properties?.title || 'Sheet1';
      
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:O1000`,
      });
    } catch (error) {
      console.error('Error clearing sheet:', error);
      throw error;
    }
  }

  async updateUserData(userData: any[]) {
    try {
      this.ensureInitialized();
      // Clear existing data (except headers)
      await this.clearSheet();

      if (userData.length === 0) {
        console.log('No user data to update');
        return;
      }

      // Prepare data rows
      const rows = userData.map(user => [
        user.id || '',
        user.email || '',
        user.full_name || '',
        user.subscription_status || 'No Subscription',
        user.plan_type || 'None',
        user.subscription_started || '',
        user.trial_end_date || '',
        user.current_period_end || '',
        user.total_sessions || 0,
        user.questions_today || 0,
        user.daily_limit || 0,
        user.created_at || '',
        user.last_login || '',
        user.payment_status || 'N/A',
        user.stripe_customer_id || '',
      ]);

      // Get the actual sheet name
      const sheetsResponse = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheets = sheetsResponse.data.sheets || [];
      const sheetName = sheets[0]?.properties?.title || 'Sheet1';
      
      // Update values
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A2:O${rows.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });

      // Apply formatting
      await this.formatDataRows(rows.length);

      console.log(`Successfully updated ${rows.length} user records`);
      return rows.length;
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  }

  private async formatDataRows(rowCount: number) {
    try {
      // Get the sheet ID
      const sheetsResponse = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheets = sheetsResponse.data.sheets || [];
      const firstSheet = sheets[0];
      const sheetId = firstSheet?.properties?.sheetId || 0;
      
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            // Auto-resize columns
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: sheetId,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: 15,
                },
              },
            },
            // Add borders
            {
              updateBorders: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: rowCount + 1,
                  startColumnIndex: 0,
                  endColumnIndex: 15,
                },
                top: { style: 'SOLID', width: 1 },
                bottom: { style: 'SOLID', width: 1 },
                left: { style: 'SOLID', width: 1 },
                right: { style: 'SOLID', width: 1 },
                innerHorizontal: { style: 'SOLID', width: 1 },
                innerVertical: { style: 'SOLID', width: 1 },
              },
            },
            // Alternate row colors
            {
              addConditionalFormatRule: {
                rule: {
                  ranges: [{
                    sheetId: sheetId,
                    startRowIndex: 1,
                    endRowIndex: rowCount + 1,
                    startColumnIndex: 0,
                    endColumnIndex: 15,
                  }],
                  booleanRule: {
                    condition: {
                      type: 'CUSTOM_FORMULA',
                      values: [{ userEnteredValue: '=MOD(ROW(),2)=0' }],
                    },
                    format: {
                      backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
                    },
                  },
                },
                index: 0,
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error formatting data rows:', error);
    }
  }

  async appendUserData(userData: any) {
    try {
      this.ensureInitialized();
      const row = [[
        userData.id || '',
        userData.email || '',
        userData.full_name || '',
        userData.subscription_status || 'No Subscription',
        userData.plan_type || 'None',
        userData.subscription_started || '',
        userData.trial_end_date || '',
        userData.current_period_end || '',
        userData.total_sessions || 0,
        userData.questions_today || 0,
        userData.daily_limit || 0,
        userData.created_at || '',
        userData.last_login || '',
        userData.payment_status || 'N/A',
        userData.stripe_customer_id || '',
      ]];

      // Get the actual sheet name
      const sheetsResponse = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      const sheets = sheetsResponse.data.sheets || [];
      const sheetName = sheets[0]?.properties?.title || 'Sheet1';
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:O`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: row,
        },
      });

      console.log('Successfully appended user data');
      return true;
    } catch (error) {
      console.error('Error appending user data:', error);
      throw error;
    }
  }

  async getSpreadsheetUrl() {
    this.ensureInitialized();
    return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
  }
}

export const googleSheets = new GoogleSheetsService();