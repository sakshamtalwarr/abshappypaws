import React, { useState, useEffect, useRef } from 'react';

// Lucide React for icons
import { Home, Info, Briefcase, Image, MessageCircle, Mail, MapPin, Phone, Clock, X, PawPrint, Scissors, Droplet, Bug, Handshake, Monitor, Plus, Minus, BookOpen, MessageSquare, ShoppingBag, Bot, ArrowUpCircle, User, Edit, Trash2, PlusCircle } from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore';

const App = () => {
  // State for current page, used for simple routing
  const [currentPage, setCurrentPage] = useState('home');
  // State for tracking if AI section should be scrolled into view
  const [scrollToAI, setScrollToAI] = useState(false);
  // State for scroll-to-top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);
  // State for controlling the loading screen
  const [isLoading, setIsLoading] = useState(true);
  const [fadeEffect, setFadeEffect] = useState('fade-in');
  
  // State for AI prompt visibility (retained from user's provided code)
  const [showAiPrompt, setShowAiPrompt] = useState(true);

  // Firebase states
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // To ensure Firestore operations wait for auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // State for products (now managed by Firestore)
  const [products, setProducts] = useState([]);

  // Firebase configuration - directly provided by the user
  const firebaseConfig = {
    apiKey: "AIzaSyC6SeT6-MJecF6UO7Sckz-KTM2DUtIfgb8",
    authDomain: "abshappypaws-5bd10.firebaseapp.com",
    projectId: "abshappypaws-5bd10",
    storageBucket: "abshappypaws-5bd10.firebasestorage.app",
    messagingSenderId: "214188952783",
    appId: "1:214188952783:web:147ecddfe195a7279bbbba",
    measurementId: "G-ZGR7EM7DJ5"
  };

  // Extract projectId as appId for Firestore path
  const appId = firebaseConfig.projectId;

  // Since initialAuthToken is not provided in firebaseConfig, set it to null
  const initialAuthToken = null;

  // Firebase Initialization and Auth State Listener
  useEffect(() => {
    // Define the admin email. Make sure this matches the email you use for admin login.
    const adminEmail = "salesabshappypaws@gmail.com"; 
  

    try {
      // Initialize Firebase app
      const app = initializeApp(firebaseConfig);
      // Get Auth and Firestore instances
      const authInstance = getAuth(app);
      const firestoreInstance = getFirestore(app);
      
      // Set these instances to state so other parts of the component can use them
      setDb(firestoreInstance);
      setAuth(authInstance);

      // Listen for authentication state changes
      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          
          let userIsAdmin = false;
          // Check if the authenticated user's email matches the admin email
          if (user.email === adminEmail) {
            userIsAdmin = true;
          }

          // Fetch or create user document in Firestore
          // The path for private user data is: artifacts/{appId}/users/{userId}/
          const userDocRef = doc(firestoreInstance, `artifacts/${appId}/users/${user.uid}`);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            // If document exists, use its isAdmin status from Firestore
            // But override if the current user's email is the designated admin email.
            const firestoreIsAdmin = userDocSnap.data().isAdmin || false;
            setIsAdmin(firestoreIsAdmin || userIsAdmin); // Prioritize explicit admin email
            
            // If the user is identified as admin by email but Firestore doesn't reflect it, update Firestore
            if (userIsAdmin && !firestoreIsAdmin) {
              await setDoc(userDocRef, { isAdmin: true }, { merge: true });
            }
          } else {
            // If document doesn't exist (e.g., first anonymous sign-in or new email login), create it
            // Set isAdmin based on whether the email matches the adminEmail
            await setDoc(userDocRef, { isAdmin: userIsAdmin }, { merge: true });
            setIsAdmin(userIsAdmin);
          }
        } else {
          setUserId(null);
          setIsAdmin(false);
        }
        setIsAuthReady(true); // Auth state is now ready, allowing Firestore operations
      });

      // Sign in with custom token if provided by Canvas, otherwise sign in anonymously
      const signIn = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            // Only sign in anonymously if no user is currently authenticated
            if (!authInstance.currentUser) {
              await signInAnonymously(authInstance);
            }
          }
        } catch (error) {
          console.error("Firebase anonymous sign-in or custom token sign-in error:", error);
          // Handle specific errors like 'auth/invalid-custom-token' if needed
          // You might want to display a user-friendly message for sign-in issues
        }
      };
      signIn(); // Call the sign-in function immediately

      // Cleanup function for the auth state listener
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase initialization error:", error);
      // You might want to display a user-facing error message here if Firebase fails to initialize
    }
  }, [appId, firebaseConfig, initialAuthToken]); // Dependencies for useEffect: ensuring it re-runs if these change (though they typically won't)


  // Effect for the loading screen animation
  useEffect(() => {
    // Start fade out after 1.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setFadeEffect('fade-out');
    }, 1500);

    // Hide loading screen completely after fade out animation (total 2 seconds)
    const hideLoaderTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Matches CSS transition duration + fadeOutTimer

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(hideLoaderTimer);
    };
  }, []);

  // Effect to handle scroll-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) { // Show button after scrolling 300px
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Effect for AI prompt visibility (retained from user's provided code)
  useEffect(() => {
    // Show prompt for 5 seconds on initial load, then hide
    const promptTimer = setTimeout(() => {
      setShowAiPrompt(false);
    }, 5000); // Hide after 5 seconds

    return () => clearTimeout(promptTimer);
  }, []);

  const handleAIShortcutClick = () => {
    setCurrentPage('faqs');
    setShowAiPrompt(false); // Hide prompt if user clicks the button
    // Use a timeout to allow the page to render before scrolling
    setTimeout(() => {
      setScrollToAI(true); // Signal FAQsPage to scroll to AI section
    }, 100); // Small delay
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on navigation
  };

  const handlePageChangeAndScrollToTop = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on navigation
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Login handler with Firebase authentication
  const handleLogin = async (email, password) => {
    setLoginError(''); // Clear previous errors
    if (!auth) {
      setLoginError('Firebase authentication not initialized.');
      return false;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoginError(''); // Clear error on successful login
      // isAdmin state will be updated by the onAuthStateChanged listener
      setCurrentPage('admin-dashboard'); // Redirect to admin dashboard on successful login
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(`Login failed: ${error.message}`);
      return false;
    }
  };

  // Logout handler with Firebase authentication
  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    // isLoggedIn and isAdmin states will be reset by the onAuthStateChanged listener
    setCurrentPage('home'); // Redirect to home page on logout
  };

  // Handler to close the AI prompt manually.
  const handleCloseAiPrompt = () => {
    setShowAiPrompt(false);
  };

  // Helper function to render different pages based on state
  const renderPage = () => {
    if (currentPage === 'login') {
      return <LoginForm onLogin={handleLogin} error={loginError} />;
    }
    // Admin dashboard protected by isAdmin state
    if (currentPage === 'admin-dashboard') {
      if (isAuthReady && isAdmin) { // Only show if auth is ready AND user is admin
        return <AdminDashboard db={db} userId={userId} isAuthReady={isAuthReady} products={products} setProducts={setProducts} appId={appId} />;
      } else if (isAuthReady && !isAdmin) { // Show unauthorized if auth is ready but not admin
        return (
          <div className="py-24 px-6 md:px-12 bg-red-100 min-h-screen text-center flex flex-col items-center justify-center mt-[88px]">
            <h2 className="text-4xl font-bold text-red-700 mb-4 font-playfair">Unauthorized Access</h2>
            <p className="text-lg text-red-600 mb-8">You do not have permission to access the Admin Dashboard. Please log in with admin credentials.</p>
            <button
              onClick={() => setCurrentPage('home')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
            >
              Go to Home
            </button>
          </div>
        );
      } else { // Show loading if auth is not ready yet
        return (
          <div className="py-24 px-6 md:px-12 bg-gray-100 min-h-screen text-center flex flex-col items-center justify-center mt-[88px]">
            <h2 className="text-4xl font-bold text-gray-700 mb-4 font-playfair">Loading Authentication...</h2>
            <p className="text-lg text-gray-600 mb-8">Please wait while we verify your access.</p>
          </div>
        );
      }
    }
    
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={handlePageChangeAndScrollToTop} />;
      case 'about':
        return <AboutPage setCurrentPage={handlePageChangeAndScrollToTop} />;
      case 'services':
        return <ServicesPage setCurrentPage={handlePageChangeAndScrollToTop} />;
      case 'products':
        return <ProductsPage products={products} setCurrentPage={handlePageChangeAndScrollToTop} />; // Pass products to ProductsPage
      case 'product-gallery':
        return <ProductGalleryPage products={products} setCurrentPage={handlePageChangeAndScrollToTop} />; // Pass products to ProductGalleryPage
      case 'gallery':
        return <GalleryPage />;
      case 'testimonials':
        return <TestimonialsPage setCurrentPage={handlePageChangeAndScrollToTop} />;
      case 'appointment':
        return <AppointmentPage setCurrentPage={handlePageChangeAndScrollToTop} />;
      case 'faqs':
        return <FAQsPage scrollToAI={scrollToAI} setScrollToAI={setScrollToAI} />;
      default:
        return <HomePage setCurrentPage={handlePageChangeAndScrollToTop} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-lato bg-gray-50 text-gray-800">
      {isLoading && <LoadingScreen fadeEffect={fadeEffect} />}

      <div className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Navbar
          setCurrentPage={handlePageChangeAndScrollToTop}
          currentPage={currentPage}
          isLoggedIn={userId !== null} // Check if userId exists for isLoggedIn
          isAdmin={isAdmin}
          onLogout={handleLogout}
        />
        <main className="flex-grow">
          {renderPage()}
        </main>
        <Footer />

        {/* Floating AI Assistant Shortcut Button and Prompt */}
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
          <button
            onClick={handleAIShortcutClick}
            className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white p-4 rounded-full shadow-lg transition duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center group relative"
            aria-label="Talk to AI Assistant"
          >
            <PawPrint className="h-6 w-6 relative" />
            <Bot className="h-4 w-4 absolute top-1 right-1 text-yellow-300 group-hover:text-white transition-colors duration-300" />
          </button>
          {showAiPrompt && (
            <div className="absolute bottom-full right-0 mb-4 mr-4 p-1 bg-[#0AB9C6] text-white text-sm rounded-md shadow-md opacity-100 animate-fadeInRight max-w-[250px] text-center flex items-center justify-between">
              <span>Click here to talk to pet AI assistant!</span>
              <button
                onClick={handleCloseAiPrompt} // Close button for AI prompt
                className="ml-2 p-1 rounded-full hover:bg-yellow-700 transition-colors duration-400"
                aria-label="Close AI prompt"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {/* Arrow for the tooltip */}
              <div className="absolute top-full right-4 w-0 h-0 border-t-[6px] border-l-[6px] border-r-[6px] border-t-[#0AB9C6] border-l-transparent border-r-transparent transform -translate-x-1/2"></div>
            </div>
          )}
        </div>


        {/* Floating Social Media Buttons (retained from user's provided code) */}
        <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 flex flex-col space-y-3 z-50">
            <a
                href="https://www.facebook.com/share/1EDmkyYRoj/" // Replace with actual Facebook page URL
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center"
                aria-label="Visit our Facebook page"
            >
                {/* Facebook SVG Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                >
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.353c-.562 0-.671.29-.671.659v1.841h2.545l-.42 2.736h-2.125v6.529h-3v-6.529h-2.133v-2.736h2.133v-1.91c0-2.163 1.054-3.478 3.427-3.478h2.215v3z"/>
                </svg>
            </a>
            <a
                href="https://www.instagram.com/abhappypaws?igsh=MXY0OGJhZGl4YWRqZA==" // Replace with actual Instagram page URL
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-full shadow-lg transition duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center"
                aria-label="Visit our Instagram page"
            >
                {/* Instagram SVG Icon */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.585-.012-4.85-.07c-3.254-.148-4.77-1.691-4.919-4.919-.058-1.265-.07-1.646-.07-4.85s.012-3.585.07-4.85c.149-3.227 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.073 4.948.073s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
            </a>
        </div>


        {/* Scroll-to-Top Button */}
        {showScrollTop && (
          <button
            onClick={handleScrollToTop}
            className="fixed bottom-20 right-4 md:bottom-24 md:right-6 bg-gray-700 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition duration-300 transform hover:scale-110 active:scale-95 z-40"
            aria-label="Scroll to top"
          >
            <ArrowUpCircle className="h-6 w-6" />
          </button>
        )}

        {/* Live Time IST - Positioned below navbar */}
        <LiveTimeIST />
      </div>
    </div>
  );
};

// Loading Screen Component
const LoadingScreen = ({ fadeEffect }) => {
  return (
    <div className={`fixed inset-0 bg-gray-50 flex items-center justify-center z-50 transition-opacity duration-500 ${fadeEffect === 'fade-out' ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`text-center transition-all duration-500 ${fadeEffect === 'fade-out' ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="relative inline-block">
          <PawPrint className="text-[#0AB9C6] h-24 w-24 transform rotate-[-15deg] animate-bounce-slow" />
          <Bot className="h-12 w-12 absolute top-4 left-1/2 -translate-x-1/2 text-yellow-300 animate-pulse-slow" />
        </div>
        {/* Applied Playfair Display */}
        {/* Replaced text with image logo as requested */}
        <img
          src="https://pawclub.in/wp-content/uploads/2022/07/ABs-Happy-Paws_Bengaluru4-1024x575.jpg" // Path to your logo image
          alt="AB Happy Paws Logo"
          className="mx-auto mt-4 w-48 md:w-64 h-auto" // Adjust width as needed
        />
        <p className="text-lg text-gray-700 mt-2">Loading happiness...</p>
      </div>
    </div>
  );
};

// Live Time IST Component
const LiveTimeIST = () => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format for IST, India locale
      const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata', // Set to Indian Standard Time
      };
      setCurrentTime(now.toLocaleTimeString('en-IN', options));
    };

    updateTime(); // Set time immediately on mount
    const intervalId = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  return (
    // Adjusted top position to clear the fixed navbar
    <div className="fixed top-28 right-4 md:top-28 md:right-4 z-40 bg-gray-800 text-white text-sm px-3 py-1 rounded-full shadow-md animate-fadeIn">
      {currentTime} IST
    </div>
  );
};


