const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: 'https://good-drum-142535.upstash.io',
  token: 'gQAAAAAAAizHAAIgcDEyMTY4NWU5ODk3OGQ0MTRhODc0YzgwZjAzMTJjZmFjMwE',
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const { orderId, customerEmail, customerName } = req.body;

      // 1. Keep counting up globally in Upstash (e.g., 498, 499, 500...)
      const totalCount = await redis.incr('order_counter');

      // 2. Use Modulo (%) to calculate your looping milestone number
      const relativeCount = totalCount % 499;

      // 3. CHECK: If the remainder is 0, it means we hit exactly 499, 998, 1497, etc.
      if (relativeCount === 0) {
        console.log(` Milestone reached at global order #${totalCount}!`);
        
        // YOUR EMAILJS / NOTIFICATION CODE WILL GO HERE
        
      }

      // Return your response back to Shopify
      return res.status(200).json({ 
        success: true, 
        globalCount: totalCount,
        displayCount: relativeCount === 0 ? 499 : relativeCount, // Keeps it showing 499 on hit instead of 0
        milestoneReached: relativeCount === 0
      });

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
