const tripsModel = require("../model/expensesModel");


//get all expenses of a trip while ensuring user is in that trip
async function listExpenses(req, res) {
  try {
    const userId = req.user.id;
    tripId = req.params.tripId;           // <-- from URL
    console.log(tripId)
    const expenses = await tripsModel.getAllExpenses(tripId,userId);
    return res.status(200).json(expenses);   // <-- return expenses
  } catch (err) {
    return res.status(500).json({ error: err.message ?? String(err) });
  }
}

async function addExpense(req, res) {
    try {
        const userId = req.user.id;
        console.log(req.user.id)
        tripId = req.params.tripId;           // <-- from URL
        console.log(tripId)
        const title = req.body.title
        const currency = req.body.currency
        const amount_cents = req.body.amount_cents
        const notes = req.body.notes
        const category = req.body.category
        const expenses = await tripsModel.addExpense(tripId,userId,title,currency,amount_cents,notes,category);
    return res.status(200).json(expenses);   // <-- return expenses
    } catch (err) {
        return res.status(500).json({ error: err.message ?? String(err) });
    }
}

async function deleteExpense(req, res){
    const expenseId = req.params.expenseId
    try{
        const deleteExpense = await tripsModel.deleteExpense(expenseId)
        return res.status(200).json(deleteExpense)
    }
    catch (err){
        return res.status(500).json({ error: err.message ?? String(err) });
    }
}

module.exports = {listExpenses, addExpense, deleteExpense};
