import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/auth-options";
import { LoginForm } from "@/features/auth/LoginForm";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/dashboard/report");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950/80">
      <div className="mx-4 flex w-full max-w-5xl overflow-hidden rounded-3xl bg-slate-900/90 text-slate-100 shadow-xl ring-1 ring-slate-700 backdrop-blur">
        <div className="relative hidden w-1/2 items-center justify-center bg-slate-900/60 px-10 py-12 lg:flex">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Image
                src="/ZIMA-logo.svg"
                alt="ZIMA"
                width={48}
                height={48}
                className="h-12 w-12"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
                  Broker Activity Tracker
                </p>
                <p className="text-sm text-slate-300">
                  Internal performance cockpit / Внутренний кабинет эффективности
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">
                Focus on today&apos;s pipeline.
              </h1>
              <p className="text-sm text-slate-300">
                One daily report per broker. Instant targets, pace, and score.
                All data stays in Google Sheets.
              </p>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col justify-center px-8 py-10 sm:px-10 lg:w-1/2">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image
              src="/ZIMA-logo.svg"
              alt="ZIMA"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
                Broker Activity Tracker
              </p>
              <p className="text-xs text-slate-300">
                Sales performance · Отдел продаж
              </p>
            </div>
          </div>
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-semibold">
              Sign in / Вход в систему
            </h2>
            <p className="text-xs text-slate-400">
              Use your username or email and password.
            </p>
          </div>
          <LoginForm />
          <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
            Данные хранятся в корпоративной Google Таблице. <br />
            This application is for internal use only.
          </p>
        </div>
      </div>
    </div>
  );
}

