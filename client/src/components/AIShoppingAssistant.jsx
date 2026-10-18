
import React, { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  X,
  Minus,
  Sprout,
  ShoppingCart,
  LoaderCircle,
  Sparkles
} from "lucide-react";
import "./AIShoppingAssistant.css";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;
const ARI_IMAGE = "/ari-mascot.png";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400";

export default function AIShoppingAssistant({ addToCart, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi there! 🌱 I'm Ari, your AgriCart shopping buddy! Tell me what you need, and I'll help you find fresh products within your budget.",
      products: []
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [messages, loading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  async function sendMessage(event) {
    event?.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: message,
        products: []
      }
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Ari couldn't respond right now. Please try again."
        );
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            data.reply ||
            "Here are some products you might like! 🌿",
          products: Array.isArray(data.recommendedProducts)
            ? data.recommendedProducts
            : []
        }
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: `Oops! 🌱 ${
            error.message ||
            "I couldn't connect. Please try again."
          }`,
          products: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToCart(product) {
    if (!user) {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            "Please sign in first, and then I'll help you add this product to your cart. 💚",
          products: []
        }
      ]);
      return;
    }

    if (user.role !== "Customer") {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            "Please switch to a Customer account to shop for products. 🌿",
          products: []
        }
      ]);
      return;
    }

    if (typeof addToCart === "function") {
      addToCart(product);
    }
  }

  function useSuggestion(suggestion) {
    setInput(suggestion);
    inputRef.current?.focus();
  }

  return (
    <>
      {!isOpen && (
        <div className="ari-launcher-container">
          <button
            className="ari-launcher"
            onClick={() => setIsOpen(true)}
            aria-label="Open Ari AI Shopping Assistant"
            title="Chat with Ari"
          >
            <img
              className="ari-launcher-face"
              src={ARI_IMAGE}
              alt="Ari, your AgriCart shopping assistant"
            />

            <span className="ari-online-dot" />
          </button>

          <span className="ari-launcher-label">Ask Ari 🌱</span>

          <button
            className="ari-chat-shortcut"
            onClick={() => setIsOpen(true)}
            aria-label="Need help shopping? Chat with Ari"
          >
            <MessageCircle size={16} />
            Need help shopping?
          </button>
        </div>
      )}

      {isOpen && (
        <section
          className="ari-chat-window"
          aria-label="Ari AI Shopping Assistant"
        >
          <header className="ari-header">
            <div className="ari-header-avatar">
              <img src={ARI_IMAGE} alt="Ari" />
            </div>

            <div className="ari-header-copy">
              <h2>
                Ari <Sparkles size={15} />
              </h2>

              <p>
                <span className="ari-status-dot" />
                Your shopping buddy
              </p>
            </div>

            <button
              className="ari-header-button"
              onClick={() => setIsOpen(false)}
              aria-label="Minimize chat"
              title="Minimize"
            >
              <Minus size={21} />
            </button>

            <button
              className="ari-header-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              title="Close"
            >
              <X size={21} />
            </button>
          </header>

          <div className="ari-welcome">
            <div className="ari-mascot">
              <img src={ARI_IMAGE} alt="Ari smiling" />
            </div>

            <div className="ari-welcome-bubble">
              <strong>Hey there! 🌼</strong>
              <p>
                Fresh finds, happy tummies! What can I help you
                find today?
              </p>
            </div>
          </div>

          <div className="ari-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div
                className={`ari-message-row ${message.role}`}
                key={`${index}-${message.role}`}
              >
                {message.role === "assistant" && (
                  <div className="ari-small-avatar">
                    <img src={ARI_IMAGE} alt="Ari" />
                  </div>
                )}

                <div className="ari-message-content">
                  <div className="ari-message-bubble">
                    {message.text}
                  </div>

                  {message.products.length > 0 && (
                    <div className="ari-product-list">
                      {message.products.map((product) => (
                        <article
                          className="ari-product-card"
                          key={
                            product._id ||
                            product.id ||
                            product.name
                          }
                        >
                          <img
                            className="ari-product-image"
                            src={
                              product.image ||
                              FALLBACK_PRODUCT_IMAGE
                            }
                            alt={product.name}
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src =
                                FALLBACK_PRODUCT_IMAGE;
                            }}
                          />

                          <div className="ari-product-info">
                            <strong>{product.name}</strong>

                            <span className="ari-product-category">
                              {product.category}
                            </span>

                            <span className="ari-product-price">
                              ₹{Number(product.price).toFixed(2)}/
                              {product.unit}
                            </span>

                            <span className="ari-product-stock">
                              {product.quantity} {product.unit} available
                            </span>
                          </div>

                          <button
                            className="ari-add-button"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.quantity <= 0}
                          >
                            <ShoppingCart size={15} />
                            Add to Cart
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ari-message-row assistant">
                <div className="ari-small-avatar">
                  <img src={ARI_IMAGE} alt="Ari" />
                </div>

                <div className="ari-typing">
                  <LoaderCircle
                    size={16}
                    className="ari-spinner"
                  />
                  Ari is thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="ari-suggestions">
            {[
              "Vegetables under ₹200",
              "Suggest fruits",
              "Healthy family shopping"
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => useSuggestion(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form className="ari-input-area" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Ari about products or your budget..."
              aria-label="Message Ari"
              maxLength={1000}
              disabled={loading}
            />

            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || loading}
            >
              {loading ? (
                <LoaderCircle className="ari-spinner" size={19} />
              ) : (
                <Send size={19} />
              )}
            </button>
          </form>

          <footer className="ari-footer">
            <Sprout size={13} />
            Powered by AI · Fresh choices, smarter shopping
          </footer>
        </section>
      )}
    </>
  );
}
