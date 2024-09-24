'use client'
import { useState } from 'react';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { auth, storage, database } from '@/app/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, set as dbSet,get } from 'firebase/database';

import { Toaster, toast } from 'react-hot-toast';
 import { useRouter } from 'next/navigation';



const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [place, setPlace] = useState('');
  const [skills, setSkills] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [cv, setCv] = useState(null);
  const [createUserWithEmailAndPassword] = useCreateUserWithEmailAndPassword(auth);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !fullName || !place || !skills || !profilePic || !cv) {
      toast.error('Please fill in all fields and upload required files.');
      return;
    }

    try {
      
      toast.loading('Signing up...');
    // get data from realtime database and check email exists or not
    const usersSnapshot = await get(dbRef(database, 'UsersData'));

    // Check if the email exists in the UsersData
    let emailExists = false;
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.email === email) {
          emailExists = true;
        }
      });
    }

    if (emailExists) {
      toast.dismiss();
      toast.error('User with this email already exists. Please use a different email.');
      return;
    }




      const userCredential = await createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      const userId = user.uid;

      // Helper function to generate unique file name based on timestamp
      const generateUniqueFileName = (originalName) => {
        const timestamp = new Date().toISOString();
        return `${timestamp}_${originalName}`;
      };

      // Upload profile picture
      let profilePicURL = '';
      if (profilePic) {
        const profilePicRef = ref(storage, `UsersData/${userId}/${generateUniqueFileName(profilePic.name)}`);
        await uploadBytes(profilePicRef, profilePic);
        profilePicURL = await getDownloadURL(profilePicRef);
      }

      // Upload CV
      let cvURL = '';
      if (cv) {
        const cvRef = ref(storage, `DocumentFiles/${userId}/${generateUniqueFileName(cv.name)}`);
        await uploadBytes(cvRef, cv);
        cvURL = await getDownloadURL(cvRef);
      }

      // Save user data in Realtime Database
      await dbSet(dbRef(database, 'UsersData/' + userId), {
        email,
        fullName,
        place,
        skills,
        pic: profilePicURL,
        cv: cvURL,
        userId,
        password
      });

      toast.dismiss();
      toast.success('Sign up successful!');
      sessionStorage.setItem('user', true);
      setEmail('');
      setPassword('');
      setFullName('');
      setPlace('');
      setSkills('');
      setProfilePic(null);
      setCv(null);
      router.push('/sign-in');
    } catch (e) {
      toast.dismiss();
      console.error(e);
      toast.error(e.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#091e28]">
      <Toaster />
      <div className="bg-[#1c2a36] p-10 rounded-lg shadow-xl w-full max-w-3xl">
        <h1 className="text-white text-2xl mb-5">Sign Up</h1>
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
            <label className="text-white block mb-2">Email</label>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded outline-none text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePic(e.target.files[0])}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="text-white block mb-2">CV (PDF/Word)</label>
            <input
              type="file"
              accept=".pdf, .doc, .docx"
              onChange={(e) => setCv(e.target.files[0])}
              required
              className="w-full p-3 mb-4 bg-gray-700 rounded text-white placeholder-gray-500"
            />
          </div>
        </div>
        <button
          onClick={handleSignUp}
          className="w-full p-3 bg-[#ffffff] rounded text-[#091e28] block font-bold mt-6"
        >
          Sign Up
        </button>
        <div className="flex justify-between m-3 text-white">
          <button
            onClick={() => router.push('/sign-in')}
            className="text-white underline"
          >
            Already have Account
          </button>
        </div>
      </div>
    </main>
  );
};

export default SignUp;
