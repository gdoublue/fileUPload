const path = require('path')
const fse = require('fs-extra')
const fileName = 'rainbow_flag_64px_1272259_easyicon'
// const fileName = 'IMG_20181014_173851'
const UPLOAD_DIR = path.resolve(__dirname,'.',"target")
// console.log(UPLOAD_DIR)
const filePath = path.resolve(UPLOAD_DIR,"..",`${fileName}.jpeg`)

const pipeStream=(path,writeStream)=>{
    new Promise(resolve => {
        // console.log("pipePath:",path);
        const readStream = fse.createReadStream(path);
        readStream.pipe(writeStream) 
        readStream.on("end",()=>resolve())
        fse.unlinkSync(path)
        
    })
}

const mergeFileChunk = async (filePath,fileName, size)=>{
    console.log(filePath,fileName, size)
    const chunkDir = path.resolve(UPLOAD_DIR,fileName)
    const chunkPaths = await fse.readdir(chunkDir)
    console.log(chunkPaths)  //[ 'yb-0', 'yb-1', 'yb-2' ]
    chunkPaths.sort((a,b)=>a.split('-')[1]-b.split('-')[1])

    await Promise.all(chunkPaths.map((chunkPath,index)=>{
        pipeStream(
            path.resolve(chunkDir,chunkPath),
            fse.createWriteStream(filePath,{
                start:index*size,
                end:(index+1)*size
            })
        )


    })).then(res=>{
        console.log('合并完成-+-',res.length);
        fse.remove(chunkDir,(err)=>{
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
mergeFileChunk(filePath,fileName,512*1024)
