const express = require('express');
const app = express();
const db = require('./config/db')

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
})

app.get('/health/db', async (req, res) =>{
    try{
        await db.query('SELECT 1');
        res.json({ db: 'connected' });
    } catch {
        res.status(500).json({ db: 'error', message: error.message});
    }
})

module.exports = app;