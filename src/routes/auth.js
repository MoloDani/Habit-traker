const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ref } = require('process');
const { error } = require('console');

const router = express.Router();

router.post(
    '/signup',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 8 }).withMessage( 'Password must be at least 8 characters.' )
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            return res.status(500).json({ errors: errors.array() });

        const { email, password } = req.body;

        try{
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if(existing.length > 0)
                return res.status(409).json({ error: 'Email is aleardy in use' });
            
            const hash_password = await bcrypt.hash(password, 12);

            await db.query(
                'INSERT INTO users (id, email, password_hash) VALUES (UUID(), ?, ?)',
                [email, hash_password]
            )

            //TODO: trigger email verification here!
            return res.status(201).json({ message: 'Account created. Please verify your email' });
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: 'Something went wrong' });
        }
    }
);

router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty())
            res.status(500).json({ errors: errors.array() });
        
        const { email, password } = req.body;

        try{
            const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if(users.length === 0)
                return res.status(401).json({ message: 'Invalid email or passowrd '});

            const user = users[0];
            const valid_password = bcrypt.compare(password, user.password_hash);
            if(!valid_password)
                return res.status(401).json({ message: 'Invalid email or password' });

            const access_token = jwt.sign(
                { userId: user.id},
                process.env.JWT_SECRET,
                { expiresIn: '15m'}
            );

            const refresh_token = crypto.randomBytes(40).toString('hex');
            const refresh_token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');

            const expires_at = new Date();
            expires_at.setDate(expires_at.getDate() + 30);

            await db.query(
                'INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (UUID(), ?, ?, ?)',
                [user.id, refresh_token_hash, expires_at]
            );
            
            res.json({
                access_token,
                refresh_token,
                expiresIn: 900
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Something went wrong' });
        }
    }
);

router.post(
    '/refresh',
    async (req, res) =>{
        const { refresh_token } = req.body;

        if(!refresh_token)
            return res.status(400).json({ error: 'Refresh token required' });

        const token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');

        try {
            const [sessions] = await db.query(
                'SELECT * FROM sessions WHERE token_hash = ? AND revoked_at IS NULL',
                [token_hash]
            );

            if(sessions.length === 0)
                return res.status(401).json({ error: 'Invalid refresh token' });

            const session = sessions[0];

            if(new Date(session.expires_at) < new Date())
                return res.status(401).json({ error: 'Refresh token expired, please log in again' });

            const new_expires_at = new Date();
            new_expires_at.setDate(new_expires_at.getDate() + 30);

            await db.query(
                'UPDATE sessions SET expires_at = ? WHERE id = ?',
                [new_expires_at, session.id]
            );

            const access_token = jwt.sign(
                { userId: session.user_id },
                process.env.JWT_SECRET,
                { expiresIn: 900 }
            );

            return res.json({
                access_token,
                expiresIn: 900
            });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
);

router.post(
    '/logout',
    async (res, req) => {
        const { refresh_token } = req.body;

        if(!refresh_token)
            return res.status(400).json({ error: 'Refresh token required' });

        const token_hash = crypto.createHash('sha256').update(refresh_token).digest('hex');

        try {
            await db.query(
                'UPDATE sessions SET revoked_at = NOW() WHERE token_hash = ?',
                [token_hash]
            );

            return res.json({ message: 'Logged out' });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
);

module.exports = router;