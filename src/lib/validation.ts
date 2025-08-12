// Mock validation schemas for development

export const z = {
  object: (shape: any) => ({
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true, data }),
    shape
  }),
  string: () => ({
    email: () => ({ email: true }),
    min: (n: number) => ({ min: n }),
    max: (n: number) => ({ max: n }),
    optional: () => ({ optional: true }),
    url: () => ({ url: true })
  }),
  number: () => ({
    positive: () => ({ positive: true }),
    int: () => ({ int: true }),
    optional: () => ({ optional: true })
  }),
  boolean: () => ({ boolean: true }),
  array: (schema: any) => ({ array: true, schema }),
  enum: (values: any[]) => ({ enum: values }),
  literal: (value: any) => ({ literal: value })
};

// Common validation schemas
export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8);

// User authentication schemas
export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const userRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1)
});

// Question generation validation schema
export const questionGenerationSchema = z.object({
  industry: z.string().optional(),
  role: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']),
  questionType: z.enum(['behavioral', 'situational', 'technical', 'culture-fit']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  companyType: z.string().optional(),
  count: z.number()
});

// Mock validation function
export function validateData(schema: any, data: any) {
  // Simple mock validation - in production would use real Zod
  return { success: true, data, error: null };
}

// Request body validation function
export function validateRequestBody(schema: any, data: any): { data: any; error: string | null } {
  try {
    // Simple validation for required fields
    if (!data || typeof data !== 'object') {
      return { data: null, error: 'Request body must be a valid JSON object' };
    }

    // For question generation, set defaults for missing fields
    if (schema === questionGenerationSchema) {
      const validated = {
        industry: data.industry || data.role || 'tech',
        role: data.role || 'Software Engineer',
        experienceLevel: data.experienceLevel || 'mid',
        questionType: data.questionType || 'behavioral',
        difficulty: data.difficulty || 'medium',
        companyType: data.companyType,
        count: Math.min(Math.max(1, data.count || 1), 5) // Between 1 and 5
      };
      return { data: validated, error: null };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: 'Invalid request format' };
  }
}