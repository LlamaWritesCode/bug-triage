const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/report', (req, res) => {
  const bugData = req.body;
  
  console.log("🚀 === NEW BUG RECEIVED ===");
  console.log("URL:", bugData.url);
  console.log("Total Logs:", bugData.logs.length);
  console.log("Logs Content:", JSON.stringify(bugData.logs, null, 2));
  
  res.json({ success: true, id: Date.now() });
});

app.listen(3000, () => {
  console.log('✅ Backend running on http://localhost:3000');
});