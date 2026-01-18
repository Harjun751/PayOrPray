const expensesModel = require("../model/expensesModel");


//get all expenses of a trip while ensuring user is in that trip
async function listExpenses(req, res) {
  try {
    const userId = req.user.id;
    tripId = req.params.tripId;           // <-- from URL
    console.log(tripId)
    const expenses = await expensesModel.getAllExpenses(tripId,userId);
    return res.status(200).json(expenses);   // <-- return expenses
  } catch (err) {
    return res.status(500).json({ error: err.message ?? String(err) });
  }
}

async function addExpense(req, res) {
    try {
        const userId = req.user.id;
        const tripId = req.params.tripId;
        const { title, currency, amount_cents, notes, category, splits, payer } = req.body;

        const expense = await expensesModel.addExpense(
            tripId,
            payer,
            title,
            currency,
            amount_cents,
            notes,
            category,
            splits
        );

        return res.status(201).json(expense);
    } catch (err) {
        if (err.message === "Expense creation failed") {
            return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: err.message ?? String(err) });
    }
}

async function deleteExpense(req, res){
    const expenseId = req.params.expenseId
    try{
        const deleteExpense = await expensesModel.deleteExpense(expenseId)
        return res.status(200).json(deleteExpense)
    }
    catch (err){
        return res.status(500).json({ error: err.message ?? String(err) });
    }
}

async function updateExpense(req, res) {
    try {
        console.log(req.body)
        console.log(req.params)
        const expenseId = req.params.expensesId;
        const title = req.body.title;
        const currency = req.body.currency;
        const amount_cents = req.body.amount_cents;
        const notes = req.body.notes;
        const category = req.body.category;
        const payer_id = req.body.payer_id;
        const splits = req.body.splits

        // Validate required fields
        if (!title || !currency || amount_cents === undefined) {
            return res.status(400).json({ error: "Missing required fields: title, currency, amount_cents" });
        }

        const updatedExpense = await expensesModel.updateExpense(expenseId, title, currency, amount_cents, notes, category, payer_id, splits);
        return res.status(200).json(updatedExpense);
    } catch (err) {
        return res.status(500).json({ error: err.message ?? String(err) });
    }
}

module.exports = {listExpenses, addExpense, updateExpense, deleteExpense};
