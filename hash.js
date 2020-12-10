self.importScripts('https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js')
self.onmessage = e=>{
    const { fileChunkList} = e.data
    const spark = new self.SparkMD5.ArrayBuffer()
    let percentage = 0
    let count = 0

    function loadNext (index){
        const reader = new FileReader(); //文件阅读对象
        reader.readAsArrayBuffer(fileChunkList[index].file);
        reader.onload = e=>{
            count ++ ;
            spark.append(e.target.result)
            if(count ===fileChunkList.length){
                self.postMessage({
                    percentage:100,
                    hash:spark.end()
                })
                self.close()
            }else{
                percentage = (count/fileChunkList.length).toFixed(2) * 100
                self.postMessage({
                    percentage
                })
                loadNext(count)
            }
        }
    }

    loadNext(0)
}
