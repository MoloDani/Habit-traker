const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

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

module.exports = router;