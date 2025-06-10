"use strict";

/**
 * SeederValidator - A comprehensive validation utility for seeder data
 *
 * This class provides validation methods to ensure data integrity
 * before performing database seeding operations.
 *
 * Features:
 * - Schema-based validation
 * - Cross-reference validation
 * - Data consistency checks
 * - Detailed error reporting
 *
 * @class SeederValidator
 */
class SeederValidator {
  /**
   * Validates data against a defined schema
   *
   * @param {Array} data - Data array to validate
   * @param {Object} schema - Validation schema definition
   * @param {string} entityName - Name of the entity (for error reporting)
   * @returns {Object} Validation result with isValid boolean and errors array
   *
   * @example
   * const schema = {
   *   name: { required: true, type: 'string', minLength: 2 },
   *   email: { required: true, type: 'email' },
   *   age: { required: false, type: 'number', min: 0, max: 150 }
   * };
   * const result = SeederValidator.validateSchema(userData, schema, 'User');
   */
  static validateSchema(data, schema, entityName = "Entity") {
    if (!Array.isArray(data)) {
      return {
        isValid: false,
        errors: [`${entityName} data must be an array`],
        warnings: [],
      };
    }

    if (!schema || typeof schema !== "object") {
      return {
        isValid: false,
        errors: [`${entityName} schema must be an object`],
        warnings: [],
      };
    }

    const errors = [];
    const warnings = [];

    data.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        errors.push(`${entityName} item at index ${index}: Must be an object`);
        return;
      }

      // Validate each field in the schema
      Object.entries(schema).forEach(([fieldName, fieldSchema]) => {
        const value = item[fieldName];
        const fieldErrors = this._validateField(
          value,
          fieldSchema,
          fieldName,
          index,
          entityName
        );
        errors.push(...fieldErrors);
      });

      // Check for unexpected fields
      const schemaFields = Object.keys(schema);
      const itemFields = Object.keys(item);
      const unexpectedFields = itemFields.filter(
        (field) => !schemaFields.includes(field)
      );

