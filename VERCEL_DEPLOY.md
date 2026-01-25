# VARIABLES DE ENTORNO PARA VERCEL

# 1. En el dashboard de Vercel:
#    - Ve a tu proyecto
#    - Settings → Environment Variables
#    - Agrega estas variables:

NEXT_PUBLIC_SUPABASE_URL=https://xhslnlccbsoyiylmrmxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc2xubGNjYnNveWl5bG1ybXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzc2ODQsImV4cCI6MjA4NDcxMzY4NH0.v7IzfGPgeugvl_qejITew44FTNg4AvLmUyIYU2JvndM

# 2. Asegúrate de que el Framework Preset sea "Next.js"
# 3. El Root Directory debe estar en blanco (raíz del proyecto)
# 4. Build Command: pnpm build
# 5. Install Command: pnpm install
# 6. Output Directory: .next (por defecto)