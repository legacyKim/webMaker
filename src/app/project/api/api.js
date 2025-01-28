import axios from 'axios';

export const fetchProjects = async () => {
    try {
        const response = await axios.get(`/project/api`);
        return response.data;
    } catch (error) {
        console.error(error);
        return [];
    }
};