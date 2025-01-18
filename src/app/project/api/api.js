import axios from 'axios';

export const fetchProjects = async () => {
    try {
        const response = await axios.get(`/project/api`);
        return response.data;
    } catch (err) {
        console.error(err);
        return [];
    }
};