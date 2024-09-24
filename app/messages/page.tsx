'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, database } from '@/app/firebase/config';
import { ref, onValue, get } from 'firebase/database';
import Navbar from '@/app/components/Navbar'; // Ensure you have a Navbar component
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

const MessagesPage = () => {
  const [user] :any= useAuthState(auth);
  const [chatUsers, setChatUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    if(chatUsers.length>0){
        return;
    }
    const sessionUser = sessionStorage.getItem('user');
    if (!user && !sessionUser)  {
      router.push('/sign-in');
      return;
    }

    const fetchChatUsers = async () => {
      const chatRef = ref(database, `/Chatting/Chat${user?.uid}`);
      onValue(chatRef, async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messagesList = Object.values(data);

          // Collect unique user IDs
          const userIds = new Set<string>();
          messagesList.forEach((msg: any) => {
            if (msg.senderId !== user.uid) userIds.add(msg.senderId);
            if (msg.receiverId !== user.uid) userIds.add(msg.receiverId);
          });

          // Fetch user data for each unique user ID
          const usersDataPromises = Array.from(userIds).map(async (uid: string) => {
            const userRef = ref(database, `/UsersData/${uid}`);
            const snapshot = await get(userRef);
            return snapshot.val();
          });

          try {
            const users = await Promise.all(usersDataPromises);
            setChatUsers(users as User[]); // Type assertion
            console.log('Fetched chat users:', users);
          } catch (error) {
            console.error('Failed to fetch user data:', error);
          }
        }
      });
    };

    fetchChatUsers();
  });

  return (
    <div className="h-screen flex flex-col bg-[#091e28]">
      <Navbar />
      <div className="flex flex-1">
        {/* Left Side: User List */}
        <div className=" w-full  md:w-1/2 lg:w-1/4 [#1c2a36] overflow-y-auto p-4">
        {chatUsers.length===0 && <p className="text-white">No chat Found .</p>}
          { chatUsers.length>0 && chatUsers.map((chatUser:any) => (
        chatUser!==null &&  <div
              key={chatUser.userId}
              className="flex items-center p-3 mb-2 border-b border-gray-600  cursor-pointer hover:bg-[#faee4d] rounded-lg"
              onClick={() => router.push(`/messages/${chatUser.userId}`)}
            >
              <Image
                src={chatUser?.pic || '/default-profile.png'}
                alt={"image"}
                width={40}
                height={40}
                className="rounded object-cover mx-2"
              />
              <div className="ml-3">
                <div className="text-white font-bold">{chatUser?.fullName}</div>
                <div className="text-gray-400 text-sm">{chatUser?.email}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Placeholder */}
        <div className="w-3/4 md:flex hidden items-center justify-center bg-[#091e28] text-white">
          <p>Click on a user to start chatting!</p>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
