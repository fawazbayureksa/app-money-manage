// API Configuration
// Update this URL to match your backend server

export const API_CONFIG = {
  // Development - use your local IP for physical devices
  // Example: 'http://192.168.1.100:8080'
  BASE_URL: 'https://j14k7mlm-8080.asse.devtunnels.ms/api',
  
  // Production
  // BASE_URL: 'https://your-production-api.com',
  
  TIMEOUT: 10000, // 10 seconds
};

// For testing with physical devices on the same network:
// 1. Find your computer's IP address:
//    - macOS: System Preferences > Network
//    - Windows: ipconfig
//    - Linux: ifconfig or ip addr
// 2. Update BASE_URL to: 'http://YOUR_IP_ADDRESS:8080'
// 3. Make sure your backend is running and accessible

export default API_CONFIG;
