import axios from "axios";
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_BACKEND_API_URL


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get bearer token from Supabase and set it in API headers
export const setAuthFromSupabase = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting Supabase session:", error);
      return null;
    }

    if (session?.access_token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      return session.access_token;
    }

    return null;
  } catch (err) {
    console.error("Error setting auth from Supabase:", err);
    return null;
  }
};



// Trips API
export const tripsApi = {
  list: async (page = 1) => {
    const response = await api.get(`/trips?page=${page}`);
    return response.data;
  },

  peopleCount: async (tripId)=>{
    const response = await api.get(`/trips/${tripId}/people`)
    return response.data
  },

  create: async (name, description = '') => {
    const response = await api.post('/trips', {
      name: name,
      description: description // Optional field for additional details
    });
    return response.data;
  },
};

export  async function testAPI() {
    const resp= await api.get('authtest')
    console.log(resp);
}

export const expensesApi = {
  // Get all expenses for a trip
  list: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/expenses`);
    return response.data;
  },

  // Create a new expense
  create: async (tripId, expenseData) => {
    console.log(expenseData);
    const response = await api.post(`/trips/${tripId}/expenses`, {
      title: expenseData.title,
      currency: expenseData.currency || 'SGD',
      amount_cents: expenseData.amount_cents,
      notes: expenseData.notes,
      category: expenseData.category,
      payer: expenseData.payer,
      splits: expenseData.expense_splits,
    });
    return response.data;
  },

  // Update an expense
  update: async (tripId, expenseId, expenseData) => {
    const response = await api.put(`/trips/${tripId}/expenses/${expenseId}`, {
      title: expenseData.title,
      currency: expenseData.currency || 'SGD',
      amount_cents: expenseData.amount_cents,
      notes: expenseData.notes,
      category: expenseData.category,
      payer_id: expenseData.payer_id,
      expense_splits: expenseData.expense_splits || [], // Include splits if provided
    });
    return response.data;
  },

  // Update only the splits for an expense: PUT /trips/{tripId}/expenses/{expenseId}/splits
  updateSplits: async (tripId, expenseId, updatedExpense) => {
    const response = await api.put(`/trips/${tripId}/expenses/${expenseId}/splits`, updatedExpense);
    return response.data;
  },

  // Delete an expense
  delete: async (tripId, expenseId) => {
    const response = await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  },
};

// Owed API
export const owedApi = {
  // Get owed amount for a user in a specific trip
  // Returns: { owed: number } - positive if owed to you, negative if you owe
  get: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/owed`);
    return response.data;
  },
};

// Debt API (per UI request): GET /trip/{tripId}/debt
export const debtApi = {
  get: async (tripId) => {
    const response = await api.get(`/trips/${tripId}/debt`);
    return response.data;
  },
};

// InviteAPI
export const inviteAPI = {
  get: async() => {
    const response = await api.get(`/invites`);
    return response.data;
  },
  accept: async (tripId, inviteId) => {
    const response = await api.post(`/trips/${tripId}/invites/${inviteId}/accept`);
    return response.data;
  },
  decline: async (tripId, inviteId) => {
    const response = await api.post(`/trips/${tripId}/invites/${inviteId}/decline`);
    return response.data;
  },
  // Create invite(s) for a trip.
  // Sends POST /trips/{tripId}/invites with body { UserID: [number] }
  create: async (tripId, userId) => {
    const body = { UserID: userId };
    const response = await api.post(`/trips/${tripId}/invites`, body);
    return response.data;
  },
}

// People API - search people by name (sends { name } in POST body)
export const peopleApi = {
  search: async (name) => {
    const response = await api.post('/people', { name });
    return response.data;
  },
};

// Me API - fetch current user's basic info { id, name, user }
export const meApi = {
  get: async () => {
    const response = await api.get('/me');
    return response.data;
  },
};

export default api;
