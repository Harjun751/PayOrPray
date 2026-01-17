import React, { useState, useMemo } from 'react';
import { addExpenseWithSplits } from '../../services/expenseApi';
import { calculateSplits, formatSplitsForDisplay, validateExpenseData, getExpenseSummary } from '../../utils/expenseSplitter';

/**
 * ExpenseForm Component
 * Handles adding expenses with automatic equal splits
 * Mirrors backend calculation logic on the frontend for real-time preview
 */
export default function ExpenseForm({ tripId, tripMembers, authToken, onExpenseAdded }) {
    const [formData, setFormData] = useState({
        title: '',
        currency: 'SGD',
        amount_cents: '',
        notes: '',
        category: ''
    });

    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Real-time split calculation preview
    const splitPreview = useMemo(() => {
        if (!formData.amount_cents || selectedUsers.length === 0) {
            return null;
        }

        try {
            const amountCents = parseInt(formData.amount_cents);
            const summary = getExpenseSummary(amountCents, selectedUsers);
            const formattedSplits = formatSplitsForDisplay(summary.splits, amountCents, formData.currency);
            return {
                summary,
                formattedSplits
            };
        } catch (err) {
            return null;
        }
    }, [formData.amount_cents, selectedUsers, formData.currency]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount_cents' ? (value === '' ? '' : parseInt(value)) : value
        }));
    };

    const handleUserToggle = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const expenseData = {
            ...formData,
            amount_cents: parseInt(formData.amount_cents),
            userIds: selectedUsers
        };

        // Validate before submission
        const validation = validateExpenseData(expenseData);
        if (!validation.isValid) {
            setError(validation.errors.join(', '));
            return;
        }

        try {
            setLoading(true);
            const result = await addExpenseWithSplits(tripId, expenseData, authToken);
            
            setSuccess(`Expense created! Split among ${result.splits.length} people.`);
            
            // Reset form
            setFormData({
                title: '',
                currency: 'SGD',
                amount_cents: '',
                notes: '',
                category: ''
            });
            setSelectedUsers([]);

            // Call callback if provided
            if (onExpenseAdded) {
                onExpenseAdded(result);
            }
        } catch (err) {
            setError(err.message || 'Failed to create expense');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="expense-form-container bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Add Expense</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Dinner"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                {/* Amount and Currency */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount *
                        </label>
                        <div className="flex">
                            <input
                                type="number"
                                name="amount_cents"
                                value={formData.amount_cents}
                                onChange={handleInputChange}
                                placeholder="0"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                                min="0"
                            />
                            <span className="inline-flex items-center px-3 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-700">
                                ¢
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.amount_cents ? `$${(parseInt(formData.amount_cents) / 100).toFixed(2)}` : ''}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Currency *
                        </label>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="SGD">SGD</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                        </select>
                    </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select a category</option>
                        <option value="food">Food & Drinks</option>
                        <option value="accommodation">Accommodation</option>
                        <option value="transport">Transport</option>
                        <option value="activities">Activities</option>
                        <option value="shopping">Shopping</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Notes */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                    </label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Add any additional notes..."
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Participants Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Split among participants * ({selectedUsers.length} selected)
                    </label>
                    <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                        {tripMembers && tripMembers.length > 0 ? (
                            <div className="space-y-2">
                                {tripMembers.map(member => (
                                    <label key={member.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(member.id)}
                                            onChange={() => handleUserToggle(member.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                            {member.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No trip members available</p>
                        )}
                    </div>
                </div>

                {/* Split Preview */}
                {splitPreview && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">
                            Split Preview
                        </h3>
                        <div className="space-y-1 text-sm">
                            {splitPreview.formattedSplits.map((split, idx) => (
                                <div key={idx} className="flex justify-between text-blue-800">
                                    <span>Person {idx + 1}:</span>
                                    <span>
                                        ${split.shareAmount} ({split.percentage}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                        {splitPreview.summary.remainder > 0 && (
                            <p className="text-xs text-blue-700 mt-2">
                                💡 Remainder of {splitPreview.summary.remainder}¢ distributed among first participants
                            </p>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !selectedUsers.length}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Creating...' : 'Create Expense'}
                </button>
            </form>
        </div>
    );
}
