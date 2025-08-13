// Mock validation schemas for development

export class ZodError extends Error {
  errors: any[];
  constructor(errors: any[]) {
    super('Validation error');
    this.errors = errors;
  }
}

export const z = {
  ZodError,
  object: (shape: any) => ({
    parse: (data: any) => data,
    safeParse: (data: any) => ({ success: true, data }),
    shape,
    omit: (keys: any) => z.object(shape),
    pick: (keys: any) => z.object(shape),
    extend: (newShape: any) => z.object({ ...shape, ...newShape })
  }),
  string: () => {
    const chain: any = {
      email: () => chain,
      min: (n: number) => chain,
      max: (n: number) => chain,
      optional: () => chain,
      url: () => chain
    };
    return chain;
  },
  number: () => ({
    positive: () => ({ positive: true }),
    int: () => ({ int: true }),
    optional: () => ({ optional: true })
  }),
  boolean: () => {
    const chain: any = {
      optional: () => chain,
      default: (val: any) => chain,
      boolean: true
    };
    return chain;
  },
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

// Missing schemas for API routes
export const validateQueryParams = (params: any) => params;

export const questionFilterSchema = z.object({
  category: z.string().optional(),
  difficulty: z.string().optional()
});

export const userResponseSchema = z.object({
  response: z.string(),
  questionId: z.string()
});

export const sessionCompletionSchema = z.object({
  completed: z.boolean()
});

export const sessionCreationSchema = z.object({
  type: z.string(),
  userId: z.string()
});

export const userProfileCreationSchema = z.object({
  fullName: z.string(),
  email: z.string().email()
});

export const userProfileUpdateSchema = z.object({
  fullName: z.string().optional(),
  bio: z.string().optional()
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