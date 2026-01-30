function pendingHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Payment Pending</title>

<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
  html {
    font-size: 16px;
  }

  body {
    background: #f9f9f9;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100%;
    font-family: Arial, sans-serif;
    margin: 0;
    scroll-behavior: none;
  }

  /* same 30% increase */
  .container {
    text-align: center;
    transform: scale(1.3);
  }

  .circle {
    width: 8rem;
    height: 8rem;
    background: #FFC107; /* YELLOW */
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: auto;
    animation: pop 0.5s ease-out;
  }

  .icon {
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
    font-size: 0.7rem;
    margin-top: 0.5rem;

    
    color: gray;
  }
</style>
</head>

<body>
  <div class="container">
    <div class="circle">
      <div class="icon">⏳</div>
    </div>

    <div class="text">Payment Pending</div>
    <div class="small">Please wait while we confirm your payment</div>
  </div>

<script>
  // Optional auto redirect (remove if not needed)
  setTimeout(() => {
    window.location.href = "thatspe://payment-pending";
  }, 5000);
</script>

</body>
</html>

`;
}

module.exports = pendingHTML;