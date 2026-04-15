import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7000/api/'
console.log(apiBaseUrl)

export default axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
})