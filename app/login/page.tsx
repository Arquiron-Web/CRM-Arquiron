"use client";

import { Suspense } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-arquiron-navy">
      {/* Panel izquierdo - Visual */}
      <div className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-arquiron-gradient-start via-arquiron-navy to-arquiron-gradient-end" />
        {/* Patrón geométrico sutil */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Círculos decorativos */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-arquiron-purple/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-arquiron-teal/15 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-64 w-64 rounded-full bg-arquiron-orange/10 blur-2xl" />

        {/* Logo completo en el lado azul */}
        <div className="relative flex h-full flex-col justify-center pl-16 pr-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <Image
              src="/Logo_Completo_SIN_Fondo.png"
              alt="Arquiron"
              width={2049}
              height={551}
              unoptimized
              className="h-auto w-80 object-contain drop-shadow-2xl lg:w-96"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12 max-w-sm"
          >
            <p className="font-heading text-2xl font-semibold tracking-tight text-white/95 lg:text-3xl">
              Diseñamos la arquitectura del cambio que impulsa tu futuro
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Plataforma de gestión de leads para el equipo Arquiron
            </p>
          </motion.div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex w-full flex-col justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-arquiron-navy lg:text-4xl">
                Bienvenido al CRM
              </h1>
              <p className="text-base text-arquiron-muted">
                Acceso exclusivo para el equipo @arquiron.com
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 backdrop-blur-sm"
              >
                Solo usuarios @arquiron.com pueden acceder al CRM
              </motion.div>
            )}

            <Button
              variant="outline"
              size="lg"
              className="group h-14 w-full border-2 border-gray-200 bg-white text-base font-semibold text-arquiron-navy shadow-sm transition-all duration-200 hover:border-arquiron-orange/30 hover:bg-arquiron-orange/5 hover:shadow-md"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              <svg
                className="mr-3 h-6 w-6 transition-transform group-hover:scale-105"
                viewBox="0 0 24 24"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Ingresar con Google
            </Button>

            <p className="text-center text-xs leading-relaxed text-arquiron-muted">
              Al continuar, aceptas acceder únicamente con una cuenta corporativa
              @arquiron.com
            </p>
          </div>

        </motion.div>
      </div>

      {/* Fondo móvil - gradiente */}
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-arquiron-gradient-start/20 via-transparent to-arquiron-gradient-end/20 lg:hidden"
        aria-hidden
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-arquiron-navy">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
