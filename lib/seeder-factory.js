"use strict";

const fs = require("fs");
const path = require("path");

/**
 * SeederFactory - A utility class for handling large-scale database seeding operations
 *
 * This factory provides methods to:
 * - Load data from JSON files
 * - Process data with custom transformations
 * - Insert data in batches for better performance
 * - Add automatic timestamps
 *
 * @class SeederFactory
 */
class SeederFactory {
    /**
     * Constructor - Initialize SeederFactory with required dependencies
     * @param {Object} queryInterface - Sequelize query interface
     * @param {Object} Sequelize - Sequelize instance
     */
    constructor(queryInterface, Sequelize) {
        this.queryInterface = queryInterface;
        this.Sequelize = Sequelize;

        // Initialize dependencies
        const SeederConfig = require("./seeder-config");
        const DataProcessor = require("./data-processor");

        this.seederConfig = new SeederConfig();
        this.dataProcessor = new DataProcessor();
    }

    /**
     * Loads data from a JSON file in the data directory
     *
     * @param {string} filename - Name of the JSON file (without extension)
     * @returns {Array} Array of objects for insertion
     * @throws {Error} If file cannot be read or parsed
     *
     * @example
     * const data = SeederFactory.loadData('users');
     */
    static loadData(filename) {
        try {
            const filePath = path.join(__dirname, "..", "data", `${filename}.json`);

            if (!fs.existsSync(filePath)) {
                throw new Error(`Data file not found: ${filePath}`);
            }

            const rawData = fs.readFileSync(filePath, "utf8");
            const parsedData = JSON.parse(rawData);

            if (!Array.isArray(parsedData)) {
                throw new Error(`Data file ${filename}.json must contain an array`);
            }

            console.log(`✓ Loaded ${parsedData.length} records from ${filename}.json`);
            return parsedData;
        } catch (error) {
            console.error(`✗ Error loading data from ${filename}:`, error.message);
            throw error;
        }
    }

