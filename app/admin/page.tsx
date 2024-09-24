'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { ref, get, child, update, remove } from 'firebase/database';
import { database } from '@/app/firebase/config';


interface User {
  fullName: string;
  pic: string;
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
  flag: 'Pending' | 'Approved' | 'Rejected';
}

const AdminPage: React.FC = () => {
  
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [usersData, setUsersData] = useState<Record<string, User>>({});
  const router = useRouter();
  useEffect(() => {
    const cookies = document.cookie.split('; ').reduce((acc:any, cookie:any) => {
      const [name, value] = cookie.split('=');
      acc[name] = value;
      return acc;
    }, {});

    if (cookies.adminLoggedIn === 'true') {
      
      const fetchJobPostsAndUsers = async () => {
      
    
        try {
          const db = ref(database);
          
          // Fetch job posts
          const jobPostsSnapshot = await get(child(db, 'JobPosts'));
          const jobPostsData = jobPostsSnapshot.val();
          const jobPostsArray: JobPost[] = [];
          for (const key in jobPostsData) {
            jobPostsArray.push({ ...jobPostsData[key], id: key });
          }
          setJobPosts(jobPostsArray);
    
          // Fetch users data
          const usersSnapshot = await get(child(db, 'UsersData'));
          const usersData = usersSnapshot.val();
          setUsersData(usersData);
        } catch (error) {
          console.error(error);
          toast.error('Failed to fetch data.');
        }
      };
      fetchJobPostsAndUsers();
    } else {
      toast.error('You are not authorized to access this page.');
      router.push('/sign-in');
    }
  }, [router]);

  const handleAction = async (id: string, action: 'accept' | 'reject' | 'delete') => {
    const jobPostRef = ref(database, `JobPosts/${id}`);
  
    try {
      toast.loading('Performing action...');
      
      if (action === 'accept') {
        await update(jobPostRef, { flag: 'Approved' });
      toast.dismiss();
      jobPosts.map((post) => {
        if (post.id === id) {
          post.flag = 'Approved';
        }
        return post;
      }
      );
        toast.success('Job ad approved!');
      } else if (action === 'reject') {
        await update(jobPostRef, { flag: 'Rejected' });

      toast.dismiss();

        toast.success('Job ad rejected!');
       //update job post flag to Rejected
       jobPosts.map((post) => {
        if (post.id === id) {
          post.flag = 'Rejected';
        }
        return post;
      }
      );
      } else if (action === 'delete') {
        await remove(jobPostRef);
      setJobPosts((prevPosts) => prevPosts.filter((post) => post.id !== id));
      toast.dismiss();

        toast.success('Job ad deleted!');
      }
      
      // Update state to reflect changes
    } catch (error) {
      console.error(error);
      toast.dismiss();

      toast.error('Failed to perform action.');
    } 
  };

  return (
    <div className="min-h-screen bg-[#ffffff] p-2">
      <Toaster />
      <div className="bg-[#091e28] p-10 rounded-lg shadow-xl w-full">
        <h1 className="text-[#ffffff] font-bold text-2xl mb-5">Admin Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobPosts.map((post) => {
            const userData = usersData[post.userId] || {};
            const profilePic = userData.pic || '';
            const fullName = userData.fullName || '';

            return (
              <div key={post.id} className="bg-[#1c2a36] p-6 rounded-lg shadow-md">
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
                <div className="flex justify-between flex-wrap gap-2">
                  {post.flag === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleAction(post.id, 'accept')}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(post.id, 'reject')}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {post.flag !== 'Pending' && (
                    <button
                      onClick={() => handleAction(post.id, 'delete')}
                      className="bg-gray-500 text-white px-4 py-2 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
