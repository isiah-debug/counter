const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: 'https://good-drum-142535.upstash.io', // Your hardcoded url from line 5
  token: 'gQAAAAAAAizHAAIgcDEyMTY4NWU5ODk3OGQ0MTRhODc0YzgwZjAzMTJjZ mFjMwE', // Your token from line 6
});

module.exports = async (req, res) => {
  // Handle incoming POST request from Shopify
  if (req.method === 'POST') {
    try {
      const { orderId, customerEmail, customerName } = req.body;

      // 1. Increment your counter in Upstash
      const newCount = await redis.incr('order_counter');

      // 2. CHECK: Is this the 499th order?
      if (newCount === 499) {
        console.log(` MILESTONE HIT: Order #${orderId} is number 499!`);
        
        // ==========================================
        // PLACE YOUR EMAILJS / NOTIFICATION CODE HERE
        // ==========================================
        
      }

      // Return response back to Shopify
      return res.status(200).json({ 
        success: true, 
        currentCount: newCount,
        milestoneReached: newCount === 499 
      });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
