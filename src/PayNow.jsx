import React from 'react';

function PayNow({ amount, memberId, onPaymentSuccess }) {

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const res = await loadRazorpayScript();

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    // 1. Create order on backend to get order_id
    const orderResult = await fetch('http://localhost:3002/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ amount: amount * 100 })  // amount in paise
    }).then((t) => t.json());

    if (!orderResult.order_id) {
      alert('Could not create order. Try again.');
      return;
    }

    // 2. Configure Razorpay options
    const options = {
      key: 'rzp_test_cGMp9Ibbd00J3B', // get it from Razorpay dashboard
      amount: amount * 100,
      currency: 'INR',
      name: 'Gym Membership',
      description: 'Membership Payment',
      order_id: orderResult.order_id,
      handler: async function (response) {
        // Payment successful, send details to backend to verify & update DB
        const verifyResponse = await fetch('http://localhost:3002/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            memberId
          })
        }).then(t => t.json());

        if (verifyResponse.success) {
          alert('Payment successful and verified!');
          onPaymentSuccess();  // e.g. refetch member data or update UI
        } else {
          alert('Payment verification failed.');
        }
      },
      prefill: {
        email: '',  // You can prefill user email here if you have it
        contact: '' // prefill contact number if you want
      },
      theme: {
        color: '#3399cc'
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return (
    <button onClick={handlePayment} className="btn btn-primary">
      Pay Now ₹{amount}
    </button>
  );
}

export default PayNow;
