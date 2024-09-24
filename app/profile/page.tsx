'use client';
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage, database } from '@/app/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, get as dbGet, update as dbUpdate } from 'firebase/database';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const Profile = () => {
  const [user]:any = useAuthState(auth);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [place, setPlace] = useState('');
  const [skills, setSkills] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [currentProfilePicUrl, setCurrentProfilePicUrl] = useState('');
  const [currentCvUrl, setCurrentCvUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    const sessionUser = sessionStorage.getItem('user');
    if (!user && !sessionUser) {
      router.push('/sign-in');
    }

    // Fetch existing user data
    const fetchUserData = async () => {
      try {
        const userId = user.uid;
        const userRef = dbRef(database, `UsersData/${userId}`);
        const snapshot = await dbGet(userRef);
        const userData = snapshot.val();

        if (userData) {
          setEmail(userData.email);
          setFullName(userData.fullName);
          setPlace(userData.place);
          setSkills(userData.skills);
          setCurrentProfilePicUrl(userData.pic);
          setCurrentCvUrl(userData.cv);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data.');
      }
    };

    fetchUserData();
  }, [user, router]);

  const handleUpdateProfile = async () => {
    if (!fullName || !place || !skills) {
      toast.error('Please fill in all fields.');
      return;
    }

    try {
      toast.loading('Updating profile...');
      const userId:any = user?.uid;

      // Upload new profile picture if selected
      let profilePicURL = currentProfilePicUrl;
      if (profilePic) {
        const profilePicRef = ref(storage, `UsersData/${userId}/${profilePic.name}`);
        await uploadBytes(profilePicRef, profilePic);
        profilePicURL = await getDownloadURL(profilePicRef);
      }

      // Upload new CV if selected
      let cvURL = currentCvUrl;
      if (cv) {
        const cvRef = ref(storage, `DocumentFiles/${userId}/${cv.name}`);
        await uploadBytes(cvRef, cv);
        cvURL = await getDownloadURL(cvRef);
      }

      // Update user data in Realtime Database
      await dbUpdate(dbRef(database, 'UsersData/' + userId), {
        fullName,
        place,
        skills,
        pic: profilePicURL,
        cv: cvURL,
      });

      toast.dismiss();
      toast.success('Profile updated successfully!');
      setProfilePic(null);
      setCv(null);
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error('Failed to update profile!');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#091e28]">
      <Toaster />
      <div className="bg-[#1c2a36] p-10 rounded-lg shadow-xl w-full max-w-3xl">
        <h1 className="text-white text-2xl mb-5">Edit Profile</h1>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="text-white block mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Place</label>
            <input
              type="text"
              placeholder="Place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Skills</label>
            <input
              type="text"
              placeholder="Skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Email (read-only)</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePic(e.target.files ? e.target.files[0] : null)}
              className="w-full p-3 mb-4 bg-gray-700 rounded text-white placeholder-gray-500"
            />
            {currentProfilePicUrl && (
              <img src={currentProfilePicUrl} alt="Current Profile" className="w-20 h-20 rounded mt-2" />
            )}
          </div>
          <div>
            <label className="text-white block mb-2">CV (PDF/Word)</label>
            <input
              type="file"
              accept=".pdf, .doc, .docx"
              onChange={(e) => setCv(e.target.files ? e.target.files[0] : null)}
              className="w-full p-3 mb-4 bg-gray-700 rounded text-white placeholder-gray-500"
            />
            {currentCvUrl && (
              <a href={currentCvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                View Current CV
              </a>
            )}
          </div>
        </div>
        <button
          onClick={handleUpdateProfile}
          className="w-full p-3 bg-[#ffffff] rounded text-[#091e28] block font-bold mt-6"
        >
          Update Profile
        </button>
        <div className="flex justify-between m-3 text-white">
          <button
            onClick={() => router.push('/')}
            className="text-white underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
};

export default Profile;
