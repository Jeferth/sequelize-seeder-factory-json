"use strict";

/**
 * SEEDER TEMPLATE - ULTRA SIMPLE!
 *
 * Copy this file and change just 2 things:
 * 1. The filename: YYYYMMDDHHMMSS-your-description.js
 * 2. The ENTITY_NAME below
 * 3. Optionally: Configure CUSTOM_CONFIG if needed
 *
 * That's it! Everything else is automatic.
 *
 * Usage:
 * 1. Copy this file: cp seeder-template.js 20250101000000-my-data.js
 * 2. Change ENTITY_NAME to your entity (e.g., "Users", "Products", "Categories")
 * 3. Create your JSON file: data/{entity-name}.json (e.g., data/users.json) - simple array format
 * 4. Configure CUSTOM_CONFIG if you need custom settings
 * 5. Run: npx sequelize-cli db:seed --seed 20250101000000-my-data.js
 */

const { SeederFactory } = require("sequelize-seeder-factory-json");

// 🎯 CHANGE THIS LINE - Set your entity name
const ENTITY_NAME = "Users"; // Examples: "Users", "Customers", "Products", "Orders"

// 🔧 CONFIGURE HERE - All configuration in one place
const CUSTOM_CONFIG = {
    tableName: "People", // Override auto-discovered table name
    dataFile: "data/users.json", // Override default data file path
    batchSize: 100, // Override default batch size (1000)
    uniqueFields: ["userName", "email"] // Fields to use for duplicate detection
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            console.log(`🚀 Starting ${ENTITY_NAME} seeder...`);

            // Create factory instance
            const factory = new SeederFactory(queryInterface, Sequelize);

            // Process data with custom configuration
            const processedData = await factory.processData(ENTITY_NAME, {
                customConfig: CUSTOM_CONFIG,
                filterValidFields: true
            });

            if (processedData.length === 0) {
                console.log(`⚠️  No ${ENTITY_NAME} data to seed`);
                return;
            }

            // Insert data with custom configuration
            await factory.insertData(ENTITY_NAME, processedData, {customConfig: CUSTOM_CONFIG});

            console.log(`✅ ${ENTITY_NAME} seeder completed successfully!`);
        } catch (error) {
            console.error(`❌ ${ENTITY_NAME} seeder failed:`, error.message);
            throw error;
        }
    },

    down: async (queryInterface, Sequelize) => {
        try {
            console.log(`🗑️  Rolling back ${ENTITY_NAME} seeder...`);

            // Create factory instance
            const factory = new SeederFactory(queryInterface, Sequelize);

            // Remove seeded data with custom configuration
            await factory.removeData(ENTITY_NAME, {customConfig: CUSTOM_CONFIG});

            console.log(`✅ ${ENTITY_NAME} rollback completed!`);
        } catch (error) {
            console.error(`❌ ${ENTITY_NAME} rollback failed:`, error.message);
            throw error;
        }
    }
};
