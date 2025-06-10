"use strict";

/**
 * TEST USERS SEEDER
 *
 * ULTRA SIMPLE - Just works!
 * 1. Loads users.json
 * 2. Processes the data automatically
 * 3. Inserts into the correct table
 *
 * No configuration needed, no complex setup.
 * Just run: npx sequelize-cli db:seed --seed 20250606160000-test-users.js
 */

const SeederFactory = require("./factories/seeder-factory");

// 🎯 Entity configuration
const ENTITY_NAME = "Users";

// 🔧 Custom configuration
const CUSTOM_CONFIG = {
    tableName: "People",
    batchSize: 100,
    uniqueFields: ["userName", "email"]
};

module.exports = {
    /**
     * Insert test users
     */
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

    /**
     * Remove test users
     */
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
