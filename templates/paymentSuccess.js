function successHTML() {
  return ` <!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Payment Success</title>

<!-- IMPORTANT for mobile WebView -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
  html {
    font-size: 16px; /* base size */
  }

  body {
    background: #f9f9f9;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width:100%;
    font-family: Arial, sans-serif;
    margin: 0;
    scroll-behavior: none;
  }

  /* 30% increase */
  .container {
    text-align: center;
    transform: scale(1.3);
  }

  .circle {
    width: 8rem;
    height: 8rem;
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
    font-size: 3.5rem;
    font-weight: bold;
  }

  @keyframes pop {
    0% { transform: scale(0); }
    100% { transform: scale(1); }
  }

  .text {
    font-size: 1.4rem;
    margin-top: 1rem;
    font-weight: bold;
  }

  .small {
    font-size: 1rem;
    margin-top: 0.5rem;
    color: gray;
  }
</style>
</head>

<body>
  <div class="container">
    <div class="circle">
      <div class="tick">✓</div>
    </div>

    <div class="text">Payment Successful</div>
    <div class="small" id="countText">
      Redirecting in <span id="count">5</span> seconds...
    </div>
    <!-- <div class="small">Redirecting...</div> -->
  </div>

<script>
  let c = 5;
  const countEl = document.getElementById("count");
  const countText = document.getElementById("countText");

  const timer = setInterval(() => {
    c--;
    countEl.innerText = c;

    if (c === 0) {
      clearInterval(timer);
      countText.innerText = "Redirecting to app...";
      window.location.href = "thatspe://payment-success";
    }
  }, 1000);
</script>

</body>
</html>

`;
}


module.exports = successHTML;