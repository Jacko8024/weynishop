import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/auth.js';
import LoginGateModal from './components/LoginGateModal.jsx';
import PublicShell from './components/PublicShell.jsx';

import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

// Public storefront (accessible to guests + logged-in users)
import HomePage from './pages/public/HomePage.jsx';
import ProductPage from './pages/public/ProductPage.jsx';
import SearchPage from './pages/public/SearchPage.jsx';
import StorePage from './pages/public/StorePage.jsx';
import DealsPage from './pages/public/DealsPage.jsx';
import WishlistPage from './pages/public/WishlistPage.jsx';

// Buyer-protected (cart/checkout/orders only)
import BuyerLayout from './pages/buyer/Layout.jsx';
import Cart from './pages/buyer/Cart.jsx';
import Checkout from './pages/buyer/Checkout.jsx';
import BuyerOrders from './pages/buyer/Orders.jsx';
import OrderTracking from './pages/buyer/OrderTracking.jsx';

// Seller
import SellerLayout from './pages/seller/Layout.jsx';
import SellerDashboard from './pages/seller/Dashboard.jsx';
import SellerProducts from './pages/seller/Products.jsx';
import SellerOrders from './pages/seller/Orders.jsx';
import SellerProfile from './pages/seller/Profile.jsx';
import SellerCommission from './pages/seller/Commission.jsx';

// Delivery
import DeliveryLayout from './pages/delivery/Layout.jsx';
import DeliveryAvailable from './pages/delivery/Available.jsx';
import DeliveryActive from './pages/delivery/Active.jsx';
import DeliveryHistory from './pages/delivery/History.jsx';

// Admin
import AdminLayout from './pages/admin/Layout.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminLiveMap from './pages/admin/LiveMap.jsx';
import AdminDisputes from './pages/admin/Disputes.jsx';
import AdminCommission from './pages/admin/Commission.jsx';
import AdminSettings from './pages/admin/Settings.jsx';
import AdminBanners from './pages/admin/Banners.jsx';
import AdminCategories from './pages/admin/Categories.jsx';

const Protected = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

export default function App() {

  return (
    <>
    <LoginGateModal />
    <Routes>
      {/* Public storefront */}
      <Route element={<PublicShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/store/:sellerId" element={<StorePage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* BUYER — cart/checkout/orders only */}
      <Route path="/buyer" element={<Protected role="buyer"><BuyerLayout /></Protected>}>
        <Route index element={<Navigate to="/" replace />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders" element={<BuyerOrders />} />
        <Route path="orders/:id" element={<OrderTracking />} />
      </Route>

      {/* SELLER */}
      <Route path="/seller" element={<Protected role="seller"><SellerLayout /></Protected>}>
        <Route index element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="profile" element={<SellerProfile />} />
        <Route path="commission" element={<SellerCommission />} />
      </Route>

      {/* DELIVERY */}
      <Route path="/delivery" element={<Protected role="delivery"><DeliveryLayout /></Protected>}>
        <Route index element={<DeliveryAvailable />} />
        <Route path="active" element={<DeliveryActive />} />
        <Route path="history" element={<DeliveryHistory />} />
      </Route>

      {/* ADMIN */}
      <Route path="/admin" element={<Protected role="admin"><AdminLayout /></Protected>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="live" element={<AdminLiveMap />} />
        <Route path="disputes" element={<AdminDisputes />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="commission" element={<AdminCommission />} />
        <Route path="banners" element={<AdminBanners />} />
        <Route path="categories" element={<AdminCategories />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
