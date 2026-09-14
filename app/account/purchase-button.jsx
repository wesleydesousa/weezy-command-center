"use client";

import { useState } from "react";

export default function PurchaseButton({ plan, children }) {
  const [state, setState] = useState("idle");

  async function startCheckout() {
    setState("loading");
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || "Falha ao iniciar pagamento");
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      setState("error");
    }
  }

  return <button className="account-primary" onClick={startCheckout} disabled={state === "loading"}>
    {state === "loading" ? "Abrindo pagamento…" : state === "error" ? "Tentar novamente" : children}
  </button>;
}
