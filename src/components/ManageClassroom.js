import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { useNavigate, useParams } from 'react-router-dom';
import './ManageClassroom.css';

const ManageClassroom = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileError, setFileError] = useState(null); 
  const { classroomId } = useParams();
  const navigate = useNavigate();

  // Fetching the list of students from the classroom
  useEffect(() => {
    const fetchClassroomStudents = async () => {
      try {
        const classroomRef = doc(db, 'classrooms', classroomId);
        const studentsCollection = collection(classroomRef, 'students');
        const querySnapshot = await getDocs(studentsCollection);
        setStudents(querySnapshot.docs.map(doc => doc.data()));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    };

    fetchClassroomStudents();
  }, [classroomId]);

  // Handle removing a student from the classroom
  const handleStudentRemove = async (email) => {
    try {
      const classroomRef = doc(db, 'classrooms', classroomId);
      const studentRef = doc(classroomRef, 'students', email);
      await deleteDoc(studentRef);
      setStudents(students.filter(student => student.email !== email));
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  // Handle file upload to add students
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        setFileError(null); 
        const fileData = event.target.result;
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const newStudents = await processStudents(jsonData);
        setStudents((prevStudents) => [...prevStudents, ...newStudents]);

        // Redirect to the classroom details page after adding students
        navigate(`/classroom/${classroomId}`);
      } catch (error) {
        setFileError('Error reading file. Please make sure the file is in a valid format.');
        console.error('Error reading file:', error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Refactor student processing
  const processStudents = async (jsonData) => {
    const classroomRef = doc(db, 'classrooms', classroomId);
    const newStudents = [];

    for (const row of jsonData) {
      const { 'Student Email': email, 'First name': firstName, 'Last name': lastName } = row;

      if (email && firstName && lastName) {
        const studentRef = doc(collection(classroomRef, 'students'), email);
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          await setDoc(studentRef, { email, firstName, lastName });
          newStudents.push({ email, firstName, lastName });
        } else {
          console.log(`Student with email ${email} already exists.`);
        }
      }
    }
    return newStudents;
  };

  if (loading) return <p>Loading students...</p>;

  return (
    <div className="manage-classroom">
      <h2>Manage Students</h2>
      {/* File upload for adding students */}
      <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} />
      {fileError && <p className="error">{fileError}</p>} {/* Display file error */}

      {/* List of students */}
      <div className="student-list">
        {students.length > 0 ? (
          students.map((student) => (
            <div key={student.email}>
              <p>{student.lastName}, {student.firstName}</p>
              <button onClick={() => handleStudentRemove(student.email)}>Remove</button>
            </div>
          ))
        ) : (
          <p>No students in this classroom yet.</p>
        )}
      </div>
    </div>
  );
};

export default ManageClassroom;
