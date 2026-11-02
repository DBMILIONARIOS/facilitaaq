// netlify/functions/create-pix.js
//
// Chama a API da PropixBR a partir do servidor da Netlify (não do
// navegador da pessoa), porque a PropixBR não libera chamadas diretas
// do navegador (sem CORS). As credenciais ficam só aqui — nunca no
// HTML.
//
// Configure em Site settings > Environment variables:
//   PROPIXBR_API_URL       -> https://api.propixbr.com  (sem barra no final)
//   PROPIXBR_CLIENT_ID     -> live_...
//   PROPIXBR_CLIENT_SECRET -> sk_...

const DEFAULT_API_URL = "https://api.propixbr.com";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Método não permitido." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return respond(400, { error: "JSON inválido no corpo da requisição." });
  }

  const { amount, description, payerName, payerDocument } = body;

  const errors = [];
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errors.push("Valor inválido.");
  if (!payerName || !payerName.trim()) errors.push("Nome do pagador é obrigatório.");
  if (!payerDocument || payerDocument.replace(/\D/g, "").length < 11) {
    errors.push("CPF/CNPJ do pagador é obrigatório.");
  }
  if (errors.length) return respond(422, { error: errors.join(" ") });

  const apiUrl = process.env.PROPIXBR_API_URL || DEFAULT_API_URL;
  const clientId = process.env.PROPIXBR_CLIENT_ID;
  const clientSecret = process.env.PROPIXBR_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return respond(500, {
      error: "PROPIXBR_CLIENT_ID / PROPIXBR_CLIENT_SECRET não configuradas nas variáveis de ambiente da Netlify.",
    });
  }

  const payload = {
    amount: Number(amount),
    description: description && description.trim() ? description.trim() : "Cobrança Pix",
    payerName: payerName.trim(),
    payerDocument: payerDocument.replace(/\D/g, ""),
  };

  try {
    const apiResponse = await fetch(`${apiUrl}/api/v1/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
      },
      body: JSON.stringify(payload),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok || data.success === false) {
      return respond(apiResponse.status || 502, {
        error: data.message || data.error || "A PropixBR recusou a transação.",
        details: data,
      });
    }

    if (!data.transactionId || !data.copyPaste) {
      return respond(502, { error: "Resposta inesperada da PropixBR.", details: data });
    }

    return respond(200, {
      id: data.transactionId,
      amount: payload.amount,
      status: data.status || "PENDENTE",
      qr_code: data.copyPaste,
      customer_name: payload.payerName,
      description: payload.description,
    });
  } catch (err) {
    return respond(500, { error: "Falha ao conectar com a PropixBR.", details: String(err) });
  }
};

function respond(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}
