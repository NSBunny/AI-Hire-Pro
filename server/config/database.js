const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const os = require('os');
const path = require('path');

dotenv.config();

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    })
    : new Sequelize({
        dialect: 'sqlite',
        storage: path.join(os.tmpdir(), 'database.sqlite'),
        logging: false
    });

module.exports = sequelize;
