const path = require('path')
const fs = require('fs-extra')
const UPLOAD_DIR = path.resolve(__dirname,"..","target")

const extractExt = filename =>{
     return  filename.slice(filename.lastIndexOf("."),filename.length)
}

const resolvePost = req =>
    new Promise(resolve => {
        let chunk ='';
        req.on("data", data => {
            chunk += data
        });
        req.on("end", () => {
            resolve(JSON.parse(chunk));
        });
    });

module.exports = class  {
    async handleVerifyUpload(req,res){
        const data = await resolvePost(req)
        const {fileHash,filename} = data
        const ext = extractExt(filename)
        const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
        if(fs.existsSync(filePath)){
            res.end(JSON.stringify(
                {
                    shouldUpload: false
                }
            ))
        }else{
            res.end(JSON.stringify(
                {
                    shouldUpload: true,
                    uploadedList: []
                }
            ))
        }

    }
}
