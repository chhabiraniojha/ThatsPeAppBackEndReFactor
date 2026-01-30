function successHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Payment Success</title>
<style>
  body {
    background: #f9f9f9;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: Arial, sans-serif;
  }
  .container {
    text-align: center;
  }
  .circle {
    width: 120px;
    height: 120px;
    background: #4CAF50;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: auto;
    animation: pop 0.5s ease-out;
  }
  .tick {
    color: white;
    font-size: 60px;
    font-weight: bold;
  }
  @keyframes pop {
    0% { transform: scale(0); }
    100% { transform: scale(1); }
  }
  .text {
    font-size: 22px;
    margin-top: 20px;
    font-weight: bold;
  }
  .small {
    font-size: 14px;
    margin-top: 10px;
    color: gray;
  }
  button {
    margin-top: 20px;
    padding: 12px 25px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    display: none;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="circle">
      <div class="tick">✓</div>
    </div>
    <div class="text">Payment Successful</div>
    <div class="small" id="countText">Redirecting in <span id="count">5</span> seconds...</div>
    <div class="small" >Redirecting...</div>
  </div>

<script>
  let c = 5;
  const countEl = document.getElementById("count");
  const countText = document.getElementById("countText");
  const btn = document.getElementById("redirectBtn");

  const timer = setInterval(() => {
    c--;
    countEl.innerText = c;

    if (c === 0) {
      clearInterval(timer);
      countText.innerText = "You can continue to the app";
      btn.style.display = "inline-block";
    }
  }, 1000);

  function redirectApp() {
    window.location.href = "thatspe://payment-success"; // your deep link
  }
</script>

</body>
</html>
`;
}


module.exports = successHTML;