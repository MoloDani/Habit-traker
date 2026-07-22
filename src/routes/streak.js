const express = require('express');
const { body, validationResult } = require('express-validator');
const requireAuth = require('../middleware/auth');
const { beginningOfType, noOfCompletions } = require('../utils/streaks');
const db = require('../config/db');

const router = express.Router();

router.get(
    '/:habitId/streak',
    requireAuth,
    async (req, res) => {
        const { habitId } = req.params;
        let ans = 0, count = 0;
        let d = new Date();

        try {
            const [habits] = await db.query(
                'SELECT id, goal_type, completions_per_day, target FROM habits WHERE id = ?',
                [habitId]
            );

            if(habits.length === 0)
                return res.status(404).json({ error: 'Habit not found' });

            count = await noOfCompletions(habitId, d, habits[0].goal_type, habits[0].completions_per_day);
            d = beginningOfType(d, habits[0].goal_type);

            do{
                ans += count;
                count = await noOfCompletions(habitId, d, habits[0].goal_type, habits[0].completions_per_day);
                d = beginningOfType(d, habits[0].goal_type);
            }while(count >= habits[0].target);

            return await res.json({ streak: ans });
        } catch (err) {
            console.log(err);
            return res.status(500).json({ error: 'Something went wrong' });
        }
    }
);

module.exports = router;