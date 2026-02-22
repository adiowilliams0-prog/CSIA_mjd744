export const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        // Decodes the payload of the JWT
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub.role; // Matches your Flask JWT identity structure
    } catch (e) {
        return null;
    }
};