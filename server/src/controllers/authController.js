export function requestDemoOtp(req, res) {
  const { phone, role } = req.body || {};
  if (!phone?.trim() || !["Farmer", "Customer"].includes(role)) {
    return res.status(400).json({ message: "Enter a phone number and choose Farmer or Customer." });
  }
  // Development-only: no SMS is sent. Do not use this as production authentication.
  res.json({ message: "Development OTP requested. Use the configured demo OTP." });
}

export function verifyDemoOtp(req, res) {
  const { phone, role, otp, name } = req.body || {};
  if (!phone?.trim() || !["Farmer", "Customer"].includes(role) || otp !== (process.env.DEMO_OTP || "123456")) {
    return res.status(400).json({ message: "Invalid details or demo OTP." });
  }
  res.json({
    user: {
      id: phone.trim(),
      phone: phone.trim(),
      role,
      name: name?.trim() || (role === "Farmer" ? "Demo Farmer" : "Demo Customer")
    },
    mode: "development-demo"
  });
}
