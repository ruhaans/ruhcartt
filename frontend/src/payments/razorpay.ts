export async function loadRazorpay(): Promise<boolean> {
  if (document.getElementById("razorpay-sdk")) return true;
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.id = "razorpay-sdk";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
