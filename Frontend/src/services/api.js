import axios from "axios";
import { supabase } from "./supabase";

const API_URL = "http://localhost:8081/";


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
    const response = await api.post(`/trips/${tripId}/expenses`, {
      title: expenseData.title,
      currency: expenseData.currency || 'SGD',
      amount_cents: expenseData.amount_cents,
      notes: expenseData.notes,
      category: expenseData.category,
    });
    return response.data;
  },

  // Delete an expense
  delete: async (tripId, expenseId) => {
    const response = await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
    return response.data;
  },
};

export default api;
