module.exports = {
  apps: [
    {
      name: "frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",

        NEXT_PUBLIC_API_URL: "https://traproyaltiespro.com/api",
        INTERNAL_BACKEND_URL: "http://127.0.0.1:8000",

        MUSICBRAINZ_USER_AGENT: "TrapRoyaltiesPro/1.0 (contact@traproyaltiespro.com)",
        ASCAP_API_KEY: "YOUR_KEY",
        BMI_API_KEY: "YOUR_KEY",

        IDRIVE_KEY: "YOUR_KEY",
        IDRIVE_SECRET: "YOUR_SECRET",
        IDRIVE_REGION: "YOUR_REGION",
        IDRIVE_BUCKET: "YOUR_BUCKET"
      }
    }
  ]
}
