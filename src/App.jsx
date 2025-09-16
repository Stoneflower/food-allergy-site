import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import RestaurantDetail from './pages/RestaurantDetail';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import About from './pages/About';
import Upload from './pages/Upload';
import FoodSearch from './pages/FoodSearch';
import SupabaseTestPage from './pages/SupabaseTestPage';
import AllergyTablePage from './pages/AllergyTablePage';
import AllergySettingsPage from './pages/AllergySettingsPage';
import ProductManagementPage from './pages/ProductManagementPage';
import { RestaurantProvider } from './context/RestaurantContext';
import './App.css';

function App() {
  return (
    <RestaurantProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/foods" element={<FoodSearch />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/supabase-test" element={<SupabaseTestPage />} />
            <Route path="/allergy-table" element={<AllergyTablePage />} />
            <Route path="/allergy-settings" element={<AllergySettingsPage />} />
            <Route path="/product-management" element={<ProductManagementPage />} />
          </Routes>
        </div>
      </Router>
    </RestaurantProvider>
  );
}

export default App;