// Navbar Component
const Navbar = ({ setCurrentPage, currentPage, isLoggedIn, isAdmin, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappNumber = '918660764838'; // Consistent WhatsApp number

  const navItems = [
    { name: 'Home', icon: Home, page: 'home' },
    { name: 'Services', icon: Briefcase, page: 'services' },
    { name: 'Products', icon: ShoppingBag, page: 'products' },
    { name: 'FAQs', icon: MessageSquare, page: 'faqs' },
    { name: 'Appointment', icon: Mail, page: 'appointment' },
  ];

  return (
    <nav className="bg-white/70 backdrop-blur-md shadow-lg py-4 px-6 md:px-12 flex justify-between items-center fixed w-full z-50 rounded-b-lg border-b border-gray-100">
      {/* Brand Logo/Name */}
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
        <PawPrint className="text-[#0AB9C6] h-9 w-9 transform rotate-[-15deg]" /> {/* Teal paw print, slightly rotated */}
        {/* Replaced text with image logo as requested */}
        <img
          src="https://pawclub.in/wp-content/uploads/2022/07/ABs-Happy-Paws_Bengaluru4.jpg" // Path to your logo image
          alt="AB Happy Paws Logo"
          className="h-11 w-auto" // Adjust height as needed
        />
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex space-x-8 items-center">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={`flex items-center space-x-2 text-lg font-semibold px-3 py-2 rounded-md transition-all duration-300
              ${currentPage === item.page ? 'text-[#0AB9C6] bg-gray-100' : 'text-gray-700 hover:text-[#0AB9C6] hover:bg-gray-50'}`}
            onClick={() => setCurrentPage(item.page)}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </button>
        ))}
        {isAdmin && (
          <button
            className={`flex items-center space-x-2 text-lg font-semibold px-3 py-2 rounded-md transition-all duration-300
              ${currentPage === 'admin-dashboard' ? 'text-[#0AB9C6] bg-gray-100' : 'text-gray-700 hover:text-[#0AB9C6] hover:bg-gray-50'}`}
            onClick={() => setCurrentPage('admin-dashboard')}
          >
            <Monitor className="w-5 h-5" />
            <span>Admin Panel</span>
          </button>
        )}
        <a
          href={`https://wa.me/${whatsappNumber}`} // WhatsApp link for "Talk to Us"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-6 bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-bold py-2.5 px-6 rounded-full shadow-md transition duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2"
        >
          <Phone className="w-5 h-5" />
          <span>Talk to Us</span>
        </a>
        {!isLoggedIn ? (
          <button
            onClick={() => setCurrentPage('login')}
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2"
          >
            <User className="w-5 h-5" />
            <span>Login as Admin</span>
          </button>
        ) : (
          <button
            onClick={onLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition duration-300 transform hover:scale-105 active:scale-95 flex items-center space-x-2"
          >
            <User className="w-5 h-5" />
            <span>Logout (Admin)</span>
          </button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-[#0AB9C6] focus:outline-none transition-colors duration-200">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/90 backdrop-blur-md shadow-lg py-4 border-t border-gray-200 transition-transform transform duration-300 ease-in-out origin-top rounded-b-lg">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`block w-full text-left px-6 py-3 text-lg font-medium hover:bg-gray-100 transition-colors duration-200
                ${currentPage === item.page ? 'text-[#0AB9C6] bg-gray-100' : 'text-gray-700'}`}
              onClick={() => {
                setCurrentPage(item.page);
                setIsOpen(false);
              }}
            >
              <item.icon className="inline-block w-5 h-5 mr-3" />
              {item.name}
            </button>
          ))}
          {isAdmin && (
            <button
              className={`block w-full text-left px-6 py-3 text-lg font-medium hover:bg-gray-100 transition-colors duration-200
                ${currentPage === 'admin-dashboard' ? 'text-[#0AB9C6] bg-gray-100' : 'text-gray-700'}`}
              onClick={() => {
                setCurrentPage('admin-dashboard');
                setIsOpen(false);
              }}
            >
              <Monitor className="inline-block w-5 h-5 mr-3" />
              <span>Admin Panel</span>
            </button>
          )}
          <a
            href={`https://wa.me/${whatsappNumber}`} // WhatsApp link for "Talk to Us"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-left px-6 py-3 text-lg font-medium bg-[#0AB9C6] text-white hover:bg-[#089AA6] transition-colors duration-200 mt-2 rounded-full mx-6 md:mx-auto"
          >
            <Phone className="inline-block w-5 h-5 mr-3" />
            Talk to Us
          </a>
          {!isLoggedIn ? (
            <button
              onClick={() => { setCurrentPage('login'); setIsOpen(false); }}
              className="block w-full text-left px-6 py-3 text-lg font-medium bg-gray-700 text-white hover:bg-gray-800 transition-colors duration-200 mt-2 rounded-full mx-6 md:mx-auto"
            >
              <User className="inline-block w-5 h-5 mr-3" />
              <span>Login as Admin</span>
            </button>
          ) : (
            <button
              onClick={() => { onLogout(); setIsOpen(false); }}
              className="block w-full text-left px-6 py-3 text-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 mt-2 rounded-full mx-6 md:mx-auto"
            >
              <User className="inline-block w-5 h-5 mr-3" />
              <span>Logout (Admin)</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

// Footer Component
const Footer = () => {
  const whatsappNumber = '918660764838'; // Consistent WhatsApp number

  return (
    <footer className="bg-gray-900 text-gray-200 py-10 px-6 md:px-12 mt-auto rounded-t-lg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
        {/* About Section */}
        {/* Applied Playfair Display */}
        <div>
          <h3 className="text-2xl font-semibold mb-5 text-white font-playfair">About AB Happy Paws</h3>
          <p className="text-base leading-relaxed">
            Dedicated to providing the best care for your beloved pets. From expert grooming to playful daycare and effective training, we ensure
            every paw is happy and healthy.
          </p>
        </div>

        {/* Quick Links */}
        {/* Applied Playfair Display */}
        <div>
          <h3 className="text-2xl font-semibold mb-5 text-white font-playfair">Quick Links</h3>
          <ul className="space-y-3 text-base">
            <li><a href="#" className="hover:text-[#0AB9C6] transition-colors duration-200">Home</a></li>
            <li><a href="#" className="hover:text-[#0AB9C6] transition-colors duration-200">Services</a></li>
            <li><a href="#" className="hover:text-[#0AB9C6] transition-colors duration-200">Products</a></li>
            <li><a href="#" className="hover:text-[#0AB9C6] transition-colors duration-200">FAQs</a></li>
            <li><a href="#" className="hover:text-[#0AB9C6] transition-colors duration-200">Appointment</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        {/* Applied Playfair Display */}
        <div>
          <h3 className="text-2xl font-semibold mb-5 text-white font-playfair">Contact Us</h3>
          <p className="flex items-center justify-center md:justify-start text-base mb-3">
            <MapPin className="w-5 h-5 mr-3 text-[#0AB9C6]" /> # 64, 10th cross, 12th main, Railway Parallel Rd, Kumara Park West, Seshadripuram, Bengaluru, Karnataka 560020
          </p>
          <p className="flex items-center justify-center md:justify-start text-base mb-3">
            <Phone className="w-5 h-5 mr-3 text-[#0AB9C6]" /> <a href={`tel:${whatsappNumber}`} className="hover:text-[#0AB9C6] transition-colors duration-200">{whatsappNumber}</a>
          </p>
          <p className="flex items-center justify-center md:justify-start text-base mb-3">
            <Mail className="w-5 h-5 mr-3 text-[#0AB9C6]" /> <a href="mailto:salesabshappypaws@gmail.com" className="hover:text-[#0AB9C6] transition-colors duration-200">salesabshappypaws@gmail.com</a>
          </p>
          <p className="flex items-center justify-center md:justify-start text-base">
            <Clock className="w-5 h-5 mr-3 text-[#0AB9C6]" /> Mon - Sun: 10:00 AM - 10:00 PM
          </p>
        </div>
      </div>
      <div className="border-t border-gray-700 mt-10 pt-8 text-center text-sm">
        © {new Date().getFullYear()} AB's Happy Paws. All rights reserved. <br />
        <a href="#" className="hover:text-[#0AB9C6] transition-colors duration-200 mr-4">Privacy Policy</a>
        <a href="#" className="hover:text-[#0AB9C6] transition-colors duration-200">Cookies Policy</a>
      </div>
    </footer>
  );
};

// Home Page Component
const HomePage = ({ setCurrentPage }) => {
  const aboutRef = useRef(null);
  const [aboutInView, setAboutInView] = useState(false);

  // States for AI Assistant
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const randomPrompts = [
    "What are the best dog breeds for first-time owners?",
    "How do I train my puppy to stop biting?",
    "What kind of food should I feed my cat?",
    "How often should I brush my long-haired dog?",
    "What are common signs of illness in pets?",
    "How do I introduce a new pet to my existing one?",
    "What vaccinations do puppies need?",
    "How do I prevent my cat from scratching furniture?",
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAboutInView(true);
          observer.unobserve(entry.target); // Stop observing once it's in view
        }
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.2, // 20% of the section must be visible
      }
    );

    if (aboutRef.current) {
      observer.observe(aboutRef.current);
    }

    return () => {
      if (aboutRef.current) {
        observer.unobserve(aboutRef.current);
      }
    };
  }, []);

  const topServices = [
    { name: 'Full Grooming', icon: '🐕' },
    { name: 'Haircut', icon: '✂️' },
    { name: 'Flea & Tick Treatment', icon: '❌' },
    { name: 'Wash & Blow Dry', icon: '🌬️' },
    { name: 'Offline Pet Health Consultation', icon: '🏥' },
    { name: 'Nail Trimming', icon: '🐾' },
    { name: 'Online Consultation For Your Pet!', icon: '📱', special: true },
  ];

  const petFacts = [
    {
      title: "🐾 Unmatched Companionship",
      description: "Pets are more than just animals — they are family. Our services are designed to support the special bond between you and your furry companion. Whether you are adopting a new friend or caring for a lifelong buddy, we are here to help you provide the love they deserve.",
      gif: "https://gifsec.com/wp-content/uploads/2022/09/happy-puppy-gif-8.gif" // Dog wagging tail
    },
    {
      title: "Stress Relief",
      description: "Spending time with pets is proven to reduce anxiety and boost emotional health. That’s why we offer grooming and care services that keep your pets relaxed, happy, and healthy — making life better for both of you.",
      gif: "https://media.tenor.com/7ZElkaxrDvoAAAAM/stress-relief-stress.gif" // Cat purring/kneading
    },
    {
      title: "Active Lifestyle",
      description: "A healthy pet means a happier, more active you. From nutritious foods and health checkups to grooming that keeps them ready for play, we help ensure your pet stays energetic and full of life.",
      gif: "https://s.yimg.com/ny/api/res/1.2/cdPjf60wDAPOT7d.ePLy1A--/YXBwaWQ9aGlnaGxhbmRlcjt3PTcwNTtoPTcwNQ--/https://media.zenfs.com/en/homerun/feed_manager_auto_publish_494/4f64ecc4a6ef0720b6458601bddc0e99" // Dog running happily
    }
  ];

  const handleAiQuestionChange = (e) => {
    setAiQuestion(e.target.value);
  };

  const generateRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    setAiQuestion(randomPrompts[randomIndex]);
    setAiResponse(''); // Clear previous AI response
    setAiError(''); // Clear previous AI error
  };

  const askAi = async () => {
    if (!aiQuestion.trim()) {
      setAiError("Please enter a question or generate a random one.");
      return;
    }
    setLoadingAi(true);
    setAiResponse('');
    setAiError('');

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: aiQuestion }] });
      const payload = { contents: chatHistory };
      const apiKey = ""; // Canvas will provide this at runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setAiResponse(text);
      } else {
        setAiError("Sorry, I couldn't generate a response. Please try again.");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setAiError("An error occurred while fetching a response. Please try again later.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <section className="min-h-screen flex flex-col pt-[88px]">
      {/* Hero Section */}
      <div className="relative h-screen-minus-nav flex items-center justify-center bg-cover bg-center parallax-bg"
    style={{ backgroundImage: "url(https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTAzL2pvYjE1NzEtcmVtaXgtMTBhLWEuanBn.jpg)" }}

      >
        <div className="absolute inset-0 bg-black opacity-55 rounded-b-lg"></div>
        <div className="text-center text-white p-8 rounded-lg relative z-10 max-w-4xl mx-auto animate-fadeInUp">
          <h2 className="text-base md:text-xl font-semibold mb-2 text-[#0AB9C6] uppercase tracking-wide font-lato">Welcome to AB's Happy Paws</h2>
          {/* Applied Playfair Display */}
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight drop-shadow-lg font-playfair">
            Where Every <span className="text-[#0AB9C6]">🐾</span> is Pampered!
          </h1>
          <p className="text-xl md:text-2xl mb-10 leading-relaxed">
            Expert care, premium products, stress-free experience. Your pets deserve the best, and we deliver exceptional results.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setCurrentPage('appointment')}
              className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-bold py-4 px-10 rounded-full shadow-xl transition duration-300 transform hover:scale-105 active:scale-95 ring-2 ring-white"
            >
              Book Appointment
            </button>
            <button
              onClick={() => setCurrentPage('services')}
              className="bg-transparent border-2 border-white text-white font-bold py-4 px-10 rounded-full shadow-xl transition duration-300 transform hover:scale-105 active:scale-95 hover:bg-white hover:text-[#0AB9C6]"
            >
              View All Services
            </button>
          </div>
        </div>
      </div>

      {/* About Section Summary - Now with IntersectionObserver for animation */}
      <div
        ref={aboutRef}
        className={`bg-white py-20 px-6 md:px-12 transition-all duration-1000 ease-out ${
          aboutInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          {/* Applied Playfair Display */}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-10 relative font-playfair">
            About <span className="text-[#0AB9C6]">AB Happy Paws</span>
            <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
          </h2>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto mb-12">
            At AB Happy Paws, our journey began with a profound love for animals and a vision to create a haven where every pet feels cherished and understood. We are more than just a service provider; we are a family of passionate animal lovers dedicated to enhancing the lives of your furry companions.
          </p>
          <button
            onClick={() => setCurrentPage('about')}
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
          >
            Learn More About Us
          </button>
        </div>
      </div>

      {/* Value Proposition / Animated Sections */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Applied Playfair Display */}
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 relative font-playfair">
            Why Choose <span className="text-[#0AB9C6]">Our Services</span>?
            <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
          </h2>
          {petFacts.map((fact, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 mb-20 md:mb-24 last:mb-0 bg-white p-8 rounded-xl shadow-xl border-l-4 border-[#0AB9C6] transform transition duration-500 hover:scale-[1.01]`}
            >
              <div className="md:w-1/2 flex justify-center animate-fadeIn">
                <img
                  src={fact.gif}
                  alt={fact.title}
                  className="w-full max-w-sm h-auto rounded-lg shadow-2xl object-cover border-4 border-white"
                />
              </div>
              <div className="md:w-1/2 text-center md:text-left animate-slideInUp">
                {/* Applied Playfair Display */}
                <h3 className="text-3xl font-bold text-gray-900 mb-4 font-playfair">{fact.title}</h3>
                <p className="text-lg text-gray-700 leading-relaxed">{fact.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Rated Services Section */}
      <div className="bg-white py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          {/* Applied Playfair Display */}
          <h3 className="text-4xl font-bold mb-10 text-gray-900 relative font-playfair">
            Our Top Rated <span className="text-[#0AB9C6]">Services</span>:
            <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
          </h3>
          <p className="text-lg text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover the exceptional care that makes tails wag and purrs rumble. From pampering grooms to expert health advice, we offer everything your beloved companion needs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {topServices.map((service, index) => (
              <div key={index} className="bg-blue-50 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center text-center transition duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-blue-200">
                <span className="text-5xl mb-4 text-[#0AB9C6]">{service.icon}</span>
                <p className="text-xl font-semibold text-gray-800">{service.name}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage('services')}
            className="mt-16 bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-bold py-4 px-10 rounded-full shadow-xl transition duration-300 transform hover:scale-105 active:scale-95 ring-2 ring-white"
          >
            View All Services
          </button>
        </div>
      </div>

      {/* Products Section Preview */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          {/* Applied Playfair Display */}
          <h3 className="text-4xl font-bold mb-10 text-gray-900 relative font-playfair">
            Essential <span className="text-[#0AB9C6]">Pet Products</span>
            <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
          </h3>
          <p className="text-lg text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
            From nutritious food to fun toys and comfortable accessories, find everything your pet needs for a happy and healthy life.
          </p>
          <button
            onClick={() => setCurrentPage('product-gallery')} // Navigate to new Product Gallery Page
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center mx-auto space-x-2"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>ACCESSORIES | PRODUCTS</span>
          </button>
        </div>
      </div>

      {/* AI Pet Assistant Section (on Home Page) */}
      <div className="bg-[#e0f7fa] py-20 px-6 md:px-12 text-center rounded-b-lg">
        <div className="max-w-4xl mx-auto p-10 rounded-xl shadow-lg border-2 border-[#0AB9C6]">
          <h3 className="text-4xl font-bold text-gray-900 mb-8 flex items-center justify-center font-playfair">
            <Bot className="w-10 h-10 mr-4 text-[#0AB9C6]" />
            Talk to <span className="text-[#0AB9C6]">✨AI Pet Assistant✨</span>
          </h3>
          <p className="text-lg text-gray-700 mb-8">
            Ask any general question about pet care, health, or behavior, and our AI will provide helpful insights!
          </p>
          <div className="flex flex-col md:flex-row gap-4 mb-6 max-w-2xl mx-auto">
            <input
              type="text"
              className="flex-grow shadow-sm appearance-none border border-gray-300 rounded-lg py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-3 focus:ring-[#0AB9C6] focus:border-transparent transition-all duration-200"
              placeholder="e.g., How often should I walk my dog?"
              value={aiQuestion}
              onChange={handleAiQuestionChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  askAi();
                }
              }}
            />
            <button
              onClick={askAi}
              disabled={loadingAi}
              className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAi ? 'Asking AI...' : 'Ask AI'}
            </button>
          </div>
          <button
            onClick={generateRandomPrompt}
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 transform hover:scale-105 active:scale-95 mb-6"
          >
            Generate Random Prompt
          </button>
          {aiError && (
            <p className="text-red-600 mt-4 text-lg font-medium">{aiError}</p>
          )}
          {aiResponse && (
            <div className="mt-8 p-6 bg-white rounded-lg shadow-md text-left border border-gray-200">
              <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center font-playfair">
                <Bot className="w-6 h-6 mr-3 text-gray-600" />
                AI Assistant Response:
              </h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}
        </div>
      </div>


      {/* Book Appointment Section */}
      <div className="bg-[#0AB9C6] bg-opacity-80 py-20 px-6 md:px-12 text-center text-white">
        <div className="max-w-4xl mx-auto">
          {/* Applied Playfair Display */}
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-playfair">Ready to Pamper Your Pet?</h2>
          <p className="text-xl md:text-2xl mb-10">Book an appointment with our expert groomers and trainers today!</p>
          <button
            onClick={() => setCurrentPage('appointment')}
            className="bg-white hover:bg-gray-100 text-[#0AB9C6] font-bold py-4 px-10 rounded-full shadow-xl transition duration-300 transform hover:scale-105 active:scale-95 ring-2 ring-white"
          >
            Book Appointment Now!
          </button>
        </div>
      </div>
    </section>
  );
};

