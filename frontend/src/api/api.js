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