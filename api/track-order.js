const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: 'https://good-drum-142535.upstash.io',
  token: 'gQAAAAAAAizHAAIgcDEyMTY4NWU5ODk3OGQ0MTRhODc0YzgwZjAzMTJjZmFjMw',
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { orderId, customerEmail, customerName } = req.body;

      // 1. Keep counting up globally in Upstash
      const totalCount = await redis.incr('order_counter');

      // 2. Use Modulo (%) to calculate your looping milestone number
      const relativeCount = totalCount % 499;
      const isMilestone = relativeCount === 0;

      // 3. CHECK: If the remainder is 0, we hit exactly 499 (or its multiples)
      if (isMilestone) {
        console.log(`🎯 Milestone reached at global order #${totalCount}! Firing EmailJS...`);

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
            template_params: {
              order_id: String(orderId || 'N/A'),
              customer_name: String(customerName || 'Valued Customer'),
              customer_email: String(customerEmail || 'N/A'),
              total_orders: String(totalCount),
            },
          }),
        });

        const resText = await emailResponse.text();
        console.log('✉️ EmailJS Server Response:', resText);
      }

      // Return your response back to your terminal/Shopify
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
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
