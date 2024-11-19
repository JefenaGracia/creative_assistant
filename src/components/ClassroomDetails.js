import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import './ClassroomDetails.css';

const ClassroomDetails = () => {
  const { classroomId } = useParams(); 
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchClassroomDetails = async () => {
      try {
        const classroomRef = doc(db, 'classrooms', classroomId);
        const classroomSnap = await getDoc(classroomRef);

        if (classroomSnap.exists()) {
          setClassroom(classroomSnap.data());
          // Fetching students of the classroom
          const studentsQuery = collection(db, 'classrooms', classroomId, 'students');
          const studentsSnap = await getDocs(studentsQuery);
          const fetchedStudents = studentsSnap.docs.map(doc => doc.data());
          setStudents(fetchedStudents);
        } else {
          setErrorMessage('Classroom not found');
        }
      } catch (error) {
        console.error('Error fetching classroom details:', error);
        setErrorMessage('Failed to load classroom details');
      }
      setLoading(false);
    };

    fetchClassroomDetails();
  }, [classroomId]); 

  return (
    <div className="classroom-details">
      {loading ? (
        <p>Loading classroom details...</p>
      ) : errorMessage ? (
        <p className="error">{errorMessage}</p>
      ) : (
        <div>
          <h1>{classroom?.classID || 'Class not found'}</h1>
          <h2>Students in this Classroom</h2>
          {students.length > 0 ? (
            <ul>
              {students.map((student, index) => (
                <li key={index}>{student.firstName} {student.lastName} ({student.email})</li>
              ))}
            </ul>
          ) : (
            <p>No students enrolled in this classroom.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassroomDetails;
