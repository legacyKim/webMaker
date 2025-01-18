import axios from 'axios';

export const fetchContent = async () => {
    try {
        const response = await axios.get(`/content/api`);
        return response.data;
    } catch (err) {
        console.error(err);
        return [];
    }
};