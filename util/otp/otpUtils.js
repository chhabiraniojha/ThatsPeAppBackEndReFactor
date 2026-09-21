function generateRandomNumber() {
  const randomDecimal = Math.random();
  const randomNumber = Math.floor(randomDecimal * 900000) + 100000;
  return randomNumber;
}

function generateDateInTwoMinutes() {
  const currentDate = new Date();

  // Add 10 minutes
  currentDate.setMinutes(currentDate.getMinutes() + 10);

  return currentDate;
}

module.exports = {
  generateRandomNumber,
  generateDateInTwoMinutes,
};