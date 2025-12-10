// App.js
import React from 'react';
import { ToastContainer } from 'react-toastify';
import SupplierManagement from './components/SupplierManagement.jsx';
import Navbar from './components/Navbar.tsx';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      
      {/* ToastContainer with center position */}
      <ToastContainer
        position="top-center"  // Changed from "top-right" to "top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <main style={{ padding: '20px', marginTop: '60px' }}>
        <SupplierManagement />
      </main>
    </div>
  );
}

export default App;