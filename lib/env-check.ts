// Environment variables check for production
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
    return false;
  }

  console.log('✅ Environment variables validated successfully');
  return true;
};