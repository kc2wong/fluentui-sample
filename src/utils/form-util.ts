import { ZodIssue, ZodSchema } from 'zod';
import { emptyStringToUndefined } from './object-util';

// Generic function to check if all required fields are entered
export const hasMissingRequiredField = <T>(
  formValues: T,
  schema: ZodSchema<T>,
  additionalRule?: (zodIssue: ZodIssue) => boolean,
): boolean => {
  const validationResult = schema.safeParse(emptyStringToUndefined(formValues));
  const missingRequiredFieldIssue = validationResult.error?.issues.find(
    (issue) =>
      (['invalid_type', 'custom'].includes(issue.code) && issue.message === 'Required') ||
      (additionalRule && additionalRule(issue)),
  );
  return missingRequiredFieldIssue !== undefined;
};
