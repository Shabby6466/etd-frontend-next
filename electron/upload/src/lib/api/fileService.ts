import axios from "axios"

const FILE_SERVER_URL = "http://localhost:3005"

const fileClient = axios.create({
    baseURL: FILE_SERVER_URL,
    timeout: 10000,
})

export interface FileInfo {
    filename: string
    path: string
}

export const fileServiceAPI = {
    getFiles: async (): Promise<{ files: FileInfo[]; count: number }> => {
        const response = await fileClient.get("/api/files")
        return response.data
    },

    getFileContent: async (filename: string): Promise<string> => {
        const response = await fileClient.get(`/api/files/${filename}`)
        return response.data.content
    },

    markAsComplete: async (filename: string): Promise<void> => {
        await fileClient.post(`/api/files/${filename}/complete`)
    },

    deleteFile: async (filename: string): Promise<void> => {
        await fileClient.delete(`/api/files/${filename}`)
    },
}