      if (unexpectedFields.length > 0) {
        warnings.push(
          `${entityName} item at index ${index}: Unexpected fields: ${unexpectedFields.join(
            ", "
          )}`
        );
      }
    });

    const isValid = errors.length === 0;

    if (isValid) {
      console.log(
        `✓ Schema validation passed for ${data.length} ${entityName} records`
      );
      if (warnings.length > 0) {
        console.warn(`⚠ ${warnings.length} warnings found for ${entityName}`);
      }
    } else {
      console.error(
        `✗ Schema validation failed for ${entityName} with ${errors.length} errors`
      );
    }

    return { isValid, errors, warnings };
  }

  /**
   * Validates individual field against field schema
   *
   * @private
   * @param {*} value - Field value
   * @param {Object} fieldSchema - Field validation rules
   * @param {string} fieldName - Name of the field
   * @param {number} index - Index of the record
   * @param {string} entityName - Name of the entity
   * @returns {Array} Array of error messages
   */
  static _validateField(value, fieldSchema, fieldName, index, entityName) {
    const errors = [];
    const isValueEmpty = value === null || value === undefined || value === "";

    // Required field validation
    if (fieldSchema.required && isValueEmpty) {
      errors.push(
        `${entityName} item at index ${index}: Field '${fieldName}' is required`
      );
      return errors; // Skip other validations if required field is missing
    }

    // Skip other validations if field is not required and empty
    if (!fieldSchema.required && isValueEmpty) {
      return errors;
    }

    // Type validation
    if (fieldSchema.type) {
      const typeError = this._validateFieldType(
        value,
        fieldSchema.type,
        fieldName,
        index,
        entityName
      );
      if (typeError) {
        errors.push(typeError);
        return errors; // Skip other validations if type is wrong
      }
    }

    // Length validations for strings
    if (typeof value === "string") {
      if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
        errors.push(
          `${entityName} item at index ${index}: Field '${fieldName}' must be at least ${fieldSchema.minLength} characters long`
        );
      }
      if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
        errors.push(
          `${entityName} item at index ${index}: Field '${fieldName}' must be no more than ${fieldSchema.maxLength} characters long`
        );
      }
    }

    // Numeric range validations
    if (typeof value === "number") {
      if (fieldSchema.min !== undefined && value < fieldSchema.min) {
        errors.push(
          `${entityName} item at index ${index}: Field '${fieldName}' must be at least ${fieldSchema.min}`
        );
      }
      if (fieldSchema.max !== undefined && value > fieldSchema.max) {
        errors.push(
          `${entityName} item at index ${index}: Field '${fieldName}' must be no more than ${fieldSchema.max}`
        );
      }
    }

    // Enum validation
    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      errors.push(
        `${entityName} item at index ${index}: Field '${fieldName}' must be one of: ${fieldSchema.enum.join(
          ", "
        )}`
      );
    }

    // Pattern validation for strings
    if (fieldSchema.pattern && typeof value === "string") {
      const regex = new RegExp(fieldSchema.pattern);
      if (!regex.test(value)) {
        errors.push(
          `${entityName} item at index ${index}: Field '${fieldName}' does not match required pattern`
        );
      }
    }

    return errors;
  }

  /**
   * Validates field type
   *
   * @private
   * @param {*} value - Field value
   * @param {string} expectedType - Expected type
   * @param {string} fieldName - Name of the field
   * @param {number} index - Index of the record
   * @param {string} entityName - Name of the entity
   * @returns {string|null} Error message or null if valid
   */
  static _validateFieldType(value, expectedType, fieldName, index, entityName) {
    switch (expectedType) {
      case "string":
        if (typeof value !== "string") {
          return `${entityName} item at index ${index}: Field '${fieldName}' must be a string`;
        }
        break;

      case "number":
        if (typeof value !== "number" || isNaN(value)) {
          return `${entityName} item at index ${index}: Field '${fieldName}' must be a number`;
        }
        break;

      case "integer":
        if (!Number.isInteger(value)) {
          return `${entityName} item at index ${index}: Field '${fieldName}' must be an integer`;
        }
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          return `${entityName} item at index ${index}: Field '${fieldName}' must be a boolean`;
        }
        break;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== "string" || !emailRegex.test(value)) {
          return `${entityName} item at index ${index}: Field '${fieldName}' must be a valid email address`;
        }
        break;

      case "url":
        try {
          new URL(value);
        } catch {
          return `${entityName} item at index ${index}: Field '${fieldName}' must be a valid URL`;
        }
        break;

      case "json":
        if (typeof value === "string") {
          try {
            JSON.parse(value);
          } catch {
            return `${entityName} item at index ${index}: Field '${fieldName}' must be valid JSON`;
          }
        } else if (typeof value !== "object") {
          return `${entityName} item at index ${index}: Field '${fieldName}' must be an object or JSON string`;
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          return `${entityName} item at index ${index}: Field '${fieldName}' must be an array`;
        }
        break;

      case "date":
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return `${entityName} item at index ${index}: Field '${fieldName}' must be a valid date`;
        }
        break;

      default:
        return `${entityName} item at index ${index}: Unknown field type '${expectedType}' for field '${fieldName}'`;
    }

    return null;
  }

  /**
   * Validates cross-references between related data sets
   *
   * @param {Array} sourceData - Source data array
   * @param {Array} targetData - Target data array to reference
   * @param {string} sourceField - Field in source data containing the reference
   * @param {string} targetField - Field in target data being referenced
   * @param {string} sourceName - Name of source entity
   * @param {string} targetName - Name of target entity
   * @returns {Object} Validation result
   *
   * @example
   * const result = SeederValidator.validateCrossReferences(
   *   userData, roleData, 'roleId', 'id', 'User', 'Role'
   * );
   */
  static validateCrossReferences(
    sourceData,
    targetData,
    sourceField,
    targetField,
    sourceName,
    targetName
  ) {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(sourceData) || !Array.isArray(targetData)) {
      return {
        isValid: false,
        errors: ["Source and target data must be arrays"],
        warnings: [],
      };
    }

    // Create a set of target values for efficient lookup
    const targetValues = new Set(targetData.map((item) => item[targetField]));

    sourceData.forEach((item, index) => {
      const referenceValue = item[sourceField];

      if (referenceValue !== null && referenceValue !== undefined) {
        if (!targetValues.has(referenceValue)) {
          errors.push(
            `${sourceName} item at index ${index}: Reference '${sourceField}' value '${referenceValue}' not found in ${targetName}.${targetField}`
          );
        }
      }
    });

    const isValid = errors.length === 0;

    if (isValid) {
      console.log(
        `✓ Cross-reference validation passed between ${sourceName} and ${targetName}`
      );
    } else {
      console.error(
        `✗ Cross-reference validation failed between ${sourceName} and ${targetName} with ${errors.length} errors`
      );
    }

    return { isValid, errors, warnings };
  }

  /**
   * Validates uniqueness of specified fields within a dataset
   *
   * @param {Array} data - Data array to validate
   * @param {Array} uniqueFields - Array of field names that should be unique
   * @param {string} entityName - Name of the entity
   * @returns {Object} Validation result
   *
   * @example
   * const result = SeederValidator.validateUniqueness(userData, ['email', 'userName'], 'User');
   */
  static validateUniqueness(data, uniqueFields, entityName = "Entity") {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(data)) {
      return {
        isValid: false,
        errors: [`${entityName} data must be an array`],
        warnings: [],
      };
    }

    uniqueFields.forEach((fieldName) => {
      const valueMap = new Map();

      data.forEach((item, index) => {
        const value = item[fieldName];

        if (value !== null && value !== undefined && value !== "") {
          if (valueMap.has(value)) {
            const firstIndex = valueMap.get(value);
            errors.push(
              `${entityName}: Duplicate value '${value}' for field '${fieldName}' found at indices ${firstIndex} and ${index}`
            );
          } else {
            valueMap.set(value, index);
          }
        }
      });
    });

    const isValid = errors.length === 0;

    if (isValid) {
      console.log(`✓ Uniqueness validation passed for ${entityName}`);
    } else {
      console.error(
        `✗ Uniqueness validation failed for ${entityName} with ${errors.length} errors`
      );
    }

    return { isValid, errors, warnings };
  }

  /**
   * Generates a comprehensive validation report
   *
   * @param {Array} validationResults - Array of validation result objects
   * @returns {Object} Comprehensive validation report
   *
   * @example
   * const report = SeederValidator.generateValidationReport([
   *   schemaValidation,
   *   uniquenessValidation,
   *   crossReferenceValidation
   * ]);
   */
  static generateValidationReport(validationResults) {
    const allErrors = [];
    const allWarnings = [];
    let totalValidations = 0;
    let passedValidations = 0;

    validationResults.forEach((result) => {
      totalValidations++;
      if (result.isValid) {
        passedValidations++;
      }

      if (result.errors) {
        allErrors.push(...result.errors);
      }

      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    });

    const overallValid = allErrors.length === 0;

    console.log("\n🔍 VALIDATION REPORT");
    console.log("===================");
    console.log(`Total Validations: ${totalValidations}`);
    console.log(`Passed: ${passedValidations}`);
    console.log(`Failed: ${totalValidations - passedValidations}`);
    console.log(`Errors: ${allErrors.length}`);
    console.log(`Warnings: ${allWarnings.length}`);
    console.log(`Overall Status: ${overallValid ? "✅ PASSED" : "❌ FAILED"}`);

    if (allErrors.length > 0) {
      console.log("\n❌ ERRORS:");
      allErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (allWarnings.length > 0) {
      console.log("\n⚠️  WARNINGS:");
      allWarnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    console.log("===================\n");

    return {
      isValid: overallValid,
      totalValidations,
      passedValidations,
      failedValidations: totalValidations - passedValidations,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}

module.exports = SeederValidator;
