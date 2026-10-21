import { CreditCard, CheckCircle2, Zap } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["50 classifications/month", "3 PDF uploads/month", "Basic analytics", "Email support"],
    current: false,
    cta: "Downgrade",
    ctaCls: "border border-gray-200 text-gray-600 hover:bg-gray-50",
  },
  {
    name: "Pro",
    price: "₹499",
    period: "per month",
    features: ["Unlimited classifications", "Unlimited PDF uploads", "Full analytics & reports", "Bloom's Taxonomy mapping", "Priority support"],
    current: true,
    cta: "Current Plan",
    ctaCls: "bg-purple-600 text-white shadow-md shadow-purple-200 cursor-default",
    highlight: true,
  },
  {
    name: "School",
    price: "₹1,999",
    period: "per month",
    features: ["Everything in Pro", "Up to 500 students", "School-wide reports", "Dedicated account manager", "Custom integrations"],
    current: false,
    cta: "Upgrade",
    ctaCls: "border border-purple-200 text-purple-600 hover:bg-purple-50",
  },
];

const INVOICES = [
  { id: "INV-2025-05", date: "May 1, 2025",   amount: "₹499", status: "Paid" },
  { id: "INV-2025-04", date: "Apr 1, 2025",   amount: "₹499", status: "Paid" },
  { id: "INV-2025-03", date: "Mar 1, 2025",   amount: "₹499", status: "Paid" },
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Billing</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your subscription and payment details.</p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <div key={plan.name} className={`rounded-2xl p-6 border ${plan.highlight ? "border-purple-300 shadow-lg shadow-purple-100" : "border-gray-100 bg-white shadow-sm"} relative`}>
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Current Plan
                </span>
              </div>
            )}
            <p className="font-bold text-gray-900 text-lg">{plan.name}</p>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
              <span className="text-sm text-gray-400 ml-1">/{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-5">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.ctaCls}`} disabled={plan.current}>
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Payment Method</h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">•••• •••• •••• 4242</p>
            <p className="text-xs text-gray-400">Expires 08/2027</p>
          </div>
          <button className="ml-auto text-xs font-semibold text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
            Update
          </button>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800 text-sm">Invoice History</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {INVOICES.map(inv => (
            <div key={inv.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{inv.id}</p>
                <p className="text-xs text-gray-400">{inv.date}</p>
              </div>
              <span className="text-sm font-bold text-gray-800">{inv.amount}</span>
              <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">{inv.status}</span>
              <button className="text-xs font-semibold text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
