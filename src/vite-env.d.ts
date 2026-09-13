/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SITE_URL?: string
    readonly VITE_APP_NODE_ENV?: string
    readonly VITE_APP_API_PATH?: string
    readonly VITE_APP_HEADER?: string
    readonly VITE_APP_LOCAL_TOKEN?: string
    readonly VITE_APP_NAME?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
