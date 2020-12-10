const path = require('path')
const fs = require('fs-extra')
const multiparty = require('multiparty')
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
    async handleFormData(req,res){
        const multipart = new multiparty.Form()
        multipart.parse(req, async (err, fields, files) => {
            if (err) {
                console.error(err);
                res.status = 500;
                res.end("process file chunk failed");
                return;
            }

            const [chunk] = files.chunk;
            const [hash] = fields.hash;
            const [fileHash] = fields.fileHash;
            const [filename] = fields.filename;
            const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${extractExt(filename)}`)
            const chunkDir = path.resolve(UPLOAD_DIR, fileHash);
            if (fs.existsSync(filePath)) {
                res.end("file exist");
                return;
            }

            if(!fs.existsSync(chunkDir)) {// 如果目录地址有没有 target

                await fs.mkdirs(chunkDir);
            }
            if(fs.existsSync(path.resolve(chunkDir, hash))){
                res.end("existed file chunk");
            }else{
                await fs.move(chunk.path, path.resolve(chunkDir, hash));
                res.end("received file chunk");
            }

        })
    }
}
