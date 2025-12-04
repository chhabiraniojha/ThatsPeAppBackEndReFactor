const guidVideoModel=require('../../models/VideoModels/guidVideo')

exports.getGuidVideo=async (req,res)=>{

    try {
        const videoData=await guidVideoModel.findOne({
            where:{
                status:true 
            }
        })
        if(videoData){

            return res.status(200).json({ message: "Video details ", success: true, statuscode: 1 ,videoData});
        }
        
    } catch (error) {

        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
}