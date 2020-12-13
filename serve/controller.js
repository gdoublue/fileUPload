const path = require('path')
const fs = require('fs-extra')
const multiparty = require('multiparty')
const UPLOAD_DIR = path.resolve(__dirname,"..","target")
const SIZE =  512*1024
const extractExt = filename =>{
     return  filename.slice(filename.lastIndexOf("."),filename.length)
}
const pipeStream=(path,writeStream)=>{
    return  new Promise(resolve => {
        const readStream = fs.createReadStream(path);
        readStream.pipe(writeStream)
        readStream.on("end",()=>{

            resolve()
        })

    })
}
const mergeFileChunk = async (filePath,fileName, size=SIZE)=>{  /*文件哈希作为文件夹名字*/
    const chunkDir = path.resolve(UPLOAD_DIR,fileName)
    const chunkPaths = await fs.readdir(chunkDir)
     //[ 'yb-0', 'yb-1', 'yb-2' ]  文件夹里面出所有片段  ,按序号排序
    chunkPaths.sort((a,b)=>a.split('-')[1]-b.split('-')[1])

    await Promise.all(chunkPaths.map((chunkPath,index)=>{
        pipeStream(
            path.resolve(chunkDir,chunkPath),
            fs.createWriteStream(filePath,{
                start:index*size,
                end:(index+1)*size
            })
        )


    })).then(res=>{
        console.log('合并完成-+-',res.length);
        fs.remove(chunkDir,(err)=>{
            if(err){
                return console.log("removeErro",err)
            }else{
                console.log('清空已完成目录')
            }
        })
    }).catch(er=>{
        console.log("catchErro",er)
    })


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
                    shouldUpload: false,
                    uploadedList:[]
                }
            ))
        }else{
            res.end(JSON.stringify(
                {
                    shouldUpload: true,
                    uploadedList: await  this.createUploadedList(fileHash)
                }
            ))
        }

    }
    async createUploadedList(fileHash){

              return  fs.existsSync(path.resolve(UPLOAD_DIR, fileHash)) ? await fs.readdir(path.resolve(UPLOAD_DIR, fileHash)) : [];

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
                res.end("**file**existed**");
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
    async handleMerge(req,res){
        const data = await resolvePost(req)
        const { fileHash, filename, size } = data
        const ext = extractExt(filename);
        const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`);
        await mergeFileChunk(filePath, fileHash, size);
        res.end(
            JSON.stringify({
                code: 0,
                message: "file merged success"
            })
        )
    }
}
