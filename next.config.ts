import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración de timezone para toda la aplicación
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // Variables de entorno para el timezone
  env: {
    TZ: 'America/Lima'
  },
  // Configuración para asegurar consistencia de timezone
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Time-Zone',
            value: 'America/Lima'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
