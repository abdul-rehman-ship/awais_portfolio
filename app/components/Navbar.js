'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

const CustomNavbar = () => {
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth);
    sessionStorage.removeItem('user');
    router.push('/sign-in');
  };

  return (
    <Navbar expand="lg" style={{ backgroundColor: '#091e29', height: '70px' }} variant="dark">
      <Container>
        {/* Site Name on the left */}
        <Navbar.Brand onClick={() => router.push('/')} className="cursor-pointer text-white font-bold">
          Job Hub
        </Navbar.Brand>
        {/* Toggler for small screens */}
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        {/* Collapsible Navbar */}
        <Navbar.Collapse id="responsive-navbar-nav ">
          <Nav className="ms-auto bg-[#091e28]">
            {/* Increased horizontal spacing with mx-3 */}
            <Nav.Link onClick={() => router.push('/')} className="text-white mx-3">
              Home
            </Nav.Link>
            <Nav.Link onClick={() => router.push('/my-job-ads')} className="text-white mx-3">
              My Job Ads
            </Nav.Link>
            <Nav.Link onClick={() => router.push('/messages')} className="text-white mx-3">
              Chat List
            </Nav.Link>
            <Nav.Link onClick={() => router.push('/profile')} className="text-white mx-3">
              Profile
            </Nav.Link>
            {/* Logout Button with bold text */}
            <Button
              onClick={handleLogout}
              className="text-[#091e28] btn btn-light ms-3 fw-bold"
              style={{ fontWeight: 'bold' }}
            >
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