    /**
     * Load data from JSON file
     * @param {string} dataFile - Path to data file
     * @returns {Promise<Object|Array>} Parsed JSON data
     * @private
     */
    async _loadDataFile(dataFile) {
        const fs = require("fs").promises;
        const path = require("path");

        try {
            const fullPath = path.resolve(dataFile);
            const fileContent = await fs.readFile(fullPath, "utf8");
            return JSON.parse(fileContent);
        } catch (error) {
            if (error.code === "ENOENT") {
                throw new Error(`Data file not found: ${dataFile}`);
            } else if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in data file: ${dataFile}`);
            }
            throw error;
        }
    }

    /**
     * Process data for any entity - ULTRA SIMPLE!
     * @param {string} entityType - Entity type (e.g., "Users")
     * @param {Object} options - Processing options
     * @param {Object} options.customConfig - Optional custom configuration
     * @param {boolean} options.filterValidFields - Filter only valid fields (default: true)
     * @returns {Promise<Array>} Processed data ready for insertion
     */
    async processData(entityType, options = {}) {
        const {customConfig = {}, filterValidFields = true} = options;

        try {
            // Get configuration (auto-discovery + custom overrides)
            const config = this.seederConfig.getEntityConfig(entityType, customConfig);

            console.log(`📋 Processing ${entityType}:`);
            console.log(`   📁 Data file: ${config.dataFile}`);
            console.log(`   🗃️  Table: ${config.tableName}`);
            console.log(`   📦 Batch size: ${config.batchSize}`);

            // Load and parse data
            const data = await this._loadDataFile(config.dataFile);

            if (!Array.isArray(data)) {
                throw new Error(`Data must be an array. Got: ${typeof data}`);
            }

            console.log(`   📊 Records to process: ${data.length}`);

            // Process each item generically
            const processedData = [];
            for (const item of data) {
                const processed = await this.dataProcessor.processGeneric(item, config);

                // Filter only valid fields if requested
                if (filterValidFields && config.validFields) {
                    const filtered = {};
                    for (const field of config.validFields) {
                        if (processed.hasOwnProperty(field)) {
                            filtered[field] = processed[field];
                        }
                    }
                    processedData.push(filtered);
                } else {
                    processedData.push(processed);
                }
            }

            console.log(`   ✅ Successfully processed ${processedData.length} records`);
            console.log(
                `   🏷️  Using fields: ${config.validFields ? config.validFields.join(", ") : "all"}`
            );

            return processedData;
        } catch (error) {
            console.error(`❌ Error processing ${entityType}:`, error.message);
            throw error;
        }
    }

    /**
     * Inserts data in batches for optimal performance with large datasets
     *
     * @param {Object} queryInterface - Sequelize query interface
     * @param {string} tableName - Target table name
     * @param {Array} data - Data array to insert
     * @param {number} batchSize - Size of each batch (default: 1000)
     * @param {Object} options - Additional Sequelize bulk insert options
     * @returns {Promise<void>}
     *
     * @example
     * await SeederFactory.bulkInsertInBatches(queryInterface, 'Users', userData, 500);
     */
    static async bulkInsertInBatches(
        queryInterface,
        tableName,
        data,
        batchSize = 1000,
        options = {}
    ) {
        if (!Array.isArray(data) || data.length === 0) {
            console.log(`⚠ No data to insert for ${tableName}`);
            return;
        }

        if (batchSize <= 0) {
            throw new Error("Batch size must be greater than 0");
        }

        const batches = [];
        for (let i = 0; i < data.length; i += batchSize) {
            batches.push(data.slice(i, i + batchSize));
        }

        console.log(
            `📦 Inserting ${data.length} records in ${batches.length} batches for ${tableName}`
        );
        console.log(`   Batch size: ${batchSize} records per batch`);

        const startTime = Date.now();

        try {
            for (let i = 0; i < batches.length; i++) {
                const batchStartTime = Date.now();

                console.log(
                    `   Processing batch ${i + 1}/${batches.length} (${batches[i].length} records)...`
                );

                await queryInterface.bulkInsert(tableName, batches[i], {
                    ignoreDuplicates: false,
                    ...options
                });

                const batchTime = Date.now() - batchStartTime;
                console.log(`   ✓ Batch ${i + 1} completed in ${batchTime}ms`);
            }

            const totalTime = Date.now() - startTime;
            console.log(
                `✓ Successfully inserted ${data.length} records into ${tableName} in ${totalTime}ms`
            );
        } catch (error) {
            console.error(`✗ Bulk insert failed for ${tableName}:`);
            console.error(`   Error message: ${error.message}`);
            console.error(`   Error name: ${error.name}`);
            if (error.sql) {
                console.error(`   SQL: ${error.sql}`);
            }
            if (error.parent) {
                console.error(`   Parent error: ${error.parent.message}`);
            }
            throw error;
        }
    }

    /**
     * Adds createdAt and updatedAt timestamps to data records
     *
     * @param {Array} data - Data array without timestamps
     * @param {Date|null} timestamp - Custom timestamp (defaults to current time)
     * @returns {Array} Data array with timestamps added
     *
     * @example
     * const dataWithTimestamps = SeederFactory.addTimestamps(processedData);
     */
    static addTimestamps(data, timestamp = null) {
        if (!Array.isArray(data)) {
            throw new Error("Data must be an array");
        }

        const now = timestamp || new Date();

        const dataWithTimestamps = data.map(item => ({
            ...item,
            createdAt: now,
            updatedAt: now
        }));

        console.log(`✓ Added timestamps to ${dataWithTimestamps.length} records`);
        return dataWithTimestamps;
    }

    /**
     * Validates that required fields exist in data
     *
     * @param {Array} data - Data to validate
     * @param {Array} requiredFields - Array of required field names
     * @returns {Object} Validation result with isValid boolean and errors array
     *
     * @example
     * const validation = SeederFactory.validateRequiredFields(data, ['name', 'email']);
     */
    static validateRequiredFields(data, requiredFields = []) {
        if (!Array.isArray(data)) {
            return {isValid: false, errors: ["Data must be an array"]};
        }

        if (!Array.isArray(requiredFields)) {
            return {isValid: false, errors: ["Required fields must be an array"]};
        }

        const errors = [];

        data.forEach((item, index) => {
            requiredFields.forEach(field => {
                if (
                    !item.hasOwnProperty(field) ||
                    item[field] === null ||
                    item[field] === undefined
                ) {
                    errors.push(`Record ${index}: Missing required field '${field}'`);
                }
            });
        });

        const isValid = errors.length === 0;

        if (isValid) {
            console.log(`✓ Validation passed for ${data.length} records`);
        } else {
            console.error(`✗ Validation failed with ${errors.length} errors`);
        }

        return {isValid, errors};
    }

    /**
     * Creates a summary report of the seeding operation
     *
     * @param {Object} operations - Object containing operation results
     * @returns {void}
     *
     * @example
     * SeederFactory.createSummaryReport({
     *   'Users': { inserted: 100, errors: 0 },
     *   'Roles': { inserted: 50, errors: 2 }
     * });
     */
    static createSummaryReport(operations) {
        console.log("\n📊 SEEDING SUMMARY REPORT");
        console.log("========================");

        let totalInserted = 0;
        let totalErrors = 0;

        Object.entries(operations).forEach(([tableName, result]) => {
            const inserted = result.inserted || 0;
            const errors = result.errors || 0;

            console.log(
                `${tableName.padEnd(30)} | Inserted: ${inserted.toString().padStart(6)} | Errors: ${errors.toString().padStart(3)}`
            );

            totalInserted += inserted;
            totalErrors += errors;
        });

        console.log("------------------------");
        console.log(
            `${"TOTAL".padEnd(30)} | Inserted: ${totalInserted.toString().padStart(6)} | Errors: ${totalErrors.toString().padStart(3)}`
        );
        console.log("========================\n");
    }

    /**
     * Insert processed data into database
     * @param {string} entityType - Entity type
     * @param {Array} processedData - Processed data ready for insertion
     * @param {Object} options - Insert options
     * @returns {Promise<void>}
     */
    async insertData(entityType, processedData, options = {}) {
        const {customConfig = {}} = options;
        const config = this.seederConfig.getEntityConfig(entityType, customConfig);

        try {
            console.log(`💾 Inserting ${processedData.length} ${entityType} records...`);

            // Add timestamps to all records
            const dataWithTimestamps = processedData.map(item => ({
                ...item,
                createdAt: new Date(),
                updatedAt: new Date()
            }));

            // Insert in batches for better performance
            const batchSize = config.batchSize || 1000;
            let insertedCount = 0;

            for (let i = 0; i < dataWithTimestamps.length; i += batchSize) {
                const batch = dataWithTimestamps.slice(i, i + batchSize);
                await this.queryInterface.bulkInsert(config.tableName, batch);
                insertedCount += batch.length;
                console.log(`   📦 Inserted batch: ${insertedCount}/${dataWithTimestamps.length}`);
            }

            console.log(`✅ Successfully inserted ${insertedCount} ${entityType} records`);
        } catch (error) {
            console.error(`❌ Failed to insert ${entityType}:`, error.message);
            throw error;
        }
    }

    /**
     * Remove seeded data from database
     * @param {string} entityType - Entity type
     * @param {Object} options - Remove options
     * @returns {Promise<void>}
     */
    async removeData(entityType, options = {}) {
        const {customConfig = {}} = options;
        const config = this.seederConfig.getEntityConfig(entityType, customConfig);

        try {
            console.log(`🗑️  Removing ${entityType} records...`);

            // If we have unique fields and data file, do targeted removal
            if (config.uniqueFields && config.uniqueFields.length > 0) {
                try {
                    const data = await this._loadDataFile(config.dataFile);

                    if (Array.isArray(data) && data.length > 0) {
                        // Build conditions for unique fields
                        const conditions = [];
                        for (const field of config.uniqueFields) {
                            const values = data.map(item => item[field]).filter(val => val != null);
                            if (values.length > 0) {
                                conditions.push({
                                    [field]: {[this.Sequelize.Op.in]: values}
                                });
                            }
                        }

                        if (conditions.length > 0) {
                            await this.queryInterface.bulkDelete(config.tableName, {
                                [this.Sequelize.Op.or]: conditions
                            });
                            console.log(`✅ Removed ${entityType} records using unique fields`);
                            return;
                        }
                    }
                } catch (fileError) {
                    console.log(
                        `⚠️  Could not load data file for targeted removal: ${fileError.message}`
                    );
                }
            }

            // Fallback: remove all records from table
            await this.queryInterface.bulkDelete(config.tableName, null, {});
            console.log(`✅ Removed all ${entityType} records from ${config.tableName}`);
        } catch (error) {
            console.error(`❌ Failed to remove ${entityType}:`, error.message);
            throw error;
        }
    }
}

module.exports = SeederFactory;
