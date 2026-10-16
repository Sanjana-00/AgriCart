
import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Package,
  Truck,
  XCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const stages = [
  {
    status: "Placed",
    label: "Order placed",
    description: "We've received your order.",
    icon: CheckCircle2
  },
  {
    status: "Accepted",
    label: "Accepted by farmer",
    description: "The farmer confirmed your order.",
    icon: CheckCircle2
  },
  {
    status: "Packed",
    label: "Packed and ready",
    description: "Your fresh produce is packed.",
    icon: Package
  },
  {
    status: "Delivered",
    label: "Delivered",
    description: "Your order has been delivered.",
    icon: Truck
  }
];

export default function OrderTracking({ status }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (status === "Cancelled") {
    return (
      <div className="tracking-cancelled">
        <XCircle size={21} />
        <div>
          <strong>Order cancelled</strong>
          <p>This order will not proceed to delivery.</p>
        </div>
      </div>
    );
  }

  const currentIndex = stages.findIndex(
    (stage) => stage.status === status
  );

  return (
    <section className="order-tracking">
      <button
        type="button"
        className="tracking-toggle"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
      >
        <span>
          <strong>Track your order</strong>
          <small>
            {status === "Delivered"
              ? "Your order has been delivered"
              : `Current status: ${status}`}
          </small>
        </span>

        {isExpanded
          ? <ChevronUp size={20} />
          : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="tracking-timeline">
          {stages.map((stage, index) => {
            const completed = currentIndex >= index;
            const Icon = completed ? stage.icon : Circle;

            return (
              <div
                className={`tracking-step ${completed ? "completed" : ""}`}
                key={stage.status}
              >
                <div className="tracking-marker">
                  <Icon size={20} />
                </div>

                <div className="tracking-info">
                  <strong>{stage.label}</strong>
                  <p>{stage.description}</p>

                  {index === currentIndex && (
                    <span className="tracking-current">
                      Current status
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
