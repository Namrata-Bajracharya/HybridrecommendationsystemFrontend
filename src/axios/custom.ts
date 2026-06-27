import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { BASE_API_ROUTE } from "../RoutesName/Routes";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

const baseURL = BASE_API_ROUTE;

const privateAgent = axios.create({
    baseURL,
    headers: {
        Accept: "application/json",
    },
});

const publicAgent = axios.create({
    baseURL,
    headers: {
        Accept: "application/json",
    },
});

privateAgent.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = Cookies.get("token");

        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

privateAgent.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        if (error.response?.status === 401 && originalRequest) {
            Cookies.remove("token");
        }

        return Promise.reject(error);
    }
);

export { privateAgent, publicAgent };
export default publicAgent;