import React, { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import ProjectPage from './components/ProjectDetails';
import ClassroomDetails from './components/ClassroomDetails';
import ManageClassroom from './components/ManageClassroom';
import Projects from './components/Projects';
import Layout from './components/Layout';
import { initializeGoogleAuth } from './utils/auth';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from './firebaseConfig';
import LoginPage from './components/LoginPage';

function App() {
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    initializeGoogleAuth();
  }, []);

  const handleGoogleLogin = () => {
    setLoading(true);
    const authInstance = gapi.auth2.getAuthInstance();
    if (!authInstance) {
      console.error('Google Auth instance is not initialized');
      setLoading(false);
      return;
    }

    authInstance.signIn()
      .then(async (googleUser) => {
        setLoading(false);
        const profile = googleUser.getBasicProfile();
        const email = profile.getEmail();
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            setRole(userData.role);
            setIsLoggedIn(true);
            navigate('/'); 
          });
        } else {
          console.log("Email not found in Firestore");
          setRole(null);
          alert('Email is not registered. Please contact the admin.');
        }
      })
      .catch((error) => {
        setLoading(false);
        setError('Login failed, please try again.');
        console.error('Google login failed', error);
      });
  };

  const handleLogout = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance) {
      authInstance.signOut()
        .then(() => {
          setIsLoggedIn(false);
          setRole(null);
          navigate('/'); 
        })
        .catch((error) => {
          console.error("Error during logout", error);
          alert("An error occurred during logout.");
        });
    } else {
      console.error("Google Auth instance is not initialized");
    }
  };

  return (
    <div className="App">
      <Routes>
        {!isLoggedIn ? (
          <Route path="/" element={<LoginPage handleGoogleLogin={handleGoogleLogin} error={error} loading={loading} />} />
        ) : (
          <>
            {role === 'teacher' && (
              <Route path="/" element={<Layout handleLogout={handleLogout} />}>
                <Route index element={<TeacherDashboard />} />
                <Route path="classroom/:classroomId" element={<ClassroomDetails />}>
                  <Route path="manage" element={<ManageClassroom />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:projectName" element={<ProjectPage />} />
                </Route>
              </Route>
            )}
            {role === 'student' && (
              <Route path="/" element={<StudentDashboard handleLogout={handleLogout} />} />
            )}
            {role === null && <p>Email is not registered. Please contact the admin.</p>}
          </>
        )}
      </Routes>
      <footer className="footer">
        <p>Creative Assistant &copy; 2024</p>
      </footer>
    </div>
  );
}

export default App;
