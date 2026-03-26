import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";
import PostJob from "./pages/PostJob";
import JobDetails from "./pages/JobDetails";
import Workspace from "./pages/Workspace";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

// Private Route Wrapper
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Web3Provider>
        <Router>
          <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/jobs" element={<Jobs />} />
              
              {/* Private Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute><Dashboard /></PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute><Profile /></PrivateRoute>
              } />
              <Route path="/post-job" element={
                <PrivateRoute><PostJob /></PrivateRoute>
              } />
              <Route path="/jobs/:id" element={
                <PrivateRoute><JobDetails /></PrivateRoute>
              } />
              <Route path="/workspace/:id" element={
                <PrivateRoute><Workspace /></PrivateRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Web3Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
