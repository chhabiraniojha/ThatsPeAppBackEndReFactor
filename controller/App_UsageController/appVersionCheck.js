 exports.versionCheck= async (req, res) => {
    try {
        // Use dynamic import
        const gplayModule = await import('google-play-scraper');
        const gplay = gplayModule.default; // Access the default export
        const appData = await gplay.app({ appId: 'com.MyPay' });
       return res.json({success: true,statuscode:1, latestVersion: appData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false,statuscode:0,message: 'Failed to fetch version', });
    }
};