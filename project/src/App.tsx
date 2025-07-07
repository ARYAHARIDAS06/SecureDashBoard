// // import React from 'react';
// // import Dashboard from './components/Dashboard';

// // function App() {
// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       <Dashboard />
// //     </div>
// //   );
// // }

// // export default App;


// // src/App.tsx
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './hooks/useAuth';
// import AuthForm from './components/AuthForm';
// import Dashboard from './components/Dashboard';

// const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
//   const { user, isLoading } = useAuth();
//   if (isLoading) return <div className="text-center p-6">Loading...</div>;
//   return user ? children : <Navigate to="/login" replace />;
// };

// const App = () => {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           <Route path="/login" element={<AuthForm />} />
//           <Route
//             path="/"
//             element={
//               <ProtectedRoute>
//                 <Dashboard />
//               </ProtectedRoute>
//             }
//           />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// };

// export default App;


import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
