import React from 'react';

/**
 * Product Card Component
 * Display product information in card format
 */
const ProductCard = ({ product }) => {
  const { name, price, stock, category, image } = product;

  const stockColor = stock > 10 ? 'text-green-600' : stock > 0 ? 'text-yellow-600' : 'text-red-600';
  const stockBg = stock > 10 ? 'bg-green-50' : stock > 0 ? 'bg-yellow-50' : 'bg-red-50';

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl">📦</span>
        )}
      </div>

      <div className="p-4">
        <div className="mb-3">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
            {category}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-2">{name}</h3>

        <div className="flex justify-between items-center mb-3">
          <p className="text-2xl font-bold text-indigo-600">
            Rp {price.toLocaleString()}
          </p>
          <div className={`px-3 py-1 rounded-full ${stockBg}`}>
            <span className={`text-sm font-semibold ${stockColor}`}>
              Stock: {stock}
            </span>
          </div>
        </div>

        <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
