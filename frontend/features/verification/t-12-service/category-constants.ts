/**
 * T12 Category Constants
 *
 * Raw category definitions that can be easily modified without touching business logic.
 * This file contains the actual category lists and their properties.
 */

export const T12_CATEGORY_DEFINITIONS = {
  REVENUES: {
    "Residential Rent": {
      label: "Residential Rent",
      color: "bg-green-100 text-green-800",
      icon: "🏠"
    },
    "Commercial Rent": {
      label: "Commercial Rent",
      color: "bg-blue-100 text-blue-800",
      icon: "🏢"
    },
    "Parking Revenue": {
      label: "Parking Revenue",
      color: "bg-purple-100 text-purple-800",
      icon: "🅿️"
    },
    "Renovated Apartments": {
      label: "Renovated Apartments",
      color: "bg-orange-100 text-orange-800",
      icon: "🔨"
    },
    "Improved Apartment Income": {
      label: "Improved Apartment Income",
      color: "bg-teal-100 text-teal-800",
      icon: "✨"
    },
    "Other Income": {
      label: "Other Income",
      color: "bg-gray-100 text-gray-800",
      icon: "💰"
    }
  },

  DEDUCTIONS: {
    "Residential Vacancy": {
      label: "Residential Vacancy",
      color: "bg-red-100 text-red-800",
      icon: "🚫"
    },
    "Commercial Vacancy": {
      label: "Commercial Vacancy",
      color: "bg-red-100 text-red-800",
      icon: "🚫"
    },
    "Parking Vacancy": {
      label: "Parking Vacancy",
      color: "bg-red-100 text-red-800",
      icon: "🚫"
    },
    "Bad Debt": {
      label: "Bad Debt",
      color: "bg-red-100 text-red-800",
      icon: "💸"
    }
  },

  EXPENSES: {
    "Property Tax": {
      label: "Property Tax",
      color: "bg-yellow-100 text-yellow-800",
      icon: "🏛️"
    },
    "Insurance": {
      label: "Insurance",
      color: "bg-indigo-100 text-indigo-800",
      icon: "🛡️"
    },
    "Electricity": {
      label: "Electricity",
      color: "bg-yellow-100 text-yellow-800",
      icon: "⚡"
    },
    "Water": {
      label: "Water",
      color: "bg-blue-100 text-blue-800",
      icon: "💧"
    },
    "Gas": {
      label: "Gas",
      color: "bg-orange-100 text-orange-800",
      icon: "🔥"
    },
    "Service Contracts": {
      label: "Service Contracts",
      color: "bg-purple-100 text-purple-800",
      icon: "📋"
    },
    "Professional Fees": {
      label: "Professional Fees",
      color: "bg-gray-100 text-gray-800",
      icon: "👔"
    },
    "R&M": {
      label: "Repairs & Maintenance",
      color: "bg-orange-100 text-orange-800",
      icon: "🔧"
    },
    "Leasing & Marketing": {
      label: "Leasing & Marketing",
      color: "bg-pink-100 text-pink-800",
      icon: "📢"
    },
    "Turnover": {
      label: "Turnover",
      color: "bg-amber-100 text-amber-800",
      icon: "🔄"
    },
    "G&A": {
      label: "General & Administrative",
      color: "bg-slate-100 text-slate-800",
      icon: "📊"
    },
    "Payroll": {
      label: "Payroll",
      color: "bg-green-100 text-green-800",
      icon: "👥"
    },
    "Management": {
      label: "Management",
      color: "bg-cyan-100 text-cyan-800",
      icon: "👨‍💼"
    },
    "Asset Management": {
      label: "Asset Management",
      color: "bg-violet-100 text-violet-800",
      icon: "📈"
    }
  },

  SUBTOTALS: {
    "Effective Gross Revenue": {
      label: "Effective Gross Revenue",
      color: "bg-emerald-100 text-emerald-800",
      icon: "📈"
    },
    "Total Expense": {
      label: "Total Expense",
      color: "bg-red-100 text-red-800",
      icon: "📉"
    },
    "Subtotal": {
      label: "Total Other Income",
      color: "bg-gray-100 text-gray-800",
      icon: "📉"
    },
    "Non-Operating Items": {
      label: "Non-Operating Items",
      color: "bg-gray-100 text-gray-800",
      icon: "📉"
    }
  }
};

// Category group display configurations
export const CATEGORY_GROUP_DISPLAY = {
  REVENUES: {
    name: "Revenues",
    color: "border-green-200 bg-green-50"
  },
  DEDUCTIONS: {
    name: "Deductions",
    color: "border-red-200 bg-red-50"
  },
  EXPENSES: {
    name: "Expenses",
    color: "border-yellow-200 bg-yellow-50"
  },
  SUBTOTALS: {
    name: "Subtotals",
    color: "border-gray-200 bg-gray-50"
  }
};
