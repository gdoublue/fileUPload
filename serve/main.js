const http = require("http");
const path = require("path");
const multiparty = require("multiparty");
const server = http.createServer();
const PORT = 3000;
const UPLOAD_DIR = path.resolve(__dirname,'.',"target")
const fse = require('fs-extra');
const SIZE =  512*1024

const pipeStream=(path,writeStream)=>{
  return  new Promise(resolve => {
    console.log('**88*')
    const readStream = fse.createReadStream(path);
    readStream.pipe(writeStream)
    readStream.on("end",()=>{
      console.log("readEnd")
     
      resolve("okreadS")
    })
      //  fse.unlinkSync(path)

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
const resolvePost = req =>
    new Promise(resolve => {
      let chunk ='';
      req.on("data", data => {
          chunk += data
       });
      req.on("end", () => {
        resolve(chunk);
       });
    });
server.on("request", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.url == "/upload") {
    const multipart = new multiparty.Form();

      multipart.parse(req, async (err, fields, files) => {
      if (err) return console.log("解析错误", err);
      // console.log("fields",fields);
      // console.log("----");
      // console.log(files);
        const [chunk]= files.chunk;
        const [filename] = fields.filename
        const dir_name = filename.split('-')[0]
        const chunkDir = path.resolve(UPLOAD_DIR,dir_name)
        if (!fse.existsSync(chunkDir)) {
          await fse.mkdirs(chunkDir);
        }
        // console.log(chunk.path);
        await fse.move(chunk.path, path.resolve(chunkDir,filename));
        console.log('upload完毕')
        res.end('upload!')
    });
  }else if (req.url == '/merge') {
    console.log('收到merge命令')
    // const filePath = path.resolve(UPLOAD_DIR,"..",`${fileName}.jpeg`)
    const data = await resolvePost(req);
    if(data){
      console.log('data--',data)
      const Jdata = JSON.parse(data)
      console.log(Jdata.fileName)
      console.log(`${Jdata.fileName}.${Jdata.fileType}`)
      const filePath = path.resolve(UPLOAD_DIR,"..",`${Jdata.fileName}.${Jdata.fileType}`)
      await  mergeFileChunk(filePath,Jdata.fileName,SIZE)
        console.log('merge了');
      res.end('merge ok');
    }
    res.end('merge 00');

  }
});

server.listen(PORT, () => {
  console.log("正在监听端口:", PORT);
});
