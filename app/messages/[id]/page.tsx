'use client';

import { useEffect, useRef,useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, database, storage } from '@/app/firebase/config';
import { ref, onValue, set ,push} from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { Button, InputGroup, FormControl, Toast } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPaperclip, FaArrowLeft } from 'react-icons/fa';
import { MdSend } from 'react-icons/md';

const ChatPage = () => {
  const [user]: any = useAuthState(auth);
  const [messages, setMessages]: any = useState<any[]>([]);
  const [messageText, setMessageText]: any = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [chatUserId, setChatUserId]: any = useState<string | null>(null);
  const [chatUser, setChatUser]: any = useState<any>(null);
  const [senderUser, setSender]: any = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();
  
  const userId: any = usePathname().split('/').pop();
  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  useEffect(() => {
    if (messages.length > 0) {
      return;
    }
    const SessionUser: any = sessionStorage.getItem('user');


    const fetchChatData = async () => {
      const chatRef = ref(database, `/Chatting/Chat${user?.uid}`);
      onValue(chatRef, (snapshot) => {
        let msgList:any=[]
        const data = snapshot.val();
        if (data) {
          const messagesList = Object.values(data);
          messagesList.forEach((msg: any) => {
            
            if(msg.recieverId===userId || msg.senderId===userId){
              msgList.push(msg)
            }
          })
          
       
          // Function to parse date in DD-MM-YYYY format
          const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day); // months are 0-based in Date
          };
    
          // Function to parse time in hh:mm AM/PM format
          // const parseTime = (timeStr: string) => {
          //   const [time, period] = timeStr.split(' ');
          //   const [hours, minutes] = time.split(':').map(Number);
          //   const normalizedHours = period === 'PM' && hours !== 12 ? hours + 12 : (period === 'AM' && hours === 12 ? 0 : hours);
          //   return normalizedHours * 60 + minutes; // Convert to minutes
          // };
    
          // Sort messages by date and time
          // msgList.sort((a: any, b: any) => {
          //   const dateA = parseDate(a.date);
          //   const dateB = parseDate(b.date);
    
          //   if (dateA.getTime() === dateB.getTime()) {
          //     // If dates are the same, sort by time
          //     const timeA = parseTime(a.time);
          //     const timeB = parseTime(b.time);
          //     return timeA - timeB;
          //   }
          //   return dateA.getTime() - dateB.getTime();
          // });
    
          setMessages(msgList);
          
        }

      });
    
      // Fetch chat user data
      const chatUserRef = ref(database, `/UsersData/${userId}`);
      onValue(chatUserRef, (snapshot) => {
        setChatUser(snapshot.val());
      });
    
      const chatSUserRef = ref(database, `/UsersData/${user?.uid}`);
      onValue(chatSUserRef, (snapshot) => {
        
        setSender(snapshot.val());
      });
    };
    
    
    

    if (!user && !SessionUser) {
      router.push('/sign-in');
      return;
    } else if (user) {
      if (user.uid) fetchChatData();
    }
    else if(!senderUser){
      fetchChatData();
    }

    setChatUserId(userId);
  }, [user, userId, router]);

  const sanitizePath = (path: any) => {
    return path.replace(/[.#$[\]]/g, '_'); // Replace invalid characters with underscore
  };

  const generateUniqueId = () => {
    const newRef = push(ref(database));
  
    
    return newRef.key;
  };

  const formatDate = (dateString: any) => {
    const [month, day, year]: any = dateString.split('/'); // Split MM/DD/YYYY into [MM, DD, YYYY]
    return `${day}-${month}-${year}`; // Return DD-MM-YYYY format
  };

  const formatTimeFromDate = (date: any) => {
    // Get the hours and minutes
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';

    // Convert hours to 12-hour format
    const formattedHours = (hours % 12) || 12; // 0 becomes 12

    // Format minutes to always show two digits
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${formattedHours}:${formattedMinutes} ${period}`;
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !image) return;

    // Get unique Id
    const messageId: any = generateUniqueId();

    const newMessage = {
      id: messageId,
      date: formatDate(new Date().toLocaleDateString()),
      time: formatTimeFromDate(new Date()),
      senderId: user.uid,
      recieverId: chatUserId,
      message: messageText,
      fileType: image ? 'image' : 'text',
      fileName: image ? image.name : 'text message',
      picUrl: image ? await uploadImage(image) : 'null',
      senderName: senderUser.fullName ? senderUser.fullName:"",
      senderPic: senderUser.pic,
      flag: 'unread',
    };

    const chatUserPath: any = `/Chatting/Chat${chatUserId}/${messageId}`;
    const userPath: any = `/Chatting/Chat${user.uid}/${messageId}`;

    await set(ref(database, chatUserPath), newMessage);
    await set(ref(database, userPath), newMessage);

    setMessageText('');
    setImage(null);
  };

  const uploadImage = async (file: File) => {
    const uId: any = new Date().toISOString();
    const imageRef = storageRef(storage, `chatImages/${uId}_${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
      setShowToast(true); // Show notification
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#091e28]">
      <div className="flex-none bg-[#1c2a36] p-4 flex items-center border-b border-gray-700">
        <Button variant="link" className="text-white" onClick={() => router.push('/messages')}>
          <FaArrowLeft size={24} />
        </Button>
        <div className="ml-4 flex items-center">
          {chatUser?.pic && (
            <img
              src={chatUser.pic}
              alt="Receiver Pic"
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="ml-2 text-white">
            <h3 className="text-lg font-semibold">{chatUser?.fullName}</h3>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg: any) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div className={`max-w-xs p-3 rounded-lg ${msg.senderId === user.uid ? 'bg-[#faee4d]' : 'bg-[#1c2a36]'} text-white`}>
              {msg.fileType === 'image' && msg.picUrl ? (
                <img
                  src={msg.picUrl}
                  alt="Message Image"
                  className="w-64 h-64 object-cover rounded-md"
                />
              ) : (
                <p >{msg.message}</p>
              )}
              <div className="text-xs mt-1">
                {msg.senderName} • {msg.time}
              </div>
            </div>
          </div>
        ))}
         <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#091e28] border-t border-gray-700">
        <InputGroup>
          <Button variant="outline-light" onClick={() => document.getElementById('file-input')?.click()}>
            <FaPaperclip />
          </Button>
          <FormControl
            placeholder="Type a message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button variant="primary" onClick={handleSendMessage}>
            <MdSend />
          </Button>
        </InputGroup>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageSelection}
        />
      </div>

      {/* Toast Notification for Image Selection */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={3000}
        autohide
        style={{ position: 'absolute', bottom: 20, right: 20 }}
      >
        <Toast.Body>Image selected to send.</Toast.Body>
      </Toast>
    </div>
  );
};

export default ChatPage;
