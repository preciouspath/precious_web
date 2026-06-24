import axiosClient from './axiosClient';

export const getInsurances = () => {
    return axiosClient.get('/insurance');
};

export const addInsurance = (formData: FormData) => {
    return axiosClient.post('/insurance/add', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const updateInsurance = (id: string, formData: FormData) => {
    return axiosClient.put(`/insurance/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteInsurance = (id: string) => {
    return axiosClient.delete(`/insurance/${id}`);
};
