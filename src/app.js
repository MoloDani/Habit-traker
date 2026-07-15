const express = require('express');
const app = express();
const db = require('./config/db')
const authRoutes = require('./routes/auth');
const habitRouts = require('./routes/habits');
const actionRouts = require('./routes/actions');
const requireAuth = require('./middleware/auth');

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
})

app.get('/health/db', async (req, res) =>{
    try{
        await db.query('SELECT 1');
        res.json({ db: 'connected' });
    } catch (error) {
        res.status(500).json({ db: 'error', message: error.message});
    }
})

app.use('/auth', authRoutes);

app.use('/habits', habitRouts);

app.use('/habits', actionRouts);

app.get('/me', requireAuth, (req, res) => {
    res.json({ userId: req.userId });
})

module.exports = app;