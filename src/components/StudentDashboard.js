import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { gapi } from 'gapi-script';
import './StudentDashboard.css'; 

const StudentDashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassrooms = async () => {
      setLoading(true);
      try {
        const authInstance = gapi.auth2.getAuthInstance();
        const googleUser = authInstance.currentUser.get();
        const profile = googleUser.getBasicProfile();
        const userEmail = profile.getEmail();

        const classroomsCollection = collection(db, 'classrooms');
        const querySnapshot = await getDocs(classroomsCollection);

        const classroomsData = [];
        for (const docSnap of querySnapshot.docs) {
          const studentsSubcollection = collection(docSnap.ref, 'students');
          const studentDoc = await getDoc(doc(studentsSubcollection, userEmail));

          if (studentDoc.exists()) {
            classroomsData.push({
              id: docSnap.id,
              classroomName: docSnap.data().classID,
            });
          }
        }

        if (classroomsData.length === 0) {
          setError('No classrooms found.');
        }
        setClassrooms(classroomsData);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        setError('Error fetching classrooms.');
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  const handleClassroomClick = async (classroomId) => {
    setLoading(true);
    setSelectedClassroom(classroomId);
    setAssignments([]);

    try {
      const assignmentsCollection = collection(db, 'classrooms', classroomId, 'projects');
      const querySnapshot = await getDocs(assignmentsCollection);

      if (querySnapshot.empty) {
        setError('No assignments found for this classroom.');
      } else {
        const assignmentsData = querySnapshot.docs.map(doc => doc.data());
        setAssignments(assignmentsData);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setError('Error fetching assignments.');
    } finally {
      setLoading(false);
    }
  };

  const openProjectPage = (projectName) => {
    navigate(`/project/${projectName}`);
  };

  const handleLogout = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    authInstance.signOut().then(() => {
      navigate('/');
    }).catch((error) => {
      console.error("Error signing out:", error);
    });
  };

  return (
    <div className="student-dashboard">
      <div className="sidebar">
        <button onClick={() => navigate('/')} className="sidebar-button">Home</button>
        <button onClick={handleLogout} className="sidebar-button">Logout</button>
      </div>
      {loading ? (
        <p>Loading your classrooms...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : classrooms.length > 0 ? (
        <div className="classroom-list">
          <h1>Your Classrooms</h1>
          {classrooms.map((classroom) => (
            <button
              key={classroom.id}
              onClick={() => handleClassroomClick(classroom.id)}
              className="classroom-button"
            >
              {classroom.classroomName}
            </button>
          ))}
        </div>
      ) : (
        <p>No classrooms found.</p>
      )}

      {selectedClassroom && assignments.length > 0 && (
        <div className="assignments-list">
          <h3>Assignments in {selectedClassroom}</h3>
          {assignments.map((assignment, index) => (
            <div key={index} className="assignment-card">
              <h4>{assignment.projectName}</h4>
              <button onClick={() => openProjectPage(assignment.projectName)} className="project-button">
                View Project
              </button>
              <p><strong>Due Date:</strong> {assignment.dueDate}</p>
              <p><strong>Status:</strong> {assignment.status}</p>
            </div>
          ))}
        </div>
      )}
      
      {selectedClassroom && assignments.length === 0}
    </div>
  );
}

export default StudentDashboard;
