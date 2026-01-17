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
  
  create: async (description) => {
    const response = await api.post('/trips', { Description: description });
    return response.data;
  },
};

export default api;
