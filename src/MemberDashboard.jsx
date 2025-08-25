import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Logout from './logout';
import PayNow from './PayNow';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3002";

function MemberDashboard() {
  const [member, setMember] = useState(null);

  const fetchMember = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMember(res.data);
    } catch (err) {
      console.error("Failed to fetch member data:", err);
    }
  };

  useEffect(() => {
    fetchMember();
  }, []);

  if (!member) return <p>Loading...</p>;

  //console.log(member)

  return (
    <div>
      <h2>Welcome, {member.name}</h2>
      <p>Email: {member.email}</p>
      <p>Age: {member.age}</p>
      <p>Membership: {member.membershipType}</p>
      <p>Status: {member.paymentStatus?.isPaid ? "Paid" : "Unpaid"}</p>
      <p>Next Due: {member.paymentStatus?.nextDueDate}</p>
      <PayNow
          amount={1000} // replace with actual amount or member.membershipPrice
          memberId={member._id}
          onPaymentSuccess={fetchMember}
        />
      <Logout />
    </div>
  );
}

export default MemberDashboard;