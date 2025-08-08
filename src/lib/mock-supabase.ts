// Mock Supabase client for development without dependencies

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

class MockSupabaseClient {
  private currentUser: User | null = null;
  private currentSession: Session | null = null;

  auth = {
    getSession: async () => {
      return { data: { session: this.currentSession }, error: null };
    },
    
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Mock successful login
      const mockUser: User = {
        id: 'mock-user-id',
        email,
        user_metadata: { name: email.split('@')[0] }
      };
      
      const mockSession: Session = {
        user: mockUser,
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token'
      };
      
      this.currentUser = mockUser;
      this.currentSession = mockSession;
      
      return { data: { user: mockUser, session: mockSession }, error: null };
    },
    
    signInWithOAuth: async ({ provider }: { provider: string }) => {
      // Mock OAuth sign in
      return { 
        data: { url: `https://mock-oauth.com/${provider}` }, 
        error: null 
      };
    },
    
    signUp: async ({ email, password }: { email: string; password: string }) => {
      // Mock sign up
      const mockUser: User = {
        id: 'new-user-id',
        email,
        user_metadata: { name: email.split('@')[0] }
      };
      
      return { data: { user: mockUser }, error: null };
    },
    
    signOut: async () => {
      this.currentUser = null;
      this.currentSession = null;
      return { error: null };
    },
    
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      // Mock auth state listener
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  };

  from = (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null })
      })
    }),
    insert: async (data: any) => ({ data, error: null }),
    update: async (data: any) => ({ data, error: null })
  });
}

export const supabase = new MockSupabaseClient();

// Mock Zod for validation
export const z = {
  object: (shape: any) => ({
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true, data })
  }),
  string: () => ({
    email: () => ({}),
    min: () => ({}),
    optional: () => ({})
  }),
  number: () => ({
    positive: () => ({}),
    optional: () => ({})
  }),
  enum: (values: any[]) => ({})
};