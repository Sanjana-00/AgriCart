
import React from "react";
import { Sprout, X } from "lucide-react";

export default function AuthModal({
  auth,
  setAuth,
  login,
  setShowAuth
}) {
  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={login}>
        <button
          type="button"
          className="modal-close"
          onClick={() => setShowAuth(false)}
        >
          <X size={18} />
        </button>

        <div className="modal-icon">
          <Sprout size={28} />
        </div>

        <span className="eyebrow green">WELCOME TO AGRICART</span>
        <h2>Fresh starts here.</h2>
        <p>Sign in to shop fresh or manage your farm.</p>

        <label>
          Your role
          <select
            value={auth.role}
            onChange={e =>
              setAuth({
                ...auth,
                role: e.target.value,
                otp: ""
              })
            }
          >
            <option>Customer</option>
            <option>Farmer</option>
          </select>
        </label>

        <label>
          Mobile number
          <input
            required
            value={auth.phone}
            onChange={e =>
              setAuth({ ...auth, phone: e.target.value })
            }
            placeholder="Enter any demo number"
          />
        </label>

        {auth.otp && (
          <label>
            Development OTP
            <input
              required
              value={auth.otp}
              onChange={e =>
                setAuth({ ...auth, otp: e.target.value })
              }
              placeholder="123456"
            />
            <small className="hint">
              For this local demo, use 123456.
            </small>
          </label>
        )}

        <button className="btn btn-primary full">
          {auth.otp ? "Verify & continue" : "Send demo OTP"}
        </button>

        <small className="modal-footnote">
          Development-only login. No real SMS is sent.
        </small>
      </form>
    </div>
  );
}

