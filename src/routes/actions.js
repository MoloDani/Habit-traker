const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.post(
    '/:habitId/actions',
    requireAuth,
    [
        body('completed_at').optional().isISO8601().withMessage('completed_at must be a valid date'),
        body('value').optional().isNumeric()
    ],
    async (req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty())
            return res.status(400).json({ errors: errors.array() });

        const { habitId } = req.params;
        const { completed_at, value } = req.body;

        try {
            const [habits] = await db.query(
                'SELECT id FROM habits WHERE id = ? AND user_id = ?',
                [habitId, req.userId]
            )

            if(habits.length === 0)
                return res.status(404).json({ error: 'Habit not found' });

            const completedAtValue = completed_at ? new Date(completed_at) : new Date();
            if(completed_at > new Date())
                return res.status(400).json({ error: 'Can not update in the future' });


            await db.query(
            'INSERT INTO actions (id, habit_id, completed_at, value) VALUES (UUID(), ?, ?, ?)',
            [habitId, completedAtValue, value]
            );

            return res.json({ message: 'Action added' });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
);

router.get(
    '/:habitId/actions',
    requireAuth,
    [ query('date').optional().isISO8601() ],
    async (req, res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty())
            return res.json(500).json({ errors: errors.array() });

        const { habitId } = req.params;
        const { date } = req.body;
            
        try {
            const [habits] = await db.query(
                'SELECT id FROM habits WHERE id = ? AND user_id = ?',
                [habitId, req.userId]
            );

            if(habits.length === 0)
                return res.status(404).json({ error: 'Habit not found' });

            if(date){
                const [actions] = await db.query(
                    'SELECT id, completed_at, value FROM actions WHERE habit_id = ? AND completed_at = ?',
                    [habitId, date]
                );

                return res.json(actions.length);
            }

            const [actions] = await db.query(
                'SELECT id, value FROM actions WHERE habit_id = ?',
                [habitId]
            );

            return res.json(actions);
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
);

router.delete(
    '/:habitId/actions/:actionId',
    requireAuth,
    async (req, res) => {
        const { habitId, actionId } = req.params;

        try {
            const [habits] = await db.query(
                'SELECT id FROM habits WHERE id = ? AND user_id = ?',
                [habitId, req.userId]
            );

            if(habits.length === 0)
                return res.status(404).json({ error: 'Habit not found' });

            const [result] = await db.query(
                'DELETE FROM actions WHERE id = ? AND habit_id = ?',
                [actionId, habitId]
            );

            if(result.length === 0)
                return res.status(404).json({ error: 'Action not found' });

            return res.json({ message: 'Action removed' });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
)

module.exports = router;