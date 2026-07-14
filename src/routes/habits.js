const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post(
    '/',
    requireAuth,
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('color').notEmpty(),
        body('icon').notEmpty(),
        body('goal').notEmpty().withMessage('Goal must be an object'),
        body('completion_type').isIn(['boolean', 'quantity'])
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty)
            return res.status(400).json({ errors: errors.array });

        const { name, color, icon, goal, completion_type, reminder_time } = req.body;

        try {
            await db.query(
                `INSERT INTO habits (id, user_id, name, color, icon, goal, completion_type, reminder_time) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
                [req.userId, name, color, icon, JSON.stringify(goal), completion_type, reminder_time || null]
            );

            return res.status(201).json({ message: 'Habit created' });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
)

router.get(
    '/',
    requireAuth,
    async (req, res) => {
        try {
            const [habits] = await db.query(
                'SELECT * FROM habits WHERE user_id = ? AND state = "active" ORDER BY created_at DESC',
                [req.userId]
            );
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
);

router.post(
    '/:id',
    requireAuth,
    async (req, res) => {
        const { id } = req.params;
        const { name, color, icon, goal, completion_type, reminder_time, state } = req.body;

        try {
            const [existing] = await db.query(
                'SELECT * FROM habits WHERE id = ? AND user_id = ?',
                [id, req.userId]
            )

            if(existing.length === 0)
                return res.status(404).json({ error: 'Habit not found' });

            await db.query(
                `UPDATE habits SET
                    name = COALESCE(?, name),
                    color = COALESCE(?, color),
                    icon = COALESCE(?, icon),
                    goal = COALESCE(?, goal),
                    completion_type = COALESCE(?, completion_type),
                    reminder_time = COALESCE(?, reminder_time),
                    state = COALESCE(?, state)
                WHERE id = ?`,
                [
                    name || null,
                    color || null,
                    icon || null,
                    goal ? JSON.stringify(goal) : null,
                    completion_type || null,
                    reminder_time || null,
                    state || null,
                    id
                ]
            );

            return res.status(201).json({ message: 'Habit updated' })
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
);

router.get(
    '/:id',
    requireAuth,
    async (req, res) => {
        const { id } = req.params;

        try {
            const [existing] = await db.query(
                'SELECT * FROM habits WHERE id = ? AND user_id = ?',
                [id, req.userId]
            )

            if(existing.length === 0)
                return res.status(404).json({ error: 'Habit not found' });

            await db.query('UPDATE habits SET state = "deleted" WHERE id = ?', [id]);

            return res.status(201).json({ message:'Habit deleted' });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error:'Something went wrong' });
        }
    }
);

module.exports = router;