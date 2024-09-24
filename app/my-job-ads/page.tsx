'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, database } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { ref, get, child } from 'firebase/database';
import { Modal, Button, Carousel } from 'react-bootstrap'; // Import Bootstrap components
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import Image from 'next/image';

interface JobPost {
  userId: string;
  title: string;
  description: string;
  skills: string;
  location: string;
  pay: string;
  payType: 'Daily' | 'Hourly';
  urlList: string[];
  id: string;
}

export default function MyJobAds() {
  const [user] = useAuthState(auth);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const router = useRouter();

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('user');
    if (!user && !sessionUser) {
      router.push('/sign-in');
    }

    const fetchUserJobPosts = async () => {
      try {
        const db = ref(database);
        const jobPostsSnapshot = await get(child(db, 'JobPosts'));
        const jobPostsData = jobPostsSnapshot.val();
        const jobPostsArray: JobPost[] = [];

        for (const key in jobPostsData) {
          jobPostsArray.push({ ...jobPostsData[key], id: key });
        }

        // Filter for only the current user's job posts
        setJobPosts(jobPostsArray.filter(post => post.userId === user?.uid));
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserJobPosts();
  }, [user, router]);

  const handleShowModal = (job: JobPost) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleEditJob = (jobId: string) => {
    // Navigate to the edit page for the selected job
    router.push(`/edit-job/${jobId}`);
  };

  return (
    <main>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#091e28] p-4">
        <div className="w-full max-w-6xl mb-4 flex justify-start">
          <Button
            variant="light"
            onClick={() => router.push('/newAd')}
            style={{ fontWeight: 'bold' }}
          >
            Add New Job Ad
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {jobPosts.map((post) => (
            <div key={post.id} className="bg-[#1c2a36] p-6 rounded-lg shadow-md mb-4">
                
              <div className="flex items-center mb-4">
              
                <div>
                  <h2 className="text-white text-lg font-bold">{post.title}</h2>
                  <p className="text-gray-400">at: {post.location}</p>
                </div>
                <div className="ml-auto text-white text-right">
                <p className="font-bold">
  {post.pay.includes('$') ? post.pay : `$${post.pay}`}
</p>
                  <p>{post.payType}</p>
                </div>
              </div>
              {post.urlList.length > 0 && (
                <img
                  src={post.urlList[0]}
                  alt="Job Image"
                  className="w-full h-60 object-cover rounded-md mb-4"
                />
              )}
              
              <p className="text-white mb-4">{post.description}</p>
              <div className="flex gap-4">
                <Button variant="warning" onClick={() => handleEditJob(post.id)}>Edit</Button>
              </div>
              <Button variant="link" className="mt-2" onClick={() => handleShowModal(post)}>View Details</Button>
            </div>
          ))}
        </div>
      </div>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedJob?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedJob?.urlList.length ? (
            <Carousel>
              {selectedJob.urlList.map((url, index) => (
                <Carousel.Item key={index}>
                  <div className="d-block w-100" style={{ position: 'relative', height: '400px' }}>
                    <Image
                      src={url}
                      alt={`Job Image ${index + 1}`}
                      layout="fill" // Use layout fill to make image cover the container
                      objectFit="cover" // To maintain aspect ratio and cover the container
                      quality={100}
                    />
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          ) : null}
          <p>{selectedJob?.description}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}
