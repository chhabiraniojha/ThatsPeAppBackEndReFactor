const os = require('os');

// Function to get server IP address
const getServerIpAddress = () => {
  const interfaces = os.networkInterfaces();
  // console.log(interfaces)
  for (const interfaceName in interfaces) {
    for (const iface of interfaces[interfaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(iface.address)
        return iface.address;
      }
    }
  }
  return null; // Return null if no external IPv4 address is found
};
getServerIpAddress()
