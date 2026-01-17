import { useState } from 'react';
import { expensesApi, setAuthFromSupabase } from '../../services/api';

export default function AddExpenseForm({ tripId, onExpenseAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    currency: 'SGD',
    amount_cents: '',
    notes: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount_cents' ? parseInt(value) || '' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Ensure auth is set before API call
      await setAuthFromSupabase();
      
      const result = await expensesApi.create(tripId, formData);
      
      // Reset form
      setFormData({
        title: '',
        currency: 'SGD',
        amount_cents: '',
        notes: '',
        category: '',
      });

      // Callback to parent to refresh expenses list
      if (onExpenseAdded) {
        onExpenseAdded(result);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create expense');
      console.error('Error creating expense:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Add Expense</h3>

      {error && <div className="text-red-600 mb-3">{error}</div>}

      <input
        type="text"
        name="title"
        placeholder="Expense title"
        value={formData.title}
        onChange={handleChange}
        required
        className="w-full mb-2 p-2 border rounded"
      />

      <input
        type="number"
        name="amount_cents"
        placeholder="Amount (in cents)"
        value={formData.amount_cents}
        onChange={handleChange}
        required
        className="w-full mb-2 p-2 border rounded"
      />

      <select
        name="currency"
        value={formData.currency}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded"
      >
        <option value="SGD">SGD</option>
        <option value="USD">USD</option>
      </select>

      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
        className="w-full mb-2 p-2 border rounded"
      >
        <option value="">Select category</option>
        <option value="food">Food</option>
        <option value="transport">Transport</option>
        <option value="accommodation">Accommodation</option>
        <option value="activities">Activities</option>
      </select>

      <textarea
        name="notes"
        placeholder="Notes (optional)"
        value={formData.notes}
        onChange={handleChange}
        className="w-full mb-3 p-2 border rounded"
        rows="3"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Add Expense'}
      </button>
    </form>
  );
}