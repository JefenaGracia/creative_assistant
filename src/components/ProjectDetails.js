// ProjectDetails.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { classroomId, projectName } = useParams();
  const [projectDetails, setProjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const projectRef = doc(db, 'classrooms', classroomId, 'projects', projectName);
        const projectSnap = await getDoc(projectRef);

        if (projectSnap.exists()) {
          setProjectDetails(projectSnap.data());
        } else {
          setError('Project not found.');
        }
      } catch (error) {
        setError('Error fetching project details.');
        console.error(error);
      }
      setLoading(false);
    };

    fetchProjectDetails();
  }, [classroomId, projectName]);

  if (loading) {
    return <p>Loading project details...</p>;
  }

  return (
    <div className="project-details">
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <h1>{projectDetails?.projectName}</h1>
          <h2>Team Members</h2>
          {projectDetails?.teamMembers && projectDetails.teamMembers.length > 0 ? (
            <ul>
              {projectDetails.teamMembers.map((member, index) => (
                <li key={index}>{member}</li>
              ))}
            </ul>
          ) : (
            <p>No team members assigned.</p>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectDetails;
