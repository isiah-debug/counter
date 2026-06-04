const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: 'https://good-drum-142535.upstash.io',
  token: 'gQAAAAAAAizHAAIgcDEyMTY4NWU5ODk3OGQ0MTRhODc0YzgwZjAzMTJjZmFjMw',
});

module.exports = async (req, res) => {
  // 1. Force CORS permissions so Shopify's sandboxed worker doesn't block the request
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Handle Shopify's Pre-flight OPTIONS handshake check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      // 3. Extract the body data sent from Shopify
      const { orderId, customerEmail, customerName } = req.body || {};

      // 4. Keep counting up globally in Upstash
      const totalCount = await redis.incr('order_counter');

      // 5. Use Modulo (%) to calculate your looping milestone number
      const relativeCount = totalCount % 499;
      const isMilestone = relativeCount === 0;

      // 6. CHECK: If the remainder is 0, we hit exactly 499 (or its multiples)
      if (isMilestone) {
        console.log(`🎯 Milestone reached at global order #${totalCount}! Firing EmailJS...`);

        // 7. Smart name extraction fallback:
        // If customerName is blank/missing, split the email to get a clean handle (e.g. "johndoe" from johndoe@gmail.com)
        const verifiedName = (customerName && customerName.trim() !== "") 
          ? customerName 
          : (customerEmail && customerEmail.includes('@') ? customerEmail.split('@')[0] : "Valued Customer");

        // Send Email via EmailJS REST API
        const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            service_id: 'service_rpfkof4',
            template_id: 'template_hkrwbdu',
            user_id: 'hxUyPW7DDvYhSK7gj',
            accessToken: 'b67sLs5FivD2bTNygwiwq', // <-- MAKE SURE YOUR KEY IS PASTED HERE
            template_params: {
              order_id: String(orderId || 'N/A'),
              customer_name: String(verifiedName), // <-- THIS MAKES SURE THE REPAIRED NAME LOGIC IS PASSED TO EMAILJS
              customer_email: String(customerEmail || 'N/A'),
              total_orders: String(totalCount),
            },
          }),
        });

        const resText = await emailResponse.text();
        console.log('✉️ EmailJS Server Response:', resText);
      }

      // Return your response back to your Shopify Pixel sandbox environment
      return res.status(200).json({ 
        success: true, 
        globalCount: totalCount,
        displayCount: isMilestone ? 499 : relativeCount,
        milestoneReached: isMilestone
      });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
