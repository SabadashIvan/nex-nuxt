/**
 * Form validation utilities
 */

export interface ValidationRule {
  validate: (value: unknown) => boolean
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate a value against multiple rules
 */
export function validate(value: unknown, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = []
  
  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate multiple fields
 */
export function validateFields(
  fields: Record<string, unknown>,
  fieldRules: Record<string, ValidationRule[]>
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {}
  
  for (const [field, rules] of Object.entries(fieldRules)) {
    results[field] = validate(fields[field], rules)
  }

  return results
}

/**
 * Check if all fields are valid
 */
export function isFormValid(results: Record<string, ValidationResult>): boolean {
  return Object.values(results).every(result => result.valid)
}

// ============================================
// Built-in validation rules
// ============================================

/**
 * Required field rule
 */
export function required(message = 'This field is required'): ValidationRule {
  return {
    validate: (value) => {
      if (value === null || value === undefined) return false
      if (typeof value === 'string') return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return true
    },
    message,
  }
}

/**
 * Email validation rule
 */
export function email(message = 'Please enter a valid email address'): ValidationRule {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return {
    validate: (value) => {
      if (!value || typeof value !== 'string') return true // Let required handle empty
      return emailRegex.test(value)
    },
    message,
  }
}

/**
 * Minimum length rule
 */
export function minLength(min: number, message?: string): ValidationRule {
  return {
    validate: (value) => {
      if (!value) return true
      const length = typeof value === 'string' ? value.length : String(value).length
      return length >= min
    },
    message: message || `Must be at least ${min} characters`,
  }
}

/**
 * Maximum length rule
 */
export function maxLength(max: number, message?: string): ValidationRule {
  return {
    validate: (value) => {
      if (!value) return true
      const length = typeof value === 'string' ? value.length : String(value).length
      return length <= max
    },
    message: message || `Must be no more than ${max} characters`,
  }
}

/**
 * Minimum value rule (for numbers)
 */
export function min(minValue: number, message?: string): ValidationRule {
  return {
    validate: (value) => {
      if (value === null || value === undefined || value === '') return true
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      return !isNaN(num) && num >= minValue
    },
    message: message || `Must be at least ${minValue}`,
  }
}

/**
 * Maximum value rule (for numbers)
 */
export function max(maxValue: number, message?: string): ValidationRule {
  return {
    validate: (value) => {
      if (value === null || value === undefined || value === '') return true
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      return !isNaN(num) && num <= maxValue
    },
    message: message || `Must be no more than ${maxValue}`,
  }
}

/**
 * Pattern matching rule
 */
export function pattern(regex: RegExp, message = 'Invalid format'): ValidationRule {
  return {
    validate: (value) => {
      if (!value || typeof value !== 'string') return true
      return regex.test(value)
    },
    message,
  }
}

/**
 * Phone number validation
 */
export function phone(message = 'Please enter a valid phone number'): ValidationRule {
  // Accepts various phone formats
  const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/
  return {
    validate: (value) => {
      if (!value || typeof value !== 'string') return true
      const cleaned = value.replace(/[\s\-\(\)\.]/g, '')
      return phoneRegex.test(value) && cleaned.length >= 7 && cleaned.length <= 15
    },
    message,
  }
}

/**
 * Postal code validation
 */
export function postalCode(message = 'Please enter a valid postal code'): ValidationRule {
  return {
    validate: (value) => {
      if (!value || typeof value !== 'string') return true
      // Generic postal code validation (alphanumeric, 3-10 characters)
      return /^[a-zA-Z0-9\s\-]{3,10}$/.test(value)
    },
    message,
  }
}

/**
 * Password strength validation
 */
export function password(message = 'Password must be at least 8 characters with letters and numbers'): ValidationRule {
  return {
    validate: (value) => {
      if (!value || typeof value !== 'string') return true
      // At least 8 characters, contains letter and number
      return value.length >= 8 && /[a-zA-Z]/.test(value) && /[0-9]/.test(value)
    },
    message,
  }
}

/**
 * Confirm password match
 */
export function confirmPassword(passwordValue: string, message = 'Passwords do not match'): ValidationRule {
  return {
    validate: (value) => {
      if (!value || typeof value !== 'string') return true
      return value === passwordValue
    },
    message,
  }
}

/**
 * Numeric only validation
 */
export function numeric(message = 'Must be a number'): ValidationRule {
  return {
    validate: (value) => {
      if (value === null || value === undefined || value === '') return true
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      return !isNaN(num)
    },
    message,
  }
}

/**
 * Integer only validation
 */
export function integer(message = 'Must be a whole number'): ValidationRule {
  return {
    validate: (value) => {
      if (value === null || value === undefined || value === '') return true
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      return !isNaN(num) && Number.isInteger(num)
    },
    message,
  }
}

/**
 * URL validation
 */
export function url(message = 'Please enter a valid URL'): ValidationRule {
  return {
    validate: (value) => {
      if (!value || typeof value !== 'string') return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message,
  }
}

