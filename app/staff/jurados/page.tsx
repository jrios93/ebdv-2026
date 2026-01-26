"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon, UserIcon, LockIcon } from "lucide-react";
import { autenticarJurado } from "@/lib/juradoService";

export default function JuradoLoginPage() {
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔐 Autenticación con Supabase
      const jurado = await autenticarJurado(codigo, password);

      if (!jurado) {
        setError("Código o contraseña incorrectos. Por favor, intente nuevamente.");
        return;
      }

      // ✅ Login exitoso - redirigir a portal
      router.push(`/staff/jurados/${jurado.id}`);

    } catch (err) {
      setError("Ocurrió un error. Por favor, intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">Portal del Jurado</CardTitle>
            <CardDescription className="text-base text-gray-600 mt-2">
              Ingrese su código de jurado y contraseña para acceder al sistema
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 pb-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="codigo" className="text-base font-medium text-gray-700">
                DNI del Jurado
              </Label>
              <Input
                id="codigo"
                type="text"
                placeholder="Ej: 12345678"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.trim())}
                className="text-base py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={loading}
                style={{ fontSize: "18px" }}
              />
              <p className="text-sm text-gray-500">
                Ingrese su DNI (ej: 12345678)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium text-gray-700">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-base py-3 pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={loading}
                  style={{ fontSize: "18px" }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>

            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base"
              disabled={loading || !codigo || !password}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Ingresando...
                </div>
              ) : (
                "Ingresar al Portal"
              )}
            </Button>
          </CardFooter>
        </form>

        <div className="px-8 pb-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Necesita ayuda? Contacte al administrador del sistema
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
