'use client';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth, storage, database } from '@/app/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, get as dbGet, update as dbUpdate } from 'firebase/database';
import { Toaster, toast } from 'react-hot-toast';

const EditJobAd: React.FC = () => {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState<string>('');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [skills, setSkills] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [pay, setPay] = useState<string>('');
  const [payType, setPayType] = useState<'Daily' | 'Hourly'>('Daily');
  const [referencePhotos, setReferencePhotos] = useState<File[]>([]);
  const [currentPhotoUrls, setCurrentPhotoUrls] = useState<string[]>([]); // To store existing photo URLs
  const router = useRouter();
  const pathname = usePathname();
  const jobId = pathname.split('/').pop(); // Extract job ID from the URL

  useEffect(() => {
    // Redirect if user is not authenticated
    let userSession: any = sessionStorage.getItem('user');
    if (!user && !userSession) {
      router.push('/sign-in');
    }

    // Fetch the job details from the database
    const fetchJobDetails = async () => {
      if (jobId) {
        try {
          const jobRef = dbRef(database, `JobPosts/${jobId}`);
          const jobSnapshot = await dbGet(jobRef);
          const jobData = jobSnapshot.val();

          if (jobData) {
            setTitle(jobData.title);
            setShortDescription(jobData.description);
            setSkills(jobData.skills);
            setLocation(jobData.location);
            setPay(jobData.pay);
            setPayType(jobData.payType);
            setCurrentPhotoUrls(jobData.urlList || []);
          }
        } catch (error) {
          console.error('Failed to fetch job details:', error);
          toast.error('Failed to fetch job details.');
        }
      }
    };

    fetchJobDetails();
  }, [user, router, jobId]);

  const handleEditJobAd = async () => {
    if (!title || !shortDescription || !skills || !location || !pay) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      toast.loading('Updating job ad...');
      const userId = user?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Upload new reference photos
      const uploadedPhotos: string[] = [];
      for (const photo of referencePhotos) {
        const photoRef = ref(storage, `JobPosts/${userId}/${photo.name}`);
        await uploadBytes(photoRef, photo);
        const photoURL = await getDownloadURL(photoRef);
        uploadedPhotos.push(photoURL);
      }

      // Update job ad data in Realtime Database
      const updatedJobData = {
        title,
        description: shortDescription,
        skills,
        location,
        pay,
        payType,
        urlList: [...currentPhotoUrls, ...uploadedPhotos], // Combine old and new photos
      };

      const jobRef = dbRef(database, `JobPosts/${jobId}`);
      await dbUpdate(jobRef, updatedJobData);

      toast.dismiss();
      toast.success('Job ad updated successfully!');
      router.push('/my-job-ads'); // Redirect to My Job Ads page
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error('Failed to update job ad!');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length + currentPhotoUrls.length > 3) {
        toast.error('You can only upload up to 3 photos.');
      } else {
        setReferencePhotos(Array.from(e.target.files));
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#091e28]">
      <Toaster />
      <div className="bg-[#1c2a36] m-4 p-10 rounded-lg shadow-xl w-full max-w-3xl">
        <h1 className="text-white text-2xl mb-5">Edit Job Ad</h1>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Form fields similar to AddJobAd */}
          <div>
            <label className="text-white block mb-2">Title</label>
            <input
              type="text"
              placeholder="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Short Description</label>
            <input
              type="text"
              placeholder="Short Description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Skills</label>
            <input
              type="text"
              placeholder="Required Skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Location</label>
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Pay</label>
            <input
              type="text"
              placeholder="Pay"
              value={pay}
              onChange={(e) => setPay(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Pay Type</label>
            <select
              value={payType}
              onChange={(e) => setPayType(e.target.value as 'Daily' | 'Hourly')}
              className="w-full p-3 mb-4 bg-gray-700 rounded text-white outline-none"
            >
              <option value="Daily">Daily</option>
              <option value="Hourly">Hourly</option>
            </select>
          </div>
          <div>
            <label className="text-white block mb-2">Reference Photos (max 3)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full p-3 mb-4 bg-gray-700 rounded text-white placeholder-gray-500"
            />
            <div className="flex gap-2">
              {currentPhotoUrls.map((url, index) => (
                <img key={index} src={url} alt="Current" className="w-20 h-20 rounded object-cover" />
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={handleEditJobAd}
          className="w-full p-3 bg-[#ffffff] rounded text-[#091e28] block font-bold mt-6"
        >
          Update Job Ad
        </button>
        <div className="flex justify-between m-3 text-white">
          <button
            onClick={() => router.push('/')}
            className="text-white underline"
          >
            Back to Home
          </button>
          <button
            onClick={() => router.push('/my-job-ads')}
            className="text-white underline"
          >
            Go to My Job Ads
          </button>
        </div>
      </div>
    </main>
  );
};

export default EditJobAd;
