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
   MANAGER APIs (future ready)
------------------------------ */
