import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, setDoc, doc, getDocs, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import './TeacherDashboard.css';

const TeacherDashboard = ({ handleLogout }) => {
  const [classrooms, setClassrooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseID, setCourseID] = useState('');
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); 
  const navigate = useNavigate();

  const fetchClassrooms = async () => {
    try {
      const classroomsQuery = collection(db, 'classrooms');
      const querySnapshot = await getDocs(classroomsQuery);
      const fetchedClassrooms = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClassrooms(fetchedClassrooms);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    }
  };

  useEffect(() => {
    fetchClassrooms();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) navigate('/');
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleClassroomClick = (classroomId) => {
    navigate(`/classroom/${classroomId}`);
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleCourseIDChange = (e) => setCourseID(e.target.value);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!courseID || !file) {
      setErrorMessage('Please fill in both the course ID and upload a file.');
      return;
    }
  
    if (file && !['.xlsx', '.csv'].some(ext => file.name.toLowerCase().endsWith(ext))) {
      setErrorMessage('Please upload a valid Excel or CSV file.');
      return;
    }
  
    setLoading(true);
    const classroomDocRef = doc(db, 'classrooms', courseID);
  
    try {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        try {
          const fileData = fileReader.result;
          const workbook = XLSX.read(fileData, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet);
  
          const classroomDoc = await getDoc(classroomDocRef);
          if (classroomDoc.exists()) {
            setErrorMessage('Classroom with this course ID already exists.');
            setLoading(false);
            return;
          }
  
          await setDoc(classroomDocRef, { classID: courseID });
  
          for (const row of jsonData) {
            const { 'Student Email': email, 'First name': firstName, 'Last name': lastName } = row;
            if (!email || !firstName || !lastName) continue;
  
            const studentRef = doc(collection(db, 'classrooms', courseID, 'students'), email);
            await setDoc(studentRef, {
              firstName,
              lastName,
              email,
              assignedAt: new Date().toISOString(),
            });
          }
  
          fetchClassrooms();
          setIsModalOpen(false);
          setCourseID('');
          setFile(null);
          setErrorMessage('');
          setSuccessMessage('Classroom created successfully!'); 
          setTimeout(() => setSuccessMessage(''), 10000); 
        } catch (error) {
          setErrorMessage("Error processing student data. Please try again.");
          console.error("Error processing file:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      setErrorMessage('Failed to upload data. Please try again.');
      console.error("File upload error:", error);
      setLoading(false);
    }
  };
  

  return (
    <div className="TeacherDashboard">
      <div className="sidebar">
        <h2>Creative Assistant</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="classroom-list">
        <h1>Your Classrooms</h1>
        <button className="plus-button" onClick={() => setIsModalOpen(true)}>+</button>
        
        {classrooms.length > 0 ? (
          classrooms.map((classroom) => (
            <button
              key={classroom.id}
              onClick={() => handleClassroomClick(classroom.id)}
              className="classroom-button"
            >
              {classroom.classID}
            </button>
          ))
        ) : (
          <p className="no-classrooms">No classrooms available.</p>
        )}

        {isModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
              <h2>Create New Classroom</h2>
              <form onSubmit={handleFormSubmit}>
                <label>Course ID:</label>
                <input type="text" value={courseID} onChange={handleCourseIDChange} placeholder="Enter course ID" />
                <label>Upload Students (CSV/Excel):</label>
                <input type="file" accept=".csv, .xlsx" onChange={handleFileChange} />
                {errorMessage && <p className="error">{errorMessage}</p>}
                <button type="submit" disabled={loading}>
                  {loading ? (
                    <div className="loader"></div> 
                  ) : (
                    'Submit'
                  )}
                </button>
              </form>
              {successMessage && <p className="success">{successMessage}</p>} 
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
