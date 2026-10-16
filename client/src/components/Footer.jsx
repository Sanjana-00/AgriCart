
import React from "react";
import { Sprout } from "lucide-react";

export default function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <Sprout size={22} />
        AgriCart
      </div>

      <p>
        Connecting farms to families, one fresh basket at a time.
      </p>

      <small>AgriCart student project · Demo version</small>
    </footer>
  );
}
