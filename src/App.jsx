import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Menu from './pages/Menu';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

import Dashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminProductDetails from './pages/admin/AdminProductDetails';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetails from './pages/admin/AdminOrderDetails';
import AdminUsers from './pages/admin/AdminUsers';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public landing page */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <main className="site-main">
                <Home />
              </main>
              <Footer />
            </>
          }
        />
        <Route path="/login" element={<><Navbar /><main className="site-main"><Login /></main></>} />
        <Route path="/register" element={<><Navbar /><main className="site-main"><Register /></main></>} />

        {/* Customer pages (navbar layout) */}
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <main className="site-main">
                <Routes>
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order-success/:id"
                    element={
                      <ProtectedRoute>
                        <OrderSuccess />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-orders"
                    element={
                      <ProtectedRoute>
                        <MyOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />

        {/* Dedicated admin login (standalone dark page, no site navbar) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin panel (sidebar layout, guarded by AdminRoute alone) */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout>
                <Routes>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/add" element={<ProductForm />} />
                  <Route path="products/edit/:id" element={<ProductForm />} />
                  <Route path="products/:id" element={<AdminProductDetails />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/:id" element={<AdminOrderDetails />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AdminLayout>
            </AdminRoute>
          }
        />
      </Routes>
    </>
  );
}
