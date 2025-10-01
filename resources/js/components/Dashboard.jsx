import React from 'react';

/**
 * Dashboard Component
 * Main dashboard for the POS system
 */
const Dashboard = () => {
  const stats = [
    { label: 'Total Sales', value: 'Rp 12,500,000', change: '+12.5%', color: 'blue' },
    { label: 'Products', value: '248', change: '+8', color: 'green' },
    { label: 'Customers', value: '1,234', change: '+24', color: 'purple' },
    { label: 'Revenue', value: 'Rp 45,000,000', change: '+18.2%', color: 'indigo' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Dashboard Overview
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentSales />
          <TopProducts />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, change, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-800 mb-2">{value}</p>
      <span className={`text-sm font-semibold px-2 py-1 rounded ${colorClasses[color]}`}>
        {change}
      </span>
    </div>
  );
};

const RecentSales = () => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Sales</h2>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-800">Sale #{1000 + i}</p>
            <p className="text-sm text-gray-500">2 items</p>
          </div>
          <p className="font-semibold text-indigo-600">Rp {(150000 * i).toLocaleString()}</p>
        </div>
      ))}
    </div>
  </div>
);

const TopProducts = () => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4">Top Products</h2>
    <div className="space-y-3">
      {['Product A', 'Product B', 'Product C', 'Product D'].map((product, i) => (
        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-800">{product}</p>
            <p className="text-sm text-gray-500">{50 - i * 10} sold</p>
          </div>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full"
              style={{ width: `${100 - i * 20}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Dashboard;
