// Projects.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { useParams, useNavigate } from 'react-router-dom';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const { classroomId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsCollection = collection(db, 'classrooms', classroomId, 'projects');
        const querySnapshot = await getDocs(projectsCollection);
        setProjects(querySnapshot.docs.map(doc => doc.data()));
        setLoading(false);
      } catch (err) {
        setError('Error fetching projects');
        setLoading(false);
      }
    };

    fetchProjects();
  }, [classroomId]);

  const handleFileUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handleProjectUpload = async () => {
    if (!file) {
      setError('Please upload a valid Excel file.');
      return;
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
      setError('Please upload an Excel (.xlsx) or CSV file.');
      return;
    }

    setLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileData = event.target.result;
        const workbook = XLSX.read(fileData, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        const classroomRef = doc(db, 'classrooms', classroomId);

        // Reset projects list before adding new projects
        setProjects([]);

        for (const row of jsonData) {
          const { 'Project Name': projectName, 'Team Members': teamMembers } = row;

          if (projectName && teamMembers) {
            const projectRef = doc(collection(classroomRef, 'projects'), projectName);
            await setDoc(projectRef, {
              projectName,
              teamMembers: teamMembers.split(',').map(member => member.trim()), // Split by commas if multiple members
            });
          }
        }

        // Refresh projects list after upload
        const projectsCollection = collection(db, 'classrooms', classroomId, 'projects');
        const querySnapshot = await getDocs(projectsCollection);
        setProjects(querySnapshot.docs.map(doc => doc.data()));

        setLoading(false);
      } catch (err) {
        console.error('Error uploading projects:', err);
        setError('An error occurred while processing the file.');
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleProjectClick = (projectName) => {
    navigate(`/classroom/${classroomId}/projects/${projectName}`);
  };

  return (
    <div className="projects">
      <h2>Manage Projects</h2>
      <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} />
      <button onClick={handleProjectUpload}>Upload Project Data</button>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <div className="projects-list">
        {projects.length > 0 ? (
          projects.map((project) => (
            <button
              key={project.projectName}
              onClick={() => handleProjectClick(project.projectName)}
              className="project-button"
            >
              {project.projectName}
            </button>
          ))
        ) : (
          <p>No projects available yet.</p>
        )}
      </div>
    </div>
  );
};

export default Projects;
