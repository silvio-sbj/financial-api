const app = require("./");

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.clear();
  console.info(`Server is running on http://localhost:${port}`);
});