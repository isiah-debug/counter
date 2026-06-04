const { Redis } = require('@upstash/redis');

// Initialize Upstash Redis
const redis = new Redis({
  url: process.env.https://good-drum-142535.upstash.io,
  token: process.env.gQAAAAAAAizHAAIgcDEyMTY4NWU5ODk3OGQ0MTRhODc0YzgwZjAzMTJjZmFjMw,
});

module.exports = async (req, res) => {
  // Handle incoming POST request from Shopify
  if (req.method === 'POST') {
    try {
      const { orderId, customerEmail, customerName } = req.body;

      // 1. Increment your counter in Upstash
      const newCount = await redis.incr('order_counter');

      // 2. Add your EmailJS sending logic here using node-specific formatting if needed, 
      // or keep it simple for your counter test first!

      return res.status(200).json({ success: true, currentCount: newCount });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
