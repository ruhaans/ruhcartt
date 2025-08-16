declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }

  interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayOptions {
    key: string;
    amount: number;     // in paise
    currency: string;   // "INR"
    name?: string;
    description?: string;
    order_id: string;
    prefill?: { name?: string; email?: string; contact?: string };
    notes?: Record<string, any>;
    theme?: { color?: string };
    handler?: (resp: RazorpayResponse) => void;
    modal?: { ondismiss?: () => void };
  }
}
export {};
