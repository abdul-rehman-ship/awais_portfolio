'use client';
import React, { ChangeEvent,useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage, database } from '@/app/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set as dbSet, push as dbPush } from 'firebase/database';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const AddJobAd: React.FC = () => {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState<string>('');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [skills, setSkills] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [pay, setPay] = useState<string>('');
  const [payType, setPayType] = useState<'Daily' | 'Hourly'>('Daily');
  const [referencePhotos, setReferencePhotos] = useState<File[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Redirect if user and userSession are not present
    let userSession:any = sessionStorage.getItem('user')
    if (!user && !userSession) {
      router.push('/sign-in')
    }
  }, [user, router])
  const handleAddJobAd = async () => {
    if (!title || !shortDescription || !skills || !location || !pay || referencePhotos.length === 0) {
      toast.error('Please fill in all fields and upload at least one reference photo.');
      return;
    }

    try {
      toast.loading('Adding job ad...');
      const userId = user?.uid;
      if (!userId) throw new Error('User not authenticated');

      // Helper function to generate unique file name based on timestamp
      const generateUniqueFileName = (originalName: string) => {
        const timestamp = new Date().toISOString();
        return `${timestamp}_${originalName}`;
      };

      // Upload reference photos
      const uploadedPhotos: string[] = [];
      for (const photo of referencePhotos) {
        const photoRef = ref(storage, `JobPosts/${userId}/${generateUniqueFileName(photo.name)}`);
        await uploadBytes(photoRef, photo);
        const photoURL = await getDownloadURL(photoRef);
        uploadedPhotos.push(photoURL);
      }

      // Save job ad data in Realtime Database
      const jobAdRef = dbPush(dbRef(database, 'JobPosts'));
      await dbSet(jobAdRef, {
        userId,
        title,
        flag:"Pending",
        description:shortDescription,
        skills,
        location,
        pay,
        payType,
        urlList: uploadedPhotos,
        id: jobAdRef.key,
      });

      toast.dismiss();
      toast.success('Job ad added successfully!');
      setTitle('');
      setShortDescription('');
      setSkills('');
      setLocation('');
      setPay('');
      setPayType('Daily');
      setReferencePhotos([]);
      router.push('/my-job-ads'); // Redirect to My Job Ads page
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error('Failed to add job ad!');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length > 3) {
        toast.error('You can only upload up to 3 photos.');
      } else {
        setReferencePhotos(Array.from(e.target.files));
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#ffffff]">
      <Toaster />
      <div className="bg-[#091e28] m-4 p-10 rounded-lg shadow-xl w-full max-w-3xl">
        <h1 className="text-white text-2xl mb-5">Add New Job Ad</h1>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
          </div>
        </div>
        <button
          onClick={handleAddJobAd}
          className="w-full p-3 bg-[#ffffff] rounded text-[#091e28] block font-bold mt-6"
        >
          Add Job Ad
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

export default AddJobAd;
