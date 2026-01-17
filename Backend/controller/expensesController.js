const tripsModel = require("../model/expensesModel");
const getUserId = require('../utils/getAuth.js');


//get all expenses of a trip while ensuring user is in that trip
async function listExpenses(req, res) {
  try {
    const userId = getUserId(req)
    tripId = req.params.tripId;           // <-- from URL
    console.log(tripId)
    const expenses = await tripsModel.getAllExpenses(tripId,userId);
    return res.status(200).json(expenses);   // <-- return expenses
  } catch (err) {
    return res.status(500).json({ error: err.message ?? String(err) });
  }
}

module.exports = {listExpenses};