# Sequelize Seeder Factory 🚀

Ultra-simple JSON-based seeder factory for Sequelize. **Zero configuration required!**

## 🚀 Installation

```bash
npm install sequelize-seeder-factory
```

## 📖 Quick Start

### 1. Install the package
```bash
npm install sequelize-seeder-factory
```

### 2. Create your data file
Create `data/users.json`:
```json
[
    {
        "userName": "john.doe",
        "name": "John Doe",
        "email": "john.doe@example.com"
    }
]
```

### 3. Create your seeder
Create `seeders/20250101000000-users.js`:
```javascript
const { SeederFactory } = require("sequelize-seeder-factory");

const ENTITY_NAME = "Users";
const CUSTOM_CONFIG = {
    tableName: "People",
    batchSize: 100,
    uniqueFields: ["userName", "email"]
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const factory = new SeederFactory(queryInterface, Sequelize);
        const processedData = await factory.processData(ENTITY_NAME, {
            customConfig: CUSTOM_CONFIG
        });
        await factory.insertData(ENTITY_NAME, processedData, {
            customConfig: CUSTOM_CONFIG
        });
    },
    
    down: async (queryInterface, Sequelize) => {
        const factory = new SeederFactory(queryInterface, Sequelize);
        await factory.removeData(ENTITY_NAME, {
            customConfig: CUSTOM_CONFIG
        });
    }
};
```

### 4. Run it!
```bash
npx sequelize-cli db:seed --seed 20250101000000-users.js
```

## 🔧 Configuration Options

All configuration is done in the seeder file using the `CUSTOM_CONFIG` object:

```javascript
const CUSTOM_CONFIG = {
    tableName: "People", // Override auto-discovered table name
    dataFile: "data/users.json", // Override default data file path
    batchSize: 100, // Override default batch size (1000)
    uniqueFields: ["userName", "email"] // Fields to use for duplicate detection
};
```

## 📋 Configuration Reference

| Option         | Description                   | Default              | Example                 |
| -------------- | ----------------------------- | -------------------- | ----------------------- |
| `tableName`    | Database table name           | Auto-discovered      | `"People"`              |
| `dataFile`     | Path to JSON data file        | `data/{entity}.json` | `"data/custom.json"`    |
| `batchSize`    | Records per batch insert      | `1000`               | `100`                   |
| `uniqueFields` | Fields for rollback targeting | Auto-discovered      | `["email", "userName"]` |

## 🚀 What Happens Automatically

1. **🔍 Discovers table name** from your Sequelize models
2. **🧹 Cleans your data** - removes invalid fields automatically
3. **⏰ Adds timestamps** (`createdAt`, `updatedAt`)
4. **📦 Batches inserts** for optimal performance
5. **🎯 Smart rollbacks** using unique fields
6. **📊 Performance metrics** and helpful logging
7. **🛡️ Error handling** with clear messages

## 📁 File Structure

```
seeders/
├── data/
│   ├── users.json          ← Your data files (simple arrays)
│   ├── products.json
│   └── categories.json
├── templates/
│   └── seeder-template.js  ← Copy this template
├── 20250101000000-users.js ← Your actual seeders
└── factories/              ← Don't touch these!
    ├── seeder-factory.js
    ├── seeder-config.js
    └── data-processor.js
```

## 🎨 Examples

### Simple Users

```json
[
    {
        "userName": "admin",
        "name": "Administrator",
        "email": "admin@company.com",
        "entityType": "admin"
    }
]
```

### Products

```json
[
    {
        "sku": "PROD-001",
        "name": "Awesome Product",
        "price": 99.99,
        "category": "electronics"
    }
]
```

### Categories

```json
[
    {"name": "Electronics", "slug": "electronics"},
    {"name": "Books", "slug": "books"},
    {"name": "Clothing", "slug": "clothing"}
]
```

## 🎯 Entity Naming Conventions

| Entity Name  | Data File              | Table Name (Auto)               |
| ------------ | ---------------------- | ------------------------------- |
| `Users`      | `data/users.json`      | `Users` (or `People` if mapped) |
| `Products`   | `data/products.json`   | `Products`                      |
| `Categories` | `data/categories.json` | `Categories`                    |
| `WorkOrders` | `data/workorders.json` | `WorkOrders`                    |

## 🔄 Advanced Usage

### Multiple Entities in One Seeder

```javascript
const ENTITY_NAME = "Users";
const CUSTOM_CONFIG = {
    dataFile: "data/all-entities.json" // Contains users array
};
```

### Custom Table Mapping

```javascript
const CUSTOM_CONFIG = {
    tableName: "legacy_users_table"
};
```

### Performance Tuning

```javascript
const CUSTOM_CONFIG = {
    batchSize: 50 // Smaller batches for large records
};
```

## 🚨 Error Messages You Might See

- **"Data file not found"** → Create your JSON file in `data/` folder
- **"Invalid JSON"** → Check your JSON syntax
- **"Table not found"** → Verify your model exists
- **"Field validation failed"** → Check your data matches model schema

## 📊 What You'll See When Running

```
🚀 Starting Users seeder...
📋 Processing Users:
   📁 Data file: data/users.json
   🗃️  Table: People
   📦 Batch size: 100
   📊 Records to process: 5
   ✅ Successfully processed 5 records
   🏷️  Using fields: userName, name, phone, email, entityId, entityType
💾 Inserting 5 Users records...
   📦 Inserted batch: 5/5
✅ Successfully inserted 5 Users records
✅ Users seeder completed successfully!
```

## 🎉 Simple Configuration!

- ✅ All configuration in the seeder file
- ✅ Simple JSON arrays for data
- ✅ No complex nested objects
- ✅ Clear and maintainable
- ❌ No configuration in JSON files
- ❌ No complex validation schemas
- ❌ No manual field mappings

## 🏗️ Migration from Complex Systems

If you're coming from a complex seeder setup:

1. **Move** configuration from JSON to seeder files
2. **Simplify** your JSON data to simple arrays
3. **Copy** the template for each entity
4. **Configure** in the `CUSTOM_CONFIG` object
5. **Run** and enjoy! 🎉

---

**That's it!** Create seeders in seconds, not hours. 🚀