// About Page Component (Unchanged from previous)
const AboutPage = ({ setCurrentPage }) => {
  const qualities = [
    { name: 'Expert Groomers', description: 'Our team comprises highly trained and certified professionals.' },
    { name: 'Compassionate Care', description: 'Every pet receives love, patience, and gentle handling.' },
    { name: 'Tailored Services', description: 'Customized solutions to meet your pet\'s unique needs.' },
    { name: 'Exceptional Results', description: 'We aim for perfection in every service, ensuring pet and owner satisfaction.' },
    { name: 'Hygienic Environment', description: 'State-of-the-art facilities maintained to the highest cleanliness standards.' },
    { name: 'Stress-Free Experience', description: 'Designed to minimize anxiety and maximize comfort for your pets.' },
  ];

  const teamMembers = [
    {
      name: 'Miss. Priya',
      role: 'Owner of AB\'s Happy Paws, Senior Groomer',
      description: 'Breed-specific grooming, creative styling, and gentle care.',
      experience: '15+ Years',
      image: 'https://placehold.co/150x150/ffb6c1/000000?text=Priya',
    },
    {
      name: 'Mr. Abhishek',
      role: 'Owner of AB\'s Happy Paws',
      description: 'Oversees operations, ensuring top-tier service quality and customer satisfaction.',
      experience: '10 Years',
      image: 'https://placehold.co/150x150/87ceeb/000000?text=Abhishek',
    },
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-white mt-[88px]"> {/* Adjusted mt for navbar clearance */}
      <div className="max-w-7xl mx-auto">
        {/* Applied Playfair Display */}
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 relative font-playfair">
          About <span className="text-[#0AB9C6]">AB Happy Paws</span>
          <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
        </h2>
        <div className="flex flex-col md:flex-row items-center gap-16 mb-20">
          <div className="md:w-1/2 animate-slideInLeft">
            <img
              src="https://placehold.co/600x400/90ee90/000000?text=Caring+for+Pets"
              alt="Caring for Pets"
              className="rounded-xl shadow-2xl w-full h-auto object-cover border-4 border-white"
            />
          </div>
          <div className="md:w-1/2 text-lg text-gray-700 space-y-7 animate-slideInRight">
            <p>
              At AB Happy Paws, our journey began with a profound love for animals and a vision to create a haven where every pet feels cherished and understood. We are more than just a service provider; we are a family of passionate animal lovers dedicated to enhancing the lives of your furry companions.
            </p>
            <p>
              Our team comprises highly trained and compassionate professionals, specializing in everything from playful daycare activities and gentle grooming to advanced behavioral training. We pride ourselves on building lasting relationships with both pets and their parents, fostering trust and delivering personalized care that meets unique needs.
            </p>
            <p>
              We understand the joy and responsibility that comes with pet ownership, and we strive to make your life easier by providing reliable, high-quality services. Join the AB Happy Paws community, where happy tails and purrs are guaranteed!
            </p>
            <button className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95" onClick={() => setCurrentPage('appointment')}>
              Book Appointment
            </button>
          </div>
        </div>

        {/* Qualities Section */}
        <div className="mb-20">
          {/* Applied Playfair Display */}
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-10 font-playfair">Why Choose <span className="text-[#0AB9C6]">AB's Happy Paws</span>?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {qualities.map((quality, index) => (
              <div key={index} className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:scale-105"> {/* Changed background to blue-50 */}
                <h4 className="text-xl font-bold text-[#0AB9C6] mb-2">{quality.name}</h4>
                <p className="text-gray-700 text-base">{quality.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Peace of Mind Section */}
        <div className="bg-[#0AB9C6] bg-opacity-20 p-10 rounded-xl text-center shadow-xl border-2 border-[#0AB9C6] mb-20"> {/* Increased opacity for better contrast */}
          <h3 className="text-4xl font-bold text-gray-900 mb-6 font-playfair">Peace of Mind Grooming: <span className="text-[#0AB9C6]">Your Pets are 100% Safe</span></h3> {/* Applied Playfair Display */}
          <p className="text-lg text-gray-700 mb-8">
            100% Safe for Your Beloved Pets. Gentle, expert care with guaranteed well-being. Trust our dedicated team!
          </p>
          <button className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95" onClick={() => setCurrentPage('appointment')}>
            Book Appointment
          </button>
        </div>

        {/* Team Section */}
        <div>
          <h3 className="text-4xl font-bold text-center text-gray-900 mb-16 relative font-playfair"> {/* Applied Playfair Display */}
            Meet Our <span className="text-[#0AB9C6]">Expert Team</span>
            <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
          </h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-16">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-emerald-50 p-8 rounded-xl shadow-lg text-center transform transition duration-300 hover:scale-[1.03] hover:shadow-xl border-t-4 border-emerald-200"> {/* Changed background to emerald-50 and border to emerald-200 */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-36 h-36 rounded-full mx-auto mb-6 object-cover object-center border-4 border-white shadow-md"
                />
                <h4 className="text-2xl font-bold text-gray-900 mb-2 font-playfair">{member.name}</h4> {/* Applied Playfair Display */}
                <p className="text-lg font-semibold text-[#0AB9C6] mb-3">{member.role}</p>
                <p className="text-gray-700 text-base mb-3 leading-relaxed">{member.description}</p>
                <p className="text-gray-600 text-sm font-medium">Experience: {member.experience}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Services Page Component
const ServicesPage = ({ setCurrentPage }) => {
  const services = [
    {
      name: 'Full Grooming',
      description: 'Pamper your furry friend with our premium grooming services! From a refreshing bath to a stylish trim, we ensure your pet looks and feels their absolute best. Because every pet deserves to be clean, comfortable, and happy!',
      icon: '🐕',
      image: 'https://static.vecteezy.com/system/resources/previews/005/447/163/non_2x/pet-grooming-for-dogs-and-cats-in-flat-cartoon-hand-drawn-background-illustration-the-main-tools-which-are-used-in-beauty-salon-for-poster-or-banner-vector.jpg',
    },
    {
      name: 'Haircut',
      description: 'Stylish haircuts or trims to maintain a neat and manageable fur length, customized to your pet\'s breed and your preferences.',
      icon: '✂️',
      image: 'https://img.freepik.com/free-vector/pet-care-concept-illustration_114360-9419.jpg?ga=GA1.1.2010164998.1740327420&semt=ais_hybrid',
    },
    {
      name: 'Flea & Tick Treatment',
      description: 'Keep your pet safe from fleas and ticks with our effective treatments. From spot-on solutions to flea collars and shampoos, we offer long-lasting protection for a happy, itch-free pet!',
      icon: '❌',
      image: 'https://us.123rf.com/450wm/prettyvectors/prettyvectors2304/prettyvectors230400286/203509819-animal-pet-dog-cat-tick-attack-season-concept-vector-graphic-design-element-illustration.jpg?ver=6',
    },
    {
      name: 'Wash & Blow Dry',
      description: 'Thorough cleaning and shampooing of your pet to keep their coat fresh, shiny, and free of dirt and odor. Includes a gentle blow dry for a fluffy finish.',
      icon: '🌬️',
      image: 'https://img.freepik.com/premium-vector/professional-care-service-pets-salon-groomer-dries-fur-happy-dog-after-bathing-with-hairdryer-adorable-fluffy-puppy-grooming-table-flat-isolated-vector-illustration-white-background_633472-4397.jpg?ga=GA1.1.2010164998.1740327420&semt=ais_hybrid',
    },
    {
      name: 'Offline Pet Health Consultation',
      description: 'Get professional pet care advice both online and in-store. Whether you need health guidance, nutrition tips, or general pet care support, our experts are here to help—anytime, anywhere!',
      icon: '🏥',
      image: 'https://img.freepik.com/premium-vector/cartoon-owner-doctor-look-dogs-xray-monitor-process-examining-dogs-cats-modern-animal-healthcare-services-medical-center-domestic-animals-treatment-vector_776652-3594.jpg?ga=GA1.1.2010164998.1740327420&semt=ais_hybrid',
      height: '200px',
      width: '200px',
    },
    {
      name: 'Nail Trimming',
      description: 'Expert nail trimming services to keep your pet\'s nails at an appropriate length, preventing discomfort, overgrowth, and potential health issues.',
      icon: '🐾',
      image: 'https://img.freepik.com/free-vector/dog-paw-concept-illustration_114360-8598.jpg?ga=GA1.1.2010164998.1740327420&semt=ais_hybrid',
    },
    {
      name: 'Online Consultation For Your Pet!',
      description: 'Get professional advice from certified vets anytime, anywhere. Whether it\'s health concerns, nutrition, or general pet care, our online consultation service ensures your pet gets the best care from the comfort of your home!',
      icon: '📱',
      image: 'https://img.freepik.com/premium-vector/veterinary-doctor-online-consultation-veterinary-clinic-website-vet-doctor-onlinecell-phone-online-veterinarian-communication-modern-healthcare-technologies-dog_506530-1467.jpg?ga=GA1.1.2010164998.1740327420&semt=ais_hybrid',
    },
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-blue-50 to-teal-50 mt-[88px]"> {/* Added gradient background */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 relative font-playfair"> {/* Applied Playfair Display */}
          Our <span className="text-[#0AB9C6]">Compassionate Services</span>
          <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-xl overflow-hidden transform transition duration-500 hover:scale-[1.03] hover:shadow-2xl cursor-pointer flex flex-col border-t-4 border-[#0AB9C6]" /* Enhanced shadow and added border */
            >
              <div className="w-full h-52 flex items-center justify-center bg-gray-100 rounded-t-xl"> {/* Added wrapper div to control image sizing */}
                <img
                  src={service.image}
                  alt={service.name}
                  className="max-w-full max-h-full object-contain rounded-t-xl" /* Changed to object-contain */
                />
              </div>
              <div className="p-7 flex-grow">
                <h3 className="text-3xl font-bold text-gray-900 mb-4 flex items-center font-playfair"> {/* Applied Playfair Display */}
                  <span className="mr-3 text-4xl text-[#0AB9C6]">{service.icon}</span> {service.name}
                </h3>
                <p className="text-gray-700 leading-relaxed text-base">{service.description}</p>
              </div>
              <div className="p-7 pt-0">
                {service.name === 'Online Consultation For Your Pet!' ? (
                  <button
                    onClick={() => setCurrentPage('appointment')}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full transition duration-300 transform hover:scale-105 active:scale-95"
                  >
                    CONSULT NOW !
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentPage('appointment')}
                    className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-semibold py-2 px-6 rounded-full transition duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Book Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Products Page Component: Displays a preview of products with categories.
const ProductsPage = ({ products, setCurrentPage }) => {
    const [activeCategory, setActiveCategory] = useState('All');

    // Dynamically get categories from the products data
    const categories = ['All', ...new Set(products.map(p => p.category))].filter(Boolean); // Filter out undefined/null categories

    // Filter products based on the active category
    const productsToDisplay = activeCategory === 'All'
        ? products
        : products.filter(p => p.category === activeCategory);

    const googlePhotosAlbumUrl = "https://photos.app.goo.gl/KvdnXpJVZDqzF1rHA"; // Replace with your actual Google Photos album link

    return (
        <section className="py-24 px-6 md:px-12 bg-white mt-[88px]">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 relative font-playfair">
                    Explore Our <span className="text-[#0AB9C6]">Premium Products</span>
                    <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
                </h2>
                <p className="text-center text-lg text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
                    Explore our wide range of high-quality pet accessories designed to keep your furry friends happy, stylish, and comfortable. From cozy beds and trendy collars to interactive toys and feeding essentials, we have everything your pet needs.
                </p>

                {/* Google Photos Album Button */}
                <div className="text-center mb-12">
                    <a
                        href={googlePhotosAlbumUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 inline-flex items-center space-x-2"
                    >
                        <Image className="w-5 h-5" />
                        <span>View Our Product Album</span>
                    </a>
                </div>

                {/* Category Navigation */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-6 py-2 rounded-full font-semibold text-lg transition-all duration-300
                                ${activeCategory === category
                                    ? 'bg-[#0AB9C6] text-white shadow-md'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {productsToDisplay.map((product) => (
                        <div key={product.id} className="bg-orange-50 rounded-xl shadow-xl overflow-hidden transform transition duration-500 hover:scale-[1.03] hover:shadow-2xl cursor-pointer flex flex-col border-t-4 border-orange-200">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-52 object-cover object-center rounded-t-xl" />
                            <div className="p-7 flex-grow">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3 font-playfair">{product.name}</h3>
                                <p className="text-gray-700 leading-relaxed text-base mb-4">{product.description}</p>
                                <p className="text-xl font-bold text-[#0AB9C6]">{product.price}</p>
                            </div>
                            <div className="p-7 pt-0">
                                <button className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-semibold py-2 px-6 rounded-full transition duration-300 transform hover:scale-105 active:scale-95">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-16">
                    <button
                        onClick={() => setCurrentPage('product-gallery')} // Navigate to new Product Gallery Page
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
                    >
                        View Full Product Gallery
                    </button>
                </div>
            </div>
        </section>
    );
};

// New Product Gallery Page Component
const ProductGalleryPage = ({ products, setCurrentPage }) => {
    const googlePhotosAlbumUrl = "https://photos.app.goo.gl/YourGooglePhotosAlbumLinkHere"; // Replace with your actual Google Photos album link

    // Group products by category
    const categorizedProducts = products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized'; // Default to 'Uncategorized' if no category
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});

    return (
        <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-pink-50 to-purple-50 mt-[88px]">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 relative font-playfair"> {/* Applied Playfair Display */}
                    Our Full <span className="text-[#0AB9C6]">Product Gallery</span>
                    <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
                </h2>
                <p className="text-center text-lg text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
                    Browse through our complete collection of premium pet products. See something you like? Click "Buy on WhatsApp" to inquire!
                </p>

                {/* Google Photos Album Button */}
                <div className="text-center mb-12">
                    <a
                        href={googlePhotosAlbumUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 inline-flex items-center space-x-2"
                    >
                        <Image className="w-5 h-5" />
                        <span>View Our Product Album</span>
                    </a>
                </div>

                {Object.keys(categorizedProducts).map((categoryName) => (
                    <div key={categoryName} className="mb-16">
                        <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center relative font-playfair">
                            <span className="text-[#0AB9C6]">{categoryName}</span>
                            <span className="block w-16 h-1 bg-[#0AB9C6] mx-auto mt-3 rounded-full"></span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {categorizedProducts[categoryName].map((product) => (
                                <div key={product.id} className="bg-white rounded-xl shadow-xl overflow-hidden group border-t-4 border-purple-200"> {/* Enhanced shadow and added border */}
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-60 object-cover object-center transform transition duration-300 group-hover:scale-105"
                                    />
                                    <div className="p-5 text-center">
                                        <h4 className="text-xl font-semibold text-gray-900 mb-2 font-playfair">{product.name}</h4> {/* Applied Playfair Display */}
                                        <p className="text-lg font-bold text-[#0AB9C6] mb-3">{product.price}</p>
                                        <button
                                            onClick={() => { /* Placeholder for add to cart / quick view */ }}
                                            className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-semibold py-2 px-5 rounded-full transition duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center mx-auto space-x-2"
                                        >
                                            <ShoppingBag className="w-5 h-5" />
                                            <span>Add to Cart</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};


// Gallery Page Component (Fixed: Removed setCurrentPage prop as it's not used)
const GalleryPage = () => {
  const images = [
    'https://placehold.co/600x400/afeeee/000000?text=Happy+Pet+1',
    'https://placehold.co/600x400/afeeee/000000?text=Happy+Pet+2',
    'https://placehold.co/600x400/afeeee/000000?text=Happy+Pet+3',
    'https://placehold.co/600x400/afeeee/000000?text=Happy+Pet+4',
    'https://placehold.co/600x400/afeeee/000000?text=Happy+Pet+5',
    'https://placehold.co/600x400/afeeee/000000?text=Happy+Pet+6',
    'https://placehold.co/600x400/afeeee/000000?text=Happy+Pet+7',
    'https://placehold.co/600x400/afeeee/000000?text=Happy+Pet+8',
    'https://placehold.co/600x400/afeeee/000000?text=Happy+Pet+9',
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-green-50 to-teal-50 mt-[88px]"> {/* Added gradient background */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 relative font-playfair"> {/* Applied Playfair Display */}
          Our <span className="text-[#0AB9C6]">Happy Paws Gallery</span>
          <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {images.map((src, index) => (
            <div key={index} className="relative overflow-hidden rounded-xl shadow-xl group cursor-pointer border-t-4 border-green-200"> {/* Enhanced shadow and added border */}
              <img
                src={src}
                alt={`Happy Pet ${index + 1}`}
                className="w-full h-72 object-cover object-center transform transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <span className="text-white text-xl font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-150">
                  Joyful Moment {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Page Component (Updated to accept setCurrentPage)
const TestimonialsPage = ({ setCurrentPage }) => {
  const testimonials = [
    {
      quote: "Nice place for your furry friend. U can get everything. Love the place because of I gave my cat for boarding and take care well . Good job by Abhishek... All items available in one place...",
      author: "Smriti Bellad",
      pet: "Dog owner",
      rating: 5,
    },
    {
      quote: "I was skeptical of taking my dog to the groomers because she's old, shy and timid. However at AB Happy Paws I had nothing to worry about! Priya was excellent and treated cookie very well. Cookie had a hair cut, nail trim and a bath, all stress free. Would definitely recommend coming here.",
      author: "Vivek Gurkar",
      pet: "Dog owner",
      rating: 5,
    },
    {
      quote: "First time I left my 2 year Dachshund dog at AB's Happy Paws boarding.. Ms Bhavana took great care of my dog. I was worried because my dog won't socialize with anyone but Ms Bhavana was very patient and handled very professionally.. Thank you very much..",
      author: "Biswa",
      pet: "Dog owner",
      rating: 5, // Assuming 5 stars for all based on "Excellent" and positive tone
    },
  ];

  // Placeholder for Special Offers, which are presented as testimonials
  const specialOffers = [
    {
      title: "Festive Specials",
      discount: "15% off",
      description: "Enjoy special discounts on grooming and pet accessories during festivals! 🎊🐶",
    },
    {
      title: "Seasonal Grooming Packages",
      discount: "10% off",
      description: "Keep your pet looking fresh all year with our specially curated grooming plans at discounted rates.",
    },
    {
      title: "Healthy Skin & Coat Special",
      discount: "10% off",
      description: "Avail an expert-recommended grooming session designed to maintain healthy skin and a shiny coat for your pet.",
    },
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-yellow-50 to-orange-50 mt-[88px]"> {/* Added gradient background */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 relative font-playfair"> {/* Applied Playfair Display */}
          Valuable Words From <span className="text-[#0AB9C6]">Our Customers</span>
          <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center text-center transform transition duration-300 hover:scale-[1.01] hover:shadow-xl border-t-4 border-[#0AB9C6]" /* Enhanced shadow and added border */
            >
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-7 h-7 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 .587l3.668 7.568 8.332 1.208-6.001 5.855 1.416 8.292L12 18.896l-7.415 3.896 1.416-8.292-6.001-5.855 8.332-1.208z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 italic text-xl mb-5 leading-relaxed">"{testimonial.quote}"</p>
              <p className="font-bold text-lg text-gray-900">- {testimonial.author}</p>
              <p className="text-base text-gray-600">({testimonial.pet})</p>
            </div>
          ))}
        </div>

        {/* Special Offers Section */}
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 relative font-playfair"> {/* Applied Playfair Display */}
            Our <span className="text-[#0AB9C6]">Special Offers</span>
            <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {specialOffers.map((offer, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-xl text-center transform transition duration-300 hover:scale-[1.03] hover:shadow-xl border-b-4 border-orange-200"> {/* Enhanced shadow and added orange border */}
                <h3 className="text-3xl font-bold text-gray-900 mb-3 font-playfair">{offer.title}</h3> {/* Applied Playfair Display */}
                <p className="text-5xl font-extrabold text-[#0AB9C6] mb-4">{offer.discount}</p>
                <p className="text-gray-700 text-lg leading-relaxed">{offer.description}</p>
                <button className="mt-6 bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-semibold py-2 px-6 rounded-full transition duration-300 transform hover:scale-105 active:scale-95" onClick={() => setCurrentPage('appointment')}>
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Appointment/Contact Page Component (Updated with new buttons and Google Form)
const AppointmentPage = ({ setCurrentPage }) => {
  const whatsappNumber = '918660764838'; // Consistent WhatsApp number

  const handleBookOnWhatsApp = () => {
    const message = "Hi AB's Happy Paws, I'd like to book an appointment for my pet. Could you please assist me?";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCallUs = () => {
    window.location.href = `tel:${whatsappNumber}`; // Uses tel: for direct call
  };

  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLScOUuO7Fww0-EG_4Z5KRHVqyL8UeiFx3Jcbkd9NHaCqGEMZWw/viewform?fbzx=594263218296675704&pli=1  ";

  return (
    <section className="py-24 px-6 md:px-12 bg-white mt-[88px]"> {/* Adjusted mt for navbar clearance */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Contact Information & Booking Steps */}
        <div className="bg-purple-50 p-10 rounded-xl shadow-xl"> {/* Changed background to purple-50 and enhanced shadow */}
          <h2 className="text-4xl font-bold text-gray-900 mb-8 font-playfair">Make an <span className="text-[#0AB9C6]">Appointment</span></h2> {/* Applied Playfair Display */}

          {/* New Top Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={handleBookOnWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Phone className="w-5 h-5" />
              <span>Book Appointment (WhatsApp)</span>
            </button>
            <button
              onClick={handleCallUs}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Phone className="w-5 h-5" />
              <span>Call Us</span>
            </button>
          </div>

          <h3 className="text-3xl font-semibold text-gray-900 mb-6 font-playfair">Quick and Easy Booking in 3 Simple Steps!</h3> {/* Applied Playfair Display */}
          <ol className="list-decimal list-inside text-gray-700 text-lg space-y-3 mb-10">
            <li>Click on "Book Appointment (WhatsApp)" to chat with us directly.</li>
            <li>Alternatively, click "Call Us" for immediate assistance.</li>
            <li>Fill the online form below to send us your details.</li>
          </ol>

          <div className="space-y-7 text-gray-700 text-lg mb-12">
            <p className="flex items-center">
              <MapPin className="w-7 h-7 mr-4 text-[#0AB9C6]" />
              # 64, 10th cross, 12th main, Railway Parallel Rd, Kumara Park West, Seshadripuram, Bengaluru, Karnataka 560020
            </p>
            <p className="flex items-center">
              <Phone className="w-7 h-7 mr-4 text-[#0AB9C6]" />
              <a href={`tel:${whatsappNumber}`} className="hover:text-[#089AA6] transition-colors duration-200">{whatsappNumber}</a>
            </p>
            <p className="flex items-center">
              <Mail className="w-7 h-7 mr-4 text-[#0AB9C6]" />
              <a href="mailto:salesabshappypaws@gmail.com" className="hover:text-[#089AA6] transition-colors duration-200">salesabshappypaws@gmail.com</a>
            </p>
            <p className="flex items-center">
              <Clock className="w-7 h-7 mr-4 text-[#0AB9C6]" />
              Mon - Sun: 10:00 AM - 10:00 PM
            </p>
          </div>

          <div className="mt-12">
            <h3 className="text-3xl font-semibold text-gray-900 mb-6 font-playfair">Find Us on <span className="text-[#0AB9C6]">Map</span></h3> {/* Applied Playfair Display */}
            <div className="bg-gray-200 h-72 rounded-lg flex items-center justify-center text-gray-500 text-xl font-medium border-2 border-gray-300 overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.8937965942735!2d77.56847847509893!3d12.977461487352345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae163a7b1d1f0d%3A0x28f7d93026a7e0c!2sChakravarthy%20Iyengar%20Layout!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="AB's Happy Paws Location on Map"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Google Form Embed */}
        <div className="bg-emerald-50 p-10 rounded-xl shadow-xl"> {/* Changed background to emerald-50 and enhanced shadow */}
          <h2 className="text-4xl font-bold text-gray-900 mb-8 font-playfair">Fill Our <span className="text-[#0AB9C6]">Online Appointment Form</span></h2> {/* Applied Playfair Display */}
          <div className="w-full h-[600px] overflow-hidden rounded-lg shadow-md border border-gray-300">
            <iframe
              src={googleFormUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              marginHeight="0"
              marginWidth="0"
              title="AB's Happy Paws Appointment Form"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

// Login Form Component
const LoginForm = ({ onLogin, error }) => {
  const [email, setEmail] = useState(''); // Changed to email for Firebase Auth
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password); // Pass email to onLogin
  };

  return (
    <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-blue-100 to-indigo-100 min-h-screen flex items-center justify-center mt-[88px]">
      <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md text-center border-t-4 border-[#0AB9C6]">
        <h2 className="text-4xl font-bold text-gray-900 mb-8 font-playfair">Admin <span className="text-[#0AB9C6]">Login</span></h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-left text-gray-700 text-lg font-medium mb-2">Email:</label>
            <input
              type="email" // Type changed to email
              id="email"
              className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6] focus:border-transparent transition duration-200 text-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-left text-gray-700 text-lg font-medium mb-2">Password:</label>
            <input
              type="password"
              id="password"
              className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6] focus:border-transparent transition duration-200 text-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-600 text-base mt-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 text-lg"
          >
            Login
          </button>
        </form>
        {/* Removed hardcoded hint as credentials will be managed via Firebase Auth */}
      </div>
    </section>
  );
};

// Custom Confirmation Modal Component
const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 font-playfair">Confirm Action</h3>
                <p className="text-lg text-gray-700 mb-8">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};


// Admin Dashboard Component with Product Management
const AdminDashboard = ({ db, userId, isAuthReady, products, setProducts, appId }) => {
  const [editingProduct, setEditingProduct] = useState(null); // State to hold product being edited
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', imageUrl: '', category: '' }); // State for new product form
  const [showAddForm, setShowAddForm] = useState(false); // State to toggle add product form visibility

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const openConfirmModal = (message, action) => {
      setConfirmMessage(message);
      setConfirmAction(() => action); // Store the action function
      setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmMessage('');
  };

  const executeConfirmAction = () => {
      if (confirmAction) {
          confirmAction();
      }
      closeConfirmModal();
  };

  // Fetch products from Firestore
  useEffect(() => {
    if (db && userId && isAuthReady) {
      const productsColRef = collection(db, `artifacts/${appId}/users/${userId}/products`);
      const unsubscribe = onSnapshot(productsColRef, (snapshot) => {
        const fetchedProducts = snapshot.docs.map(doc => ({
          id: doc.id, // Use doc.id for Firestore document ID
          ...doc.data()
        }));
        setProducts(fetchedProducts);
      }, (error) => {
        console.error("Error fetching products:", error);
        // Display a user-friendly error message if products cannot be fetched
      });
      return () => unsubscribe(); // Cleanup listener
    }
  }, [db, userId, isAuthReady, setProducts, appId]); // Depend on db, userId, isAuthReady, setProducts, appId

  // Function to handle adding a new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.description || !newProduct.price || !newProduct.imageUrl || !newProduct.category) {
      openConfirmModal('Please fill in all fields to add a product.', null);
      return;
    }
    if (db && userId) {
      try {
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/products`), newProduct);
        setNewProduct({ name: '', description: '', price: '', imageUrl: '', category: '' }); // Clear form
        setShowAddForm(false); // Hide the form after adding
      } catch (error) {
        console.error("Error adding product:", error);
        openConfirmModal(`Error adding product: ${error.message}`, null);
      }
    }
  };

  // Function to handle editing a product
  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.description || !editingProduct.price || !editingProduct.imageUrl || !editingProduct.category) {
      openConfirmModal('Please fill in all fields to edit a product.', null);
      return;
    }
    if (db && userId && editingProduct.id) {
      try {
        const productDocRef = doc(db, `artifacts/${appId}/users/${userId}/products`, editingProduct.id);
        await setDoc(productDocRef, editingProduct, { merge: true });
        setEditingProduct(null); // Exit editing mode
      } catch (error) {
        console.error("Error updating product:", error);
        openConfirmModal(`Error updating product: ${error.message}`, null);
      }
    }
  };

  // Function to delete a product
  const handleDeleteProduct = (productId) => {
    openConfirmModal('Are you sure you want to delete this product?', async () => {
      if (db && userId) {
        try {
          await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/products`, productId));
        } catch (error) {
          console.error("Error deleting product:", error);
          openConfirmModal(`Error deleting product: ${error.message}`, null);
        }
      }
    });
  };

  return (
    <section className="py-24 px-6 md:px-12 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen mt-[88px]">
      <div className="max-w-7xl mx-auto bg-white p-10 rounded-xl shadow-2xl text-center border-t-4 border-green-500">
        <h2 className="text-5xl font-bold text-gray-900 mb-8 font-playfair">Welcome, <span className="text-green-600">Admin!</span></h2>
        <p className="text-lg text-gray-700 mb-10 leading-relaxed">
          This is your exclusive dashboard. Here you can manage your website's products.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Your User ID: <span className="font-mono text-gray-700 break-all">{userId || 'N/A'}</span>
        </p>

        {/* Add New Product Section */}
        <div className="mb-12 p-8 bg-blue-50 rounded-xl shadow-lg border-l-4 border-blue-400">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 font-playfair">
            {showAddForm ? 'Add New Product' : 'Product Management'}
          </h3>
          {!showAddForm && (
            <button
              onClick={() => { setShowAddForm(true); setEditingProduct(null); }}
              className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center mx-auto space-x-2"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Add New Product</span>
            </button>
          )}

          {showAddForm && (
            <form onSubmit={handleAddProduct} className="space-y-6 mt-8 text-left">
              <div>
                <label htmlFor="newName" className="block text-gray-700 text-lg font-medium mb-2">Product Name:</label>
                <input
                  type="text"
                  id="newName"
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6]"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="newDescription" className="block text-gray-700 text-lg font-medium mb-2">Description:</label>
                <textarea
                  id="newDescription"
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6] h-32"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  required
                ></textarea>
              </div>
              <div>
                <label htmlFor="newPrice" className="block text-gray-700 text-lg font-medium mb-2">Price:</label>
                <input
                  type="text"
                  id="newPrice"
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6]"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="newImageUrl" className="block text-gray-700 text-lg font-medium mb-2">Image URL:</label>
                <input
                  type="text"
                  id="newImageUrl"
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6]"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="newCategory" className="block text-gray-700 text-lg font-medium mb-2">Category:</label>
                <input
                  type="text"
                  id="newCategory"
                  className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6]"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
                >
                  Add Product
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Product List for Editing/Deleting */}
        <div className="mt-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 font-playfair">Manage Existing Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-orange-50 p-6 rounded-xl shadow-lg border-l-4 border-orange-400 flex flex-col items-center text-center">
                <img src={product.imageUrl} alt={product.name} className="w-32 h-32 object-cover rounded-md mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h4>
                <p className="text-gray-700 text-sm mb-2 line-clamp-2">{product.description}</p>
                <p className="text-gray-800 font-bold mb-4">{product.price}</p>
                <p className="text-gray-600 text-xs mb-4">Category: {product.category}</p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => { setEditingProduct(product); setShowAddForm(false); }}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-md transition duration-300 transform hover:scale-110 active:scale-95"
                    aria-label="Edit Product"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition duration-300 transform hover:scale-110 active:scale-95"
                    aria-label="Delete Product"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Product Modal/Form */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
              <h3 className="text-3xl font-bold text-gray-900 mb-6 font-playfair">Edit Product</h3>
              <form onSubmit={handleEditProduct} className="space-y-6 text-left">
                <div>
                  <label htmlFor="editName" className="block text-gray-700 text-lg font-medium mb-2">Product Name:</label>
                  <input
                    type="text"
                    id="editName"
                    className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6]"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editDescription" className="block text-gray-700 text-lg font-medium mb-2">Description:</label>
                  <textarea
                    id="editDescription"
                    className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6] h-32"
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    required
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="editPrice" className="block text-gray-700 text-lg font-medium mb-2">Price:</label>
                  <input
                    type="text"
                    id="editPrice"
                    className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6]"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editImageUrl" className="block text-gray-700 text-lg font-medium mb-2">Image URL:</label>
                  <input
                    type="text"
                    id="editImageUrl"
                    className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6]"
                    value={editingProduct.imageUrl}
                    onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editCategory" className="block text-gray-700 text-lg font-medium mb-2">Category:</label>
                  <input
                    type="text"
                    id="editCategory"
                    className="w-full px-5 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0AB9C6]"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {showConfirmModal && (
          <ConfirmationModal
              message={confirmMessage}
              onConfirm={executeConfirmAction}
              onCancel={closeConfirmModal}
          />
      )}
    </section>
  );
};


// FAQs Page Component (Updated with AI Assistant and Random Prompts)
const FAQsPage = ({ scrollToAI, setScrollToAI }) => {
  const [openFAQ, setOpenFAQ] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const aiAssistantRef = useRef(null); // Ref for the AI assistant section

  const faqs = [
    {
      question: "How do I book a pet grooming appointment online?",
      answer: "Navigate to the top of the screen and click on 'Appointment.' Either fill the form so that we can get all your details and Contact you back ASAP or Click on the Whatsapp icon to contact us directly. You can also give us a direct visit! We recommend booking in advance, especially for weekend slots, to ensure availability.",
    },
    {
      question: "Do I need to book an appointment in advance?",
      answer: "Yes, we highly recommend booking your appointment in advance to secure your preferred date and time, especially for peak seasons or specific services. While we do our best to accommodate walk-ins, appointments guarantee your pet's spot.",
    },
    {
      question: "How do I get the cost of my pet’s grooming appointment?",
      answer: "The cost of grooming varies depending on your pet's breed, size, coat condition, and the specific services requested. Please contact us directly via phone, WhatsApp, or the appointment form to get a personalized quote. We're happy to discuss your pet's needs and provide a transparent breakdown of costs.",
    },
    {
      question: "How long will the grooming service take?",
      answer: "The duration of grooming services depends on several factors, including the type of service, your pet's size, breed, coat condition, and temperament. A standard full grooming session can take anywhere from 1.5 to 3 hours. We will provide an estimated time when you book your appointment.",
    },
    {
      question: "What vaccinations do you require for boarding services?",
      answer: "For the safety of all pets, we require proof of up-to-date vaccinations including Rabies, Distemper, and Bordetella (Kennel Cough) for all boarding clients. Please bring your pet's vaccination records with you.",
    },
    {
      question: "Can I bring my own pet food for boarding?",
      answer: "Yes, you are highly encouraged to bring your pet's own food, especially if they have dietary sensitivities or are on a special diet. This helps us maintain their routine and avoid any digestive upset. Please portion the food into individual meals and label them clearly.",
    },
    {
      question: "What is your cancellation policy for appointments?",
      answer: "We understand that plans can change. We request that you notify us at least 24 hours in advance if you need to cancel or reschedule an appointment. Cancellations made less than 24 hours prior may incur a small fee.",
    },
    {
      question: "Do you offer puppy training classes?",
      answer: "Yes, we offer a variety of puppy training classes focusing on socialization, basic obedience commands, and common behavioral issues like house-training and nipping. Our classes are designed to be fun and engaging for both puppies and their owners.",
    },
  ];

  const blogPosts = [
    {
      title: "How To Get Rid Of Ticks & Fleas in Dogs",
      date: "Jan 26, 2025",
      readTime: "5 min read",
      link: "#", // Placeholder link
    },
    {
      title: "Best interactive dog toys: Our top picks 2024",
      date: "Jan 30, 2025",
      readTime: "10 min read",
      link: "#", // Placeholder link
    },
    {
      title: "How to Become a Certified Groomer",
      date: "Nov 6, 2024",
      readTime: "5 min read",
      link: "#", // Placeholder link
    },
    {
      title: "Understanding Your Cat's Body Language",
      date: "Feb 15, 2025",
      readTime: "7 min read",
      link: "#",
    },
    {
      title: "The Importance of Regular Vet Check-ups for Pets",
      date: "Mar 01, 2025",
      readTime: "6 min read",
      link: "#",
    },
    {
      title: "Choosing the Right Food for Your Pet's Age and Breed",
      date: "Mar 10, 2025",
      readTime: "8 min min read",
      link: "#",
    },
    {
      title: "Tips for a Stress-Free Bath Time for Your Dog",
      date: "Apr 05, 2025",
      readTime: "4 min read",
      link: "#",
    },
  ];

  const randomPrompts = [
    "What are the best dog breeds for first-time owners?",
    "How do I train my puppy to stop biting?",
    "What kind of food should I feed my cat?",
    "How often should I brush my long-haired dog?",
    "What are common signs of illness in pets?",
    "How do I introduce a new pet to my existing one?",
    "What vaccinations do puppies need?",
    "How do I prevent my cat from scratching furniture?",
  ];

  // Scroll to AI section if directed by parent component
  useEffect(() => {
    if (scrollToAI && aiAssistantRef.current) {
      // Small timeout to ensure element is fully rendered and positioned
      const timer = setTimeout(() => {
        aiAssistantRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setScrollToAI(false); // Reset the signal
      }, 100); // 100ms delay

      return () => clearTimeout(timer); // Cleanup timeout
    }
  }, [scrollToAI, setScrollToAI]);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const handleAiQuestionChange = (e) => {
    setAiQuestion(e.target.value);
  };

  const generateRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    setAiQuestion(randomPrompts[randomIndex]);
    setAiResponse(''); // Clear previous AI response
    setAiError(''); // Clear previous AI error
  };

  const askAi = async () => {
    if (!aiQuestion.trim()) {
      setAiError("Please enter a question or generate a random one.");
      return;
    }
    setLoadingAi(true);
    setAiResponse('');
    setAiError('');

    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: aiQuestion }] });
      const payload = { contents: chatHistory };
      const apiKey = ""; // Canvas will provide this at runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setAiResponse(text);
      } else {
        setAiError("Sorry, I couldn't generate a response. Please try again.");
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setAiError("An error occurred while fetching a response. Please try again later.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <section className="py-24 px-6 md:px-12 bg-white mt-[88px]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-16 relative font-playfair"> {/* Applied Playfair Display */}
          Explore Our Latest <span className="text-[#0AB9C6]">Blogs & FAQs</span>
          <span className="block w-20 h-1 bg-[#0AB9C6] mx-auto mt-4 rounded-full"></span>
        </h2>

        {/* Latest Blogs Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-10 text-center md:text-left font-playfair">Our Latest Blogs</h3> {/* Applied Playfair Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {blogPosts.map((post, index) => (
              <a href={post.link} key={index} className="block bg-blue-50 p-7 rounded-xl shadow-xl hover:shadow-xl transition-shadow duration-300 transform hover:scale-[1.02] cursor-pointer border-l-4 border-blue-200"> {/* Changed background to blue-50 and border to blue-200 */}
                <h4 className="text-2xl font-bold text-gray-900 mb-3 font-playfair">{post.title}</h4> {/* Applied Playfair Display */}
                <p className="text-gray-600 text-sm mb-2">{post.date}</p>
                <p className="text-gray-700 text-base">{post.readTime}</p>
              </a>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={() => alert('This would navigate to the full blog page! /blogs')} // Placeholder for more blogs link
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95"
            >
              View All Blogs
            </button>
          </div>
        </div>

        {/* Frequently Asked Questions Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-gray-900 mb-10 text-center md:text-left font-playfair">Frequently Asked Questions</h3> {/* Applied Playfair Display */}
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-orange-50 rounded-xl shadow-xl border-b-2 border-orange-200"> {/* Changed background to orange-50 and border to orange-200 */}
                <button
                  className="w-full text-left p-6 flex justify-between items-center text-lg font-semibold text-gray-900 hover:bg-orange-100 transition-colors duration-200 focus:outline-none" /* Adjusted hover background */
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{faq.question}</span>
                  {openFAQ === index ? <Minus className="w-5 h-5 text-[#0AB9C6]" /> : <Plus className="w-5 h-5 text-[#0AB9C6]" />}
                </button>
                {openFAQ === index && (
                  <div className="p-6 pt-0 text-gray-700 leading-relaxed text-base transition-all duration-300 ease-in-out">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Pet Assistant Section */}
        <div id="ai-assistant-section" ref={aiAssistantRef} className="bg-[#e0f7fa] p-10 rounded-xl shadow-lg border-2 border-[#0AB9C6] text-center">
          <h3 className="text-4xl font-bold text-gray-900 mb-8 flex items-center justify-center font-playfair"> {/* Applied Playfair Display */}
            <Bot className="w-10 h-10 mr-4 text-[#0AB9C6]" />
            Talk to <span className="text-[#0AB9C6]">✨AI Pet Assistant✨</span>
          </h3>
          <p className="text-lg text-gray-700 mb-8">
            Ask any general question about pet care, health, or behavior, and our AI will provide helpful insights!
          </p>
          <div className="flex flex-col md:flex-row gap-4 mb-6 max-w-2xl mx-auto">
            <input
              type="text"
              className="flex-grow shadow-sm appearance-none border border-gray-300 rounded-lg py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-3 focus:ring-[#0AB9C6] focus:border-transparent transition-all duration-200"
              placeholder="e.g., How often should I walk my dog?"
              value={aiQuestion}
              onChange={handleAiQuestionChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  askAi();
                }
              }}
            />
            <button
              onClick={askAi}
              disabled={loadingAi}
              className="bg-[#0AB9C6] hover:bg-[#089AA6] text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingAi ? 'Asking AI...' : 'Ask AI'}
            </button>
          </div>
          <button
            onClick={generateRandomPrompt}
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-full shadow-md transition duration-300 transform hover:scale-105 active:scale-95 mb-6"
          >
            Generate Random Prompt
          </button>
          {aiError && (
            <p className="text-red-600 mt-4 text-lg font-medium">{aiError}</p>
          )}
          {aiResponse && (
            <div className="mt-8 p-6 bg-white rounded-lg shadow-md text-left border border-gray-200">
              <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center font-playfair"> {/* Applied Playfair Display */}
                <Bot className="w-6 h-6 mr-3 text-gray-600" />
                AI Assistant Response:
              </h4>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default App;
