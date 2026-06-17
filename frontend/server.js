const express = require('express');
const path = require('path');

const app = express();
const PORT = 3841;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`社区水果店前端看板已启动: http://localhost:${PORT}`);
});
