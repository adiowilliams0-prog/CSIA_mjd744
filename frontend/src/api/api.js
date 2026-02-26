import { authFetch } from '../utils/auth';

/* -----------------------------
   AUTH
------------------------------ */

export const loginUser = async (credentials) => {
    const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });

    return res;
};


/* -----------------------------
   STAFF APIs
------------------------------ */
export const getStaff = async () => {
  const res = await authFetch('/api/staff');
  return res.ok ? res.json() : Promise.reject(await res.json());
};

export const toggleStaffStatus = async (userId) => {
  const res = await authFetch(`/api/staff/${userId}/toggle`, { method: 'PATCH' });
  return res.ok ? res.json() : Promise.reject(await res.json());
};

export const createStaff = async (staffData) => {
  const res = await authFetch('/api/staff/create', {
    method: 'POST',
    body: JSON.stringify(staffData)
  });
  return res.ok ? res.json() : Promise.reject(await res.json());
};

/* -----------------------------
   CLIENT PLAN APIs
------------------------------ */

export const getClientPlans = async () => {
  const res = await authFetch('/api/plans');
  return res.ok ? res.json() : Promise.reject(await res.json());
};

export const createClientPlan = async (planData) => {
  const res = await authFetch('/api/plans/create', {
    method: 'POST',
    body: JSON.stringify(planData)
  });
  return res.ok ? res.json() : Promise.reject(await res.json());
};

export const addVehicleToPlan = async (planId, vehicleData) => {
  const res = await authFetch(`/api/plans/${planId}/vehicles`, {
    method: 'POST',
    body: JSON.stringify(vehicleData)
  });
  return res.ok ? res.json() : Promise.reject(await res.json());
};

export const getVehicleCategories = async () => {
  const res = await authFetch('/api/vehicle-categories');
  return res.ok ? res.json() : Promise.reject(await res.json());
};

/* -----------------------------
   WORKSHEET APIs
------------------------------ */

export const submitWorksheet = async (data) => {
  const res = await authFetch('/api/worksheet/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.ok ? res.json() : Promise.reject(await res.json());
};

export const createVehicle = async (vehicleData) => {
  const res = await authFetch('/api/vehicles/create', {
    method: 'POST',
    body: JSON.stringify(vehicleData)
  });
  return res.ok ? res.json() : Promise.reject(await res.json());
};

export const getActiveStaff = async () => {
  const res = await authFetch('/api/staff/active');
  return res.ok ? res.json() : Promise.reject(await res.json());
};

export const getActiveServices = async () => {
  const res = await authFetch('/api/services/active');
  return res.ok ? res.json() : Promise.reject(await res.json());
};

/* -----------------------------
   WORKSHEET PREVIEW
------------------------------ */
export const previewTransaction = async (plate, service_ids) => {
  const res = await authFetch('/api/worksheet/preview', {
    method: 'POST',
    body: JSON.stringify({ plate, service_ids })
  });

  if (!res.ok) {
    const err = await res.json();
    return Promise.reject(err);
  }

  return res.json();
};

/**
 * Look up a vehicle by its license plate.
 * Returns vehicle details and plan status.
 */
export const lookupVehicle = async (plate) => {
    // USE authFetch instead of fetch to include the JWT Token
    const response = await authFetch(`/api/vehicles/lookup?plate=${plate}`);
    
    // authFetch usually returns the response object if it's not "ok"
    if (response.status === 404) {
        return null; 
    }
    
    if (!response.ok) {
        // This will be caught by the catch block in DailyWorksheet.js
        throw response; 
    }
    
    return await response.json();
};