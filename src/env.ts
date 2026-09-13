export default {
    NODE_ENV: `${import.meta.env.VITE_APP_NODE_ENV}`,
    VITE_APP_API_PATH: import.meta.env.VITE_APP_API_PATH,
    HEADER: `${import.meta.env.VITE_APP_HEADER}`,
    LOCAL_TOKEN: `${import.meta.env.VITE_APP_LOCAL_TOKEN}`
}
