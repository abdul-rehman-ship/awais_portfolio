'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, database } from '@/app/firebase/config';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { ref, get, child } from 'firebase/database';
import { Modal, Button, Carousel } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Image from 'next/image';

interface User {
  fullName: string;
  pic: string;
  cv: string;
}

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

export default function Home() {
  const [user] = useAuthState(auth);
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [filteredJobPosts, setFilteredJobPosts] = useState<JobPost[]>([]);
  const [usersData, setUsersData] = useState<Record<string, User>>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [search, setSearch] = useState(''); // State for search input
  const router = useRouter();

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('user');
    if (!user && !sessionUser) {
      router.push('/sign-in');
    }

    const fetchJobPostsAndUsers = async () => {
      try {
        const db = ref(database);
        const jobPostsSnapshot = await get(child(db, 'JobPosts'));
        const jobPostsData = jobPostsSnapshot.val();
        const jobPostsArray: JobPost[] = [];
        for (const key in jobPostsData) {
          jobPostsArray.push({ ...jobPostsData[key], id: key });
        }

        const usersSnapshot = await get(child(db, 'UsersData'));
        const usersData = usersSnapshot.val();
        setUsersData(usersData);

        // Filter out the current user's job posts
        const userJobPosts = jobPostsArray.filter(post => post.userId !== user?.uid);
        setJobPosts(userJobPosts);
        setFilteredJobPosts(userJobPosts); // Initialize filtered job posts
      } catch (error) {
        console.error(error);
      }
    };

    fetchJobPostsAndUsers();
  }, [user, router]);

  useEffect(() => {
    // Filter job posts based on search input
    const filtered = jobPosts.filter(post => 
      post.title.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredJobPosts(filtered);
  }, [search]);

  const handleShowModal = (job: JobPost) => {
    setSelectedJob(job);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  return (
    <main>
        <div className="h-screen flex flex-col bg-[#091e28]">
      {/* Navbar with relative positioning */}
      <div className="relative z-10">
        <Navbar />
      </div>
      
      
      <div className="flex flex-col items-center  justify-center  bg-[#091e28] p-4">
        <div className="w-full max-w-6xl mt-4  mb-4 flex  flex-wrap gap-3 items-center justify-between ">
          <Button
            variant="light"
            onClick={() => router.push('/newAd')}
            style={{ fontWeight: 'bold' }}
          >
            Add New Job Ad
          </Button>
          <input
            type="text"
            placeholder="Search by Title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control w-50 "
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {filteredJobPosts.map((post) => {
            const userData = usersData[post.userId] || {};
            const profilePic = userData.pic || '';
            const fullName = userData.fullName || '';

            return (
              <div key={post.id} className="bg-[#1c2a36] p-6 rounded-lg shadow-md mb-4">
                <div className="flex items-center mb-4">
                  {profilePic && (
                    <img
                      src={profilePic}
                      alt="Profile Pic"
                      className="w-12 h-12 rounded-full mr-4"
                    />
                  )}
                  <div>
                    <h2 className="text-white text-lg font-bold">{fullName}</h2>
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
                <h3 className="text-white text-xl mb-2">{post.title}</h3>
                <p className="text-white mb-4">{post.description}</p>
                <div className="flex gap-4">
                  <Button variant="success" onClick={() => router.push(`/messages/${post.userId}`)}>Hire/Message</Button>
                  <Button variant="info" onClick={() => window.open(userData.cv, '_blank')}>View CV</Button>
                </div>
                <Button variant="link" className="mt-2" onClick={() => handleShowModal(post)}>View Details</Button>
              </div>
            );
          })}
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
                      layout="fill"
                      objectFit="cover"
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
      </div>
    </main>
  );
}
