import axios from 'axios';

export const fetchProjects = async () => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/projects`);
        return response.data;
    } catch (err) {
        console.error(err);
        return [];
    }
};