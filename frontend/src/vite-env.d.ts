interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PROJECT_API_BASE_URL?: string;
  readonly VITE_FEEDBACK_API_BASE_URL?: string;
  readonly VITE_DOCUMENT_API_BASE_URL?: string;
  readonly VITE_ANALYTICS_API_BASE_URL?: string;
  readonly VITE_NOTIFICATION_API_BASE_URL?: string;
  readonly VITE_AUDIT_API_BASE_URL?: string;
  readonly VITE_PREDICTION_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
