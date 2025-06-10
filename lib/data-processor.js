"use strict";

/**
 * DATA PROCESSOR
 *
 * ULTRA SIMPLIFIED - ONE PROCESSOR FOR EVERYTHING!
 * No more specific processors, no complex logic.
 * Just clean the data and let the database handle the rest.
 */

class DataProcessor {
  /**
   * Instance method that calls the static method
   * @param {Object} item - Raw data item
   * @param {Object} config - Processing configuration
   * @returns {Object} Processed item
   */
  processGeneric(item, config = {}) {
    return DataProcessor.processGeneric(item, 0, config);
  }

  /**
   * Generic processor that handles ALL entities automatically
   * This is the ONLY processor you need!
   *
   * @param {Object} item - Raw data item
   * @param {number} index - Item index (for error reporting)
   * @param {Object} options - Processing options (optional)
   * @returns {Object} Processed item
   */
  static processGeneric(item, index = 0) {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid item at index ${index}: must be an object`);
    }

    const processed = {};

    // Process each field in the item
    Object.entries(item).forEach(([key, value]) => {
      // Skip null/undefined values
      if (value === null || value === undefined) {
        return;
      }

      // Clean and process the value based on its type
      if (typeof value === "string") {
        // Clean strings: trim whitespace
        const cleaned = value.trim();
        if (cleaned.length > 0) {
          processed[key] = cleaned;
        }
      } else if (typeof value === "number") {
        // Keep numbers as-is
        processed[key] = value;
      } else if (typeof value === "boolean") {
        // Keep booleans as-is
        processed[key] = value;
      } else if (value instanceof Date) {
        // Keep dates as-is
        processed[key] = value;
      } else if (Array.isArray(value)) {
        // Keep arrays as-is
        processed[key] = value;
      } else if (typeof value === "object") {
        // Keep objects as-is (for JSON fields)
        processed[key] = value;
      } else {
        // Convert everything else to string
        processed[key] = String(value);
      }
    });

    return processed;
  }
}

module.exports = DataProcessor;
