import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import RestaurantDetail from './pages/RestaurantDetail';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import About from './pages/About';
import Upload from './pages/Upload';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import FoodSearch from './pages/FoodSearch';
import IntegratedPDFProcessor from './components/IntegratedPDFProcessor';
import Family from './pages/Family';
import MyPage from './pages/MyPage';
import CsvConverter from './pages/CsvConverter';
import AdminTools from './pages/AdminTools';
import TranslationManagerPage from './pages/TranslationManagerPage';
import ImageUploadDemo from './pages/ImageUploadDemo';
import TestAllergyDataPage from './pages/TestAllergyDataPage';
import { RestaurantProvider } from './context/RestaurantContext';
import Footer from './components/Footer';
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
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/pdf-processor" element={<IntegratedPDFProcessor />} />
            <Route path="/csv-converter" element={<CsvConverter />} />
            <Route path="/admin-tools" element={<AdminTools />} />
            <Route path="/translation-manager" element={<TranslationManagerPage />} />
            <Route path="/image-upload-demo" element={<ImageUploadDemo />} />
            <Route path="/test-allergy-data" element={<TestAllergyDataPage />} />
            <Route path="/family" element={<Family />} />
            <Route path="/mypage" element={<MyPage />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </RestaurantProvider>
  );
}

export default App;