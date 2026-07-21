const db = require('../config/db');

async function completionsPerDay(habitId, date) {
    const [habits] = await db.query(
        'SELECT id FROM habits WHERE id = ?',
        [habitId]
    );

    if(habits.length === 0)
        return new Error("Habit not found");

    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const [actions] = await db.query(
        'SELECT id FROM actions WHERE habit_id = ? AND completed_at BETWEEN ? AND ?',
        [habitId, startOfDay, endOfDay]
    );

    return actions.length;
}

module.exports = completionsPerDay;