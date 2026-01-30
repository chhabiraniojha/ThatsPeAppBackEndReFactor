function pendingHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Payment Pending</title>
<style>
  body {
    background: #f9f9f9;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: Arial, sans-serif;
  }
  .container { text-align: center; }
  .circle {
    width: 120px;
    height: 120px;
    background: #FFC107;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: auto;
  }
  .text {
    font-size: 22px;
    margin-top: 20px;
    font-weight: bold;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="circle">
      <div style="font-size:50px;">⏳</div>
    </div>
    <div class="text">Payment Pending</div>
  </div>
</body>
</html>
`;
}

module.exports = pendingHTML;