import axiosClient from "./axiosClient";

const BASE_PATH = "/folders";

export interface Folder {
    _id: string;
    name: string;
    updatedAt: string;
    userId: string;
}

// Create a new folder
export const createFolderApi = (data: { name: string }) => axiosClient.post(`${BASE_PATH}`, data);

// Get all folders
export const getFoldersApi = () => axiosClient.get(`${BASE_PATH}`);

// Update (rename) a folder
export const updateFolderApi = (id: string, data: { name: string }) => axiosClient.put(`${BASE_PATH}/${id}`, data);

// Delete a folder
export const deleteFolderApi = (id: string) => axiosClient.delete(`${BASE_PATH}/${id}`);
