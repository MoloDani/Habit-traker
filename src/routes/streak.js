const express = require('express');
const { body, validationResult } = require('express-validator');
const requireAuth = require('../middleware/auth');
const noOfCompletions = require('../utils/streaks');
const db = require('../config/db');

const router = express.Router();

router.get(
    '/:habitId/streak',
    requireAuth,
    async (req, res) => {
        const { habitId } = req.params;

        try {
            const [habits] = await db.query(
                'SELECT id, goal_type, completions_per_day, target FROM habits WHERE id = ?',
                [habitId]
            );

            if(habits.length === 0)
                return res.status(404).json({ error: 'Habit not found' });

            return await noOfCompletions(habitId, new Date(), habits[0].goal_type, habits[0].completions_per_day);
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
);

module.exports = router;