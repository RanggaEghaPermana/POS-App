import React, { useState } from 'react';

/**
 * Main Application Component
 * Retail & Service Management System
 */
function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Retail & Service
          </h1>
          <h2 className="text-2xl font-semibold text-indigo-600 mb-4">
            Management System
          </h2>

          <div className="my-8 p-6 bg-indigo-50 rounded-xl">
            <p className="text-6xl font-bold text-indigo-600 mb-4">
              {count}
            </p>
            <button
              onClick={() => setCount(count + 1)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              Click Me
            </button>
          </div>

          <div className="space-y-2 text-left">
            <Feature icon="🏪" text="Point of Sale System" />
            <Feature icon="📦" text="Inventory Management" />
            <Feature icon="📊" text="Sales Analytics" />
            <Feature icon="👥" text="Customer Management" />
            <Feature icon="🏢" text="Multi-Branch Support" />
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Built with React + Laravel + Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, text }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-700 font-medium">{text}</span>
    </div>
  );
}

export default App;
