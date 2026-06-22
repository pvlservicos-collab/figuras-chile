"use client";

import { useState, useEffect } from "react";

interface SiteConfig {
  locale: string;
  currency: string;
  price: string;
  checkoutUrl: string;
  firstButtonText: string;
  purchaseButtonText: string;
}

interface CheckResult {
  ok: boolean;
  checks: Record<string, boolean>;
}

export default function ConfigPage() {
  const [name, setName] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "check">("config");

  const [config, setConfig] = useState<SiteConfig>({
    locale: "es-CL",
    currency: "EUR",
    price: "€2,99",
    checkoutUrl: "",
    firstButtonText: "EMPEZAR",
    purchaseButtonText: "RECIBIR MI FIGURITA",
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [loadingCheck, setLoadingCheck] = useState(false);

  async function loadConfig() {
    setLoadingConfig(true);
    try {
      const res = await fetch("/api/config");
      if (!res.ok) { setAuthenticated(false); return; }
      setConfig(await res.json());
    } catch { /* ignore */ }
    finally { setLoadingConfig(false); }
  }

  useEffect(() => {
    // Tenta carregar config ao montar — se o cookie ainda é válido, entra directo
    fetch("/api/config").then(r => {
      if (r.ok) { r.json().then(d => { setConfig(d); setAuthenticated(true); }); }
    }).catch(() => {});
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.ok) { setAuthError("Nombre no reconocido."); return; }
      await loadConfig();
      setAuthenticated(true);
    } catch {
      setAuthError("Error de conexión");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    setSaveStatus("");
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaveStatus(res.ok ? "✅ Guardado con éxito" : "❌ Error al guardar");
    } catch {
      setSaveStatus("❌ Error de conexión");
    } finally {
      setSavingConfig(false);
      setTimeout(() => setSaveStatus(""), 3000);
    }
  }

  async function handleCheck() {
    setLoadingCheck(true);
    setCheckResult(null);
    try {
      const res = await fetch("/api/config/check");
      setCheckResult(await res.json());
    } catch {
      setCheckResult({ ok: false, checks: {} });
    } finally {
      setLoadingCheck(false);
    }
  }

  function handleLogout() {
    fetch("/api/admin/auth", { method: "DELETE" }).catch(() => {});
    setAuthenticated(false);
    setName("");
  }

  if (!authenticated) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-900">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-2xl shadow-xl max-w-sm w-full">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Panel de Config</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Ingresa tu nombre de administrador</p>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setAuthError(""); }}
            onKeyDown={e => e.key === "Enter" && !authLoading && handleLogin(e as unknown as React.FormEvent)}
            placeholder="pedro / vini / tel"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none mb-4 text-center"
          />
          {authError && <p className="text-red-400 text-sm mb-4 text-center">{authError}</p>}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {authLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Configuración del Sitio</h1>
          <button
            onClick={handleLogout}
            className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm cursor-pointer"
          >
            Salir
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("config")}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-colors cursor-pointer ${activeTab === "config" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            Configuración
          </button>
          <button
            onClick={() => { setActiveTab("check"); handleCheck(); }}
            className={`px-5 py-2 rounded-lg font-bold text-sm transition-colors cursor-pointer ${activeTab === "check" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            Verificación
          </button>
        </div>

        {activeTab === "config" && (
          <form onSubmit={handleSave} className="bg-gray-800 rounded-2xl p-6 flex flex-col gap-5">
            {loadingConfig ? (
              <p className="text-gray-400 text-center py-4">Cargando...</p>
            ) : (
              (
                [
                  { key: "locale",             label: "Locale",                          placeholder: "es-CL" },
                  { key: "currency",           label: "Moneda",                          placeholder: "EUR" },
                  { key: "price",              label: "Precio mostrado",                 placeholder: "€2,99" },
                  { key: "checkoutUrl",        label: "URL de Checkout",                 placeholder: "https://..." },
                  { key: "firstButtonText",    label: "Texto botón inicial (Hero)",      placeholder: "EMPEZAR" },
                  { key: "purchaseButtonText", label: "Texto botón de compra (Result)",  placeholder: "RECIBIR MI FIGURITA" },
                ] as { key: keyof SiteConfig; label: string; placeholder: string }[]
              ).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-bold text-gray-300 mb-1">{label}</label>
                  <input
                    type="text"
                    value={config[key]}
                    onChange={e => setConfig(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="submit"
                disabled={savingConfig || loadingConfig}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingConfig ? "Guardando..." : "Guardar configuración"}
              </button>
            </div>

            {saveStatus && (
              <p className={`text-center font-bold ${saveStatus.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                {saveStatus}
              </p>
            )}

            <div className="border-t border-gray-700 pt-4 mt-2">
              <p className="text-xs text-gray-500 text-center">
                Los cambios se aplican en hasta 60 segundos (caché del servidor).
              </p>
            </div>
          </form>
        )}

        {activeTab === "check" && (
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">Secrets del Vercel</h2>
              <button
                onClick={handleCheck}
                disabled={loadingCheck}
                className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                {loadingCheck ? "Verificando..." : "Verificar de nuevo"}
              </button>
            </div>

            {loadingCheck && <p className="text-gray-400 text-center py-8">Verificando secrets...</p>}

            {checkResult && !loadingCheck && (
              <div className="flex flex-col gap-3">
                {Object.entries(checkResult.checks).map(([key, ok]) => (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border ${ok ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}
                  >
                    <span className="font-mono text-sm text-gray-200">{key}</span>
                    <span className={`font-bold text-sm ${ok ? "text-green-400" : "text-red-400"}`}>
                      {ok ? "✅ Configurado" : "❌ Faltando"}
                    </span>
                  </div>
                ))}
                <div className={`mt-3 px-4 py-3 rounded-xl text-center font-bold ${checkResult.ok ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                  {checkResult.ok ? "✅ Todos los secrets están configurados" : "❌ Hay secrets faltando en el Vercel"}
                </div>
              </div>
            )}

            <div className="border-t border-gray-700 pt-4 mt-6">
              <p className="text-xs text-gray-500">
                Los secrets se configuran directamente en el panel del Vercel (Settings → Environment Variables).
                Esta verificación solo comprueba si están presentes — los valores no se muestran aquí.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
