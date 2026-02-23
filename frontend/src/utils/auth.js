// Decode role
export const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub.role;
    } catch (e) {
        return null;
    }
};

// Authenticated fetch wrapper
export const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });
};