"use strict";

/**
 * SEEDER CONFIGURATION FACTORY
 *
 * ZERO CONFIGURATION REQUIRED!
 * Just create your JSON file and run the seeder - everything else is automatic.
 *
 * Auto-discovers:
 * - Table names from Sequelize models
 * - Required fields from database schema
 * - Data processors (generic for all)
 * - Validation rules
 */

const fs = require("fs");
const path = require("path");

class SeederConfig {
    constructor() {
        this.modelsPath = path.join(__dirname, "../../models");
        this.dataPath = path.join(__dirname, "../data");
        this.cache = new Map();
    }

    /**
     * Get configuration for any entity - FULLY AUTOMATIC
     * @param {string} entityType - Entity type (e.g., "Users")
     * @param {Object} customConfig - Optional custom configuration from seeder
     * @returns {Object} Complete configuration
     */
    getEntityConfig(entityType, customConfig = {}) {
        const cacheKey = `${entityType}_${JSON.stringify(customConfig)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const autoConfig = {
            entityType,
            tableName: this._autoDiscoverTableName(entityType),
            dataFile: this._getDataFileName(entityType),
            processor: "processGeneric", // Always use generic - no specific processors needed
            batchSize: 1000,
            validFields: this._autoDiscoverValidFields(entityType),
            uniqueFields: this._autoDiscoverUniqueFields(entityType),
            requiredFields: this._autoDiscoverRequiredFields(entityType)
        };

        // Merge with custom configuration (custom config takes precedence)
        const config = {
            ...autoConfig,
            ...customConfig
        };

        this.cache.set(cacheKey, config);
        return config;
    }

    /**
     * Auto-discover table name from model files
     * @private
     */
    _autoDiscoverTableName(entityType) {
        // Simple mapping for common cases
        const commonMappings = {
            Users: "People",
            User: "People"
        };

        if (commonMappings[entityType]) {
            return commonMappings[entityType];
        }

        // Try to find model file and extract table name
        const modelFile = this._findModelFile(entityType);
        if (modelFile) {
            try {
                const modelContent = fs.readFileSync(modelFile, "utf8");

                // Look for tableName in options
                const tableNameMatch = modelContent.match(/tableName:\s*['"`]([^'"`]+)['"`]/);
                if (tableNameMatch) {
                    return tableNameMatch[1];
                }

                // Look for modelName and pluralize
                const modelNameMatch = modelContent.match(/modelName:\s*['"`]([^'"`]+)['"`]/);
                if (modelNameMatch) {
                    return this._pluralize(modelNameMatch[1]);
                }
            } catch (error) {
                // Ignore errors, use fallback
            }
        }

        // Fallback: use entity type as-is
        return entityType;
    }

    /**
     * Auto-discover valid fields from model
     * @private
     */
    _autoDiscoverValidFields(entityType) {
        const modelFile = this._findModelFile(entityType);
        if (!modelFile) {
            return []; // Let database handle validation
        }

        try {
            const modelContent = fs.readFileSync(modelFile, "utf8");
            const fields = [];

            // Extract field definitions using regex
            const fieldMatches = modelContent.match(/(\w+):\s*DataTypes\.\w+/g);
            if (fieldMatches) {
                fieldMatches.forEach(match => {
                    const fieldName = match.split(":")[0].trim();
                    if (!["id", "createdAt", "updatedAt"].includes(fieldName)) {
                        fields.push(fieldName);
                    }
                });
            }

            return fields;
        } catch (error) {
            return []; // Let database handle validation
        }
    }

    /**
     * Auto-discover unique fields (common patterns)
     * @private
     */
    _autoDiscoverUniqueFields(entityType) {
        const commonUniqueFields = {
            Users: ["userName", "email"],
            User: ["userName", "email"]
        };

        return commonUniqueFields[entityType] || ["name"];
    }

    /**
     * Auto-discover required fields from model
     * @private
     */
    _autoDiscoverRequiredFields(entityType) {
        const modelFile = this._findModelFile(entityType);
        if (!modelFile) {
            return [];
        }

        try {
            const modelContent = fs.readFileSync(modelFile, "utf8");
            const requiredFields = [];

            // Look for allowNull: false patterns
            const lines = modelContent.split("\n");
            let currentField = null;

            lines.forEach(line => {
                const fieldMatch = line.match(/(\w+):\s*{/);
                if (fieldMatch) {
                    currentField = fieldMatch[1];
                }

                if (currentField && line.includes("allowNull: false")) {
                    if (!["id", "createdAt", "updatedAt"].includes(currentField)) {
                        requiredFields.push(currentField);
                    }
                    currentField = null;
                }

                // Simple field definitions (DataTypes.STRING, etc.)
                const simpleFieldMatch = line.match(/(\w+):\s*DataTypes\.\w+(?:,|$)/);
                if (simpleFieldMatch) {
                    // These are typically required by default
                    const fieldName = simpleFieldMatch[1];
                    if (!["id", "createdAt", "updatedAt"].includes(fieldName)) {
                        // Don't add to required - let database decide
                    }
                }
            });

            return requiredFields;
        } catch (error) {
            return [];
        }
    }

    /**
     * Find model file for entity
     * @private
     */
    _findModelFile(entityType) {
        const possibleNames = [
            entityType.toLowerCase(),
            this._singularize(entityType).toLowerCase(),
            this._camelCase(entityType.toLowerCase()),
            this._camelCase(this._singularize(entityType).toLowerCase())
        ];

        // Special cases
        if (entityType === "Users" || entityType === "User") {
            possibleNames.unshift("person");
        }

        for (const name of possibleNames) {
            const filePath = path.join(this.modelsPath, `${name}.js`);
            if (fs.existsSync(filePath)) {
                return filePath;
            }
        }

        return null;
    }

    /**
     * Convert entity type to data file name
     * @private
     */
    _getDataFileName(entityType) {
        const filename = entityType.toLowerCase() + ".json";
        return path.join(this.dataPath, filename);
    }

    /**
     * Simple pluralization
     * @private
     */
    _pluralize(word) {
        if (word.endsWith("y")) {
            return word.slice(0, -1) + "ies";
        }
        if (word.endsWith("s")) {
            return word + "es";
        }
        return word + "s";
    }

    /**
     * Simple singularization
     * @private
     */
    _singularize(word) {
        if (word.endsWith("ies")) {
            return word.slice(0, -3) + "y";
        }
        if (word.endsWith("s")) {
            return word.slice(0, -1);
        }
        return word;
    }

    /**
     * Convert to camelCase
     * @private
     */
    _camelCase(str) {
        return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
    }

    /**
     * Clear configuration cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export class for instantiation
module.exports = SeederConfig;
