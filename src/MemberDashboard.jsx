import React, { useEffect, useState } from 'react';
import axios from 'axios';

function MemberDashboard() {
  const [member, setMember] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:3002/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setMember(res.data))
    .catch(err => console.error(err));
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
    </div>
  );
}

export default MemberDashboard;
