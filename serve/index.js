const http = require("http");
const server = http.createServer();
const PORT = 8008;
const Controller =require('./controller')
const controller = new Controller()
server.on("request", async (req, res)=>{
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    if (req.method === 'OPTIONS') {
        res.status = 200;
        res.end();
        return;
    }
    if (req.url == '/verify') {
        console.log('verify')
        await controller.handleVerifyUpload(req, res)
    }
    if(req.url == '/upload'){
        await  controller.handleFormData(req,res) /*处理上传来的片段*/
    }
    if(req.url == '/merge'){
        await  controller.handleMerge(req,res) /*处理上传来的片段*/
    }
})

server.listen(PORT, () => {
    console.log("正在监听端口:", PORT);
});