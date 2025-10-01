import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import Login from './pages/Login.jsx'
import Cashier from './pages/Cashier.jsx'
import Receipt from './pages/Receipt.jsx'
import SaleDetail from './pages/SaleDetail.jsx'
import Invoice from './pages/Invoice.jsx'
import History from './pages/History.jsx'
import ReturnPage from './pages/Return.jsx'
import InventoryCards from './pages/InventoryCards.jsx'
import Inventory from './pages/Inventory.jsx'
import ProductForm from './pages/ProductForm.jsx'
import ProductDetailModern from './pages/ProductDetailModern.jsx'
import Categories from './pages/Categories.jsx'
import SalesReports from './pages/SalesReports.jsx'
import Dashboard from './pages/Dashboard.jsx'
import StockManagement from './pages/StockManagement.jsx'
import StockTransfer from './pages/StockTransfer.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Payables from './pages/Payables.jsx'
import Users from './pages/Users.jsx'
import UserNew from './pages/UserNew.jsx'
import StoreSettings from './pages/StoreSettings.jsx'
import Pricing from './pages/Pricing.jsx'
import BackupRestore from './pages/BackupRestore.jsx'
import SystemLogs from './pages/SystemLogs.jsx'
import InventoryReport from './pages/InventoryReport.jsx'
import Cashflow from './pages/Cashflow.jsx'
import ProfitLoss from './pages/ProfitLoss.jsx'
import TaxReport from './pages/TaxReport.jsx'
import PrinterTest from './pages/PrinterTest.jsx'
import TestPage from './pages/TestPage.jsx'
import ServiceCategories from './pages/ServiceCategories.jsx'
import Services from './pages/Services.jsx'
import ServiceList from './pages/ServiceList.jsx'
import ServicePOS from './pages/ServicePOS.jsx'
import Appointments from './pages/Appointments.jsx'
import Barbers from './pages/Barbers.jsx'
import BarbershopShift from './pages/BarbershopShift.jsx'
import ExpenseManagement from './pages/ExpenseManagement.jsx'
import Layout from './components/Layout.jsx'
import BusinessTypeSelector from './components/BusinessTypeSelector.jsx'

function RequireAuth({ children }){
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

function RequireRole({ anyOf = [], children }){
  const { user } = useAuth()
  const roles = user?.roles || []
  if (roles.includes('super_admin')) return children
  const has = (r) => Array.isArray(roles) ? roles.includes(r) : false
  const ok = anyOf.length === 0 || anyOf.some(has)
  if (!ok) return <Navigate to="/" replace />
  return children
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route element={<RequireAuth><Layout/></RequireAuth>}>
            <Route index element={<Dashboard/>} />
            <Route path="cashier" element={<Cashier/>} />
            <Route path="receipt/:id" element={<Receipt/>} />
            <Route path="sale/:id" element={<SaleDetail/>} />
            <Route path="invoice/:id" element={<Invoice/>} />
            <Route path="history" element={<History/>} />
            <Route path="return" element={<ReturnPage/>} />
            <Route path="inventory" element={<RequireRole anyOf={["admin","manager"]}><Inventory/></RequireRole>} />
            <Route path="inventory/new" element={<RequireRole anyOf={["admin","manager"]}><ProductForm/></RequireRole>} />
            <Route path="inventory/:id" element={<RequireRole anyOf={["admin","manager"]}><ProductDetailModern/></RequireRole>} />
            <Route path="inventory/:id/edit" element={<RequireRole anyOf={["admin","manager"]}><ProductForm/></RequireRole>} />
            <Route path="categories" element={<RequireRole anyOf={["admin","manager"]}><Categories/></RequireRole>} />
            <Route path="service-categories" element={<RequireRole anyOf={["admin","manager"]}><ServiceCategories/></RequireRole>} />
            <Route path="services" element={<RequireRole anyOf={["admin","manager"]}><Services/></RequireRole>} />
            <Route path="service-list" element={<ServiceList/>} />
            <Route path="service-pos" element={<ServicePOS/>} />
            <Route path="appointments" element={<Appointments/>} />
            <Route path="barbers" element={<RequireRole anyOf={["admin","manager"]}><Barbers/></RequireRole>} />
            <Route path="barbershop-shift" element={<BarbershopShift/>} />
            <Route path="reports" element={<SalesReports/>} />
            <Route path="reports/inventory" element={<RequireRole anyOf={["admin","manager"]}><InventoryReport/></RequireRole>} />
            <Route path="reports/cashflow" element={<RequireRole anyOf={["admin"]}><Cashflow/></RequireRole>} />
            <Route path="reports/profit-loss" element={<RequireRole anyOf={["admin"]}><ProfitLoss/></RequireRole>} />
            <Route path="reports/tax" element={<RequireRole anyOf={["admin"]}><TaxReport/></RequireRole>} />
            <Route path="stock-management" element={<RequireRole anyOf={["admin","manager"]}><StockManagement/></RequireRole>} />
            <Route path="stock-transfers" element={<RequireRole anyOf={["admin","manager"]}><StockTransfer/></RequireRole>} />
            <Route path="suppliers" element={<RequireRole anyOf={["admin","manager"]}><Suppliers/></RequireRole>} />
            <Route path="payables" element={<RequireRole anyOf={["admin","manager"]}><Payables/></RequireRole>} />
            <Route path="users" element={<RequireRole anyOf={["admin","manager"]}><Users/></RequireRole>} />
            <Route path="users/new" element={<RequireRole anyOf={["admin","manager"]}><UserNew/></RequireRole>} />
            <Route path="settings/store" element={<RequireRole anyOf={["admin"]}><StoreSettings/></RequireRole>} />
            <Route path="settings/pricing" element={<RequireRole anyOf={["admin"]}><Pricing/></RequireRole>} />
            <Route path="settings/backup" element={<RequireRole anyOf={["admin"]}><BackupRestore/></RequireRole>} />
            <Route path="settings/logs" element={<RequireRole anyOf={["admin"]}><SystemLogs/></RequireRole>} />
            <Route path="settings/printer" element={<RequireRole anyOf={["admin"]}><PrinterTest/></RequireRole>} />
            <Route path="settings/business-type" element={<RequireRole anyOf={["admin"]}><BusinessTypeSelector/></RequireRole>} />
            <Route path="expenses" element={<RequireRole anyOf={["admin","manager"]}><ExpenseManagement/></RequireRole>} />
            <Route path="test" element={<TestPage/>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)




