import { useState } from "react";
import {
  createPaymentOrder,
  capturePaymentOrder,
} from "./services/paymentService";

export default function PaymentTest() {
  const [productId, setProductId] = useState("1");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [approvalUrl, setApprovalUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateOrder() {
    setLoading(true);
    setMessage("");
    setApprovalUrl("");
    setOrderId("");

    try {
      const result = await createPaymentOrder([
        Number(productId),
      ]);

      setOrderId(result.id);
      setApprovalUrl(result.approval_url);

      setMessage(
        `Order created successfully: ${result.id}. ` +
          `Sandbox amount: ${result.currency} ${result.test_amount}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCapturePayment() {
    if (!orderId) {
      setMessage("Create an order first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await capturePaymentOrder(orderId);

      setMessage(
        result.success
          ? `Payment successful! Status: ${result.status}`
          : "Payment has not been confirmed.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Payment capture failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "60px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        border: "1px solid #ddd",
        borderRadius: 16,
      }}
    >
      <h1>Skillora AI</h1>
      <h2>PayPal Sandbox Test</h2>

      <p>
        Test a product purchase using your PayPal Sandbox
        account.
      </p>

      <label htmlFor="productId">Product ID</label>

      <select
        id="productId"
        value={productId}
        onChange={(event) => setProductId(event.target.value)}
        style={{
          display: "block",
          width: "100%",
          padding: 12,
          margin: "10px 0 20px",
        }}
      >
        <option value="1">
          Machine Learning Fundamentals — ID 1
        </option>
        <option value="2">
          The Complete React Handbook — ID 2
        </option>
        <option value="3">
          Data Analytics Starter Project — ID 3
        </option>
        <option value="4">
          Python for AI Development — ID 4
        </option>
        <option value="5">
          Full Stack Project Blueprint — ID 5
        </option>
        <option value="6">
          Cloud Computing Essentials — ID 6
        </option>
      </select>

      <button
        onClick={handleCreateOrder}
        disabled={loading}
        style={{
          width: "100%",
          padding: 14,
          background: "#111827",
          color: "white",
          border: 0,
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        {loading ? "Please wait..." : "Create PayPal Order"}
      </button>

      {orderId && (
        <section style={{ marginTop: 20 }}>
          <p>
            <strong>Order ID:</strong> {orderId}
          </p>

          {approvalUrl && (
            <a
              href={approvalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                margin: "16px 0",
                padding: 14,
                textAlign: "center",
                background: "#0070ba",
                color: "white",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Approve Payment with PayPal
            </a>
          )}

          <p>
            After approving the payment in PayPal, return
            here and click the button below.
          </p>

          <button
            onClick={handleCapturePayment}
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              background: "#15803d",
              color: "white",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Capture Payment
          </button>
        </section>
      )}

      {message && (
        <p
          role="status"
          style={{
            marginTop: 20,
            padding: 12,
            background: "#f3f4f6",
            borderRadius: 8,
            overflowWrap: "anywhere",
          }}
        >
          {message}
        </p>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: "#666" }}>
        Sandbox testing only. The current backend sends the
        numeric INR price as USD without conversion.
      </p>
    </main>
  );
}
