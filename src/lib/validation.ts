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

// Mock validation function
export function validateData(schema: any, data: any) {
  // Simple mock validation - in production would use real Zod
  return { success: true, data, error: null };
}