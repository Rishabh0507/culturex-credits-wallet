/** Money is stored as integer paise; show it as rupees. */
export const formatPaise = (paise) => `₹${(paise / 100).toFixed(2)}`;

export const formatDate = (value) => (value ? new Date(value).toLocaleString() : '-');
