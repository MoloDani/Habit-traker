const completionsPerDay = require('./completions');

function beginningOfType(date, type){
    const d = new Date(date);
    if(type === "daily"){
        d.setDate(d.getDate() - 1);
        return d;
    }
    if(type === "weekly"){
        d.setDate(d.getDate() - d.getUTCDay());
        if(date === d)
            d.setDate(beginningOfType(d.setDate(d.getDate() - 1), type));

        return d;
    }
    if(type === "monthly"){
        d.setDate(d.getDate() - d.getUTCDate());
        if(date === d)
            d.setDate(beginningOfType(d.setDate(d.getDate() - 1), type));

        return d;
    }

    return new Error("Invalid goal type");
}

async function noOfCompletions(habit_id, date, type, max_completions){
    const lastD = beginningOfType(date, type);
    let auxD = new Date(date);
    let goodDays = 0;

    while(auxD > lastD){
        if(await completionsPerDay(habit_id, auxD) === max_completions){
            goodDays++;
            console.log(auxD);
        }

        auxD.setDate(auxD.getDate() - 1);
    }

    return goodDays;
}


module.exports = { beginningOfType, noOfCompletions